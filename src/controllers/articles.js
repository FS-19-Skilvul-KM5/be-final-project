const { v4: uuidv4 } = require("uuid");
const Article = require("../models/article");
const supabase = require("../../config/storageConnection");
const slugify = require("slugify");

const User = require("../models/user");
const { default: mongoose } = require("mongoose");

const getAllArticle = async (req, res) => {
  try {
    const article = await Article.find()
      .sort({ publication_date: -1 })
      .limit(4);

    res.status(200).json(article);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllArticleByUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("articles");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user.articles);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getArticleById = async (req, res) => {
  try {
    const articleId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ error: "ID Article tidak valid" });
    }

    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({ error: "Article tidak ditemukan" });
    }
    res.status(200).json(article);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createArticle = async (req, res) => {
  try {
    const { title } = req.body;
    const image = req.files[0];
    const article = req.files[1];

    const dataImage = await supabase.storage
      .from("storage")
      .upload(`image/${uuidv4()}-${image.originalname}`, image.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: image.mimetype,
      })
      .catch((error) => {
        console.error("Supabase Storage Error:", error);
        throw error;
      });

    const dataArticle = await supabase.storage
      .from("storage")

      .upload(
        `article/${uuidv4()}-${slugify(article.originalname)}`,
        article.buffer,
        {
          contentType: article.mimetype,
        }
      );

    const urlImage = supabase.storage
      .from("storage")
      .getPublicUrl(dataImage.data.path);

    const urlArticle = supabase.storage
      .from("storage")
      .getPublicUrl(dataArticle.data.path);

    const newArticle = new Article({
      author: req.user.id,
      title,
      image: {
        url: urlImage.data.publicUrl,
        path: dataImage.data.path,
      },
      content: {
        url: urlArticle.data.publicUrl,
        path: dataArticle.data.path,
      },
    });

    const savedArticle = await newArticle.save();

    const articleId = savedArticle._id;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Author not found" });
    }

    user.articles.push(articleId);
    await user.save();

    res.status(201).json({ savedArticle });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const article = await Article.findById(articleId);
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ error: "ID article tidak valid" });
    }

    const image = await supabase.storage
      .from("storage")
      .remove([`${article.image.path}`]);

    const articles = await supabase.storage
      .from("storage")
      .remove([`${article.content.path}`]);

    if (articles.error || image.error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (req.user.id != article.author.toString()) {
      return res.status(400).json({ error: "Anda bukan pemilik article" });
    }
    const deletedArticle = await Article.findOneAndDelete({ _id: articleId });

    const user = await User.findById(req.user.id);
    if (user) {
      user.articles = user.articles.filter(
        (article) => article._id.toString() !== articleId
      );
      await user.save();
    }
    res
      .status(200)
      .json({ message: "Article berhasil dihapus", deletedArticle });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateArticle = async (req, res) => {
  try {
    const { title } = req.body;

    const articleId = req.params.id;

    const existingArticle = await Article.findById(articleId);

    if (!existingArticle) {
      return res.status(404).json({ error: "Article not found" });
    }

    existingArticle.title = title || existingArticle.title;

    const newImage = req.files[0];
    const newArticleFile = req.files[1];

    if (newImage) {
      const deleteArticleImage = await supabase.storage
        .from("storage")
        .remove([`${existingArticle.image.path}`]);

      if (deleteArticleImage.error) {
        return res.status(500).json({ error: "Error deleting workshop file" });
      }

      const { data, error } = await supabase.storage
        .from("storage")
        .upload(`image/${uuidv4()}-${newImage.originalname}`, newImage.buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: newImage.mimetype,
        });

      const urlImage = supabase.storage.from("storage").getPublicUrl(data.path);

      existingArticle.image = {
        url: urlImage.data.publicUrl,
        path: data.path,
      };
    }

    if (newArticleFile) {
      const deleteArticle = await supabase.storage
        .from("storage")
        .remove([`${existingArticle.content.path}`]);

      if (deleteArticle.error) {
        return res.status(500).json({ error: "Error deleting workshop file" });
      }

      const { data, error } = await supabase.storage
        .from("storage")
        .upload(
          `article/${uuidv4()}-${slugify(newArticleFile.originalname)}`,
          newArticleFile.buffer,
          {
            contentType: newArticleFile.mimetype,
          }
        );

      const urlArticle = supabase.storage
        .from("storage")
        .getPublicUrl(data.path);

      existingArticle.content = {
        url: urlArticle.data.publicUrl,
        path: data.path,
      };
    }

    const updatedArticle = await existingArticle.save();

    res
      .status(200)
      .json({ message: "Article updated successfully", updatedArticle });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const searchArticle = async (req, res) => {
  const { q } = req.query;
  try {
    const articles = await Article.find({
      title: { $regex: new RegExp(q, "i") },
    });

    res.json(articles);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllArticle,
  getArticleById,
  createArticle,
  deleteArticle,
  updateArticle,
  getAllArticleByUser,
  searchArticle,
};