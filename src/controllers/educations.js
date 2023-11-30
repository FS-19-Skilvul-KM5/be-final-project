const Education = require("../models/education");
const User = require("../models/user");
const { default: mongoose } = require("mongoose");
const supabase = require("../../config/storageConnection");
const { v4: uuidv4 } = require("uuid");

const getAllEducationByUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("educations");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user.educations);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const searchEducation = async (req, res) => {
  const { q } = req.query;

  try {
    const education = await Education.find({
      title: { $regex: new RegExp(q, "i") },
    }).limit(4);

    res.json(education);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllEducation = async (req, res, latest = true) => {
  try {
    const educations = await Education.find()
      .sort({ publication_date: -1 })
      .exec();

    res.status(200).json(educations);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getEducationById = async (req, res) => {
  try {
    const educationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(educationId)) {
      return res.status(400).json({ error: "ID education tidak valid" });
    }

    const education = await Education.findById(educationId);

    if (!education) {
      return res.status(404).json({ error: "education tidak ditemukan" });
    }

    res.status(200).json(education);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createEducation = async (req, res) => {
  try {
    const { title, url } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }
    const image = req.file;

    const { data, error } = await supabase.storage
      .from("storage")
      .upload(`image/${uuidv4()}-${image.originalname}`, image.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: image.mimetype,
      });

    if (error) return res.status(500).json({ error: "Internal server error!" });

    const urlImage = supabase.storage.from("storage").getPublicUrl(data.path);

    const newEducation = new Education({
      author: req.user.id,
      title,
      video: url,
      image: {
        url: urlImage.data.publicUrl,
        path: data.path,
      },
    });
    const savedEducation = await newEducation.save();

    const educationId = savedEducation._id;

    const user = await User.findById(req.user.id);

    if (user) {
      user.educations.push(educationId);
      await user.save();
    }

    res.status(201).json(savedEducation);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteEducation = async (req, res) => {
  try {
    const educationId = req.params.id;
    const education = await Education.findById(educationId);

    if (!mongoose.Types.ObjectId.isValid(educationId)) {
      return res.status(400).json({ error: "ID education tidak valid" });
    }

    if (!education) {
      return res.status(404).json({ error: "Education tidak ditemukan" });
    }

    const { error } = await supabase.storage
      .from("storage")
      .remove([`${education.image.path}`]);

    if (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!education.author) {
      return res
        .status(400)
        .json({ error: "Pemilik education tidak ditemukan" });
    }

    if (req.user.id != education.author.toString()) {
      return res.status(400).json({ error: "Anda bukan pemilik education" });
    }

    const deletedEducation = await Education.findOneAndDelete({
      _id: educationId,
    });

    const user = await User.findById(req.user.id);
    if (user) {
      user.educations = user.educations.filter(
        (education) => education._id.toString() !== educationId
      );
      await user.save();
    }
    res
      .status(200)
      .json({ message: "Education berhasil dihapus", deletedEducation });
  } catch (error) {
    console.error("Error in deleteEducation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateEducation = async (req, res) => {
  try {
    const educationId = req.params.id;
    const { title, url } = req.body;
    const newImage = req.file;

    if (!mongoose.Types.ObjectId.isValid(educationId)) {
      return res.status(400).json({ error: "ID Education tidak valid" });
    }

    const education = await Education.findById(educationId);

    if (!education) {
      return res.status(404).json({ error: "Education tidak ditemukan" });
    }

    if (req.user.id != education.author.toString()) {
      return res.status(400).json({ error: "Anda bukan pemilik education" });
    }

    if (newImage) {
      const { error } = await supabase.storage
        .from("storage")
        .remove([`${education.image.path}`]);

      if (error) {
        return res.status(500).json({ error: "Error deleting workshop file" });
      }

      const { data } = await supabase.storage
        .from("storage")
        .upload(`image/${uuidv4()}-${newImage.originalname}`, newImage.buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: newImage.mimetype,
        });

      const urlImage = supabase.storage.from("storage").getPublicUrl(data.path);

      education.image = {
        url: urlImage.data.publicUrl,
        path: data.path,
      };
    }

    if (title !== undefined && title !== null && title !== "") {
      education.title = title;
    }

    if (url !== undefined && url !== null && url !== "") {
      education.video = url;
    }

    education.updatedAt = new Date();

    const updatedEducation = await education.save();
    res
      .status(200)
      .json({ message: "Education berhasil diupdate", updatedEducation });
  } catch (error) {
    console.error("Error in updateEducation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllEducationByUser,
  getAllEducation,
  getEducationById,
  createEducation,
  deleteEducation,
  updateEducation,
  searchEducation,
};
