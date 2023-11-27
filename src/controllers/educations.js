const Education = require("../models/education");
const User = require("../models/user");
const { default: mongoose } = require("mongoose");

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

const getAllEducation = async (latest = true, res, req) => {
  try {
    const educations = await Education.find()
      .sort({ publication_date: -1 })
      .limit(4);

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
    const newEducation = new Education({
      author: req.user.id,
      title,
      video: url,
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
