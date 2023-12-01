const { v4: uuidv4 } = require("uuid");
const Article = require("../models/article");
const supabase = require("../../config/storageConnection");
const slugify = require("slugify");

const User = require("../models/user");
const { default: mongoose } = require("mongoose");

const getAllArticle = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { publication_date: -1 },
    };

    const articles = await Article.paginate({}, options);

    res.status(200).json(articles);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getLatestArticles = async (limit = 8) => {
  try {
    const latestArticles = await Article.find({})
      .limit(limit)
      .sort({ publication_date: -1 });

    return latestArticles;
  } catch (error) {
    console.error("Error fetching latest articles:", error);
    throw error;
  }
};


const getArticleRecommendations = async (req, res) => {
  try {

    const relatedArticles = await getLatestArticles();

    res.status(200).json(relatedArticles);
  } catch (error) {
    console.error("Error generating article recommendations:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
    const newArticle = req.file;

    if (!existingArticle) {
      return res.status(404).json({ error: "Article not found" });
    }

    existingArticle.title = title || existingArticle.title;

    if (newArticle) {
      const { error } = await supabase.storage
        .from("storage")
        .remove([`${existingArticle.content.path}`]);

      if (error) {
        return res.status(500).json({ error: "Error deleting workshop file" });
      }

      const { data } = await supabase.storage
        .from("storage")
        .upload(
          `article/${uuidv4()}-${newArticle.originalname}`,
          newArticle.buffer,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: newArticle.mimetype,
          }
        );

      const urlImage = supabase.storage.from("storage").getPublicUrl(data.path);

      existingArticle.content = {
        url: urlImage.data.publicUrl,
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
  getArticleRecommendations,
};
