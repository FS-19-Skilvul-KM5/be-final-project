const Article = require("../models/article");
const Education = require("../models/education");
const User = require("../models/user");
const Workshop = require("../models/workshop");
const supabase = require("../../config/storageConnection");
const { default: mongoose } = require("mongoose");

const setUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    const currentUser = await User.findById(req.user.id);

    if (!currentUser || currentUser.role != "root") {
      return res
        .status(403)
        .json({ erorr: "Access forbidden. Requires root role." });
    }

    if (!user) {
      return res.status(404).json({ erorr: "user not found." });
    }

    if (!user || user.role == "admin") {
      return res.status(403).json({ erorr: "User allready admin." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role: "admin" } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User role updated successfully", updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.role !== "root") {
      return res
        .status(403)
        .json({ error: "Access forbidden. Requires root role." });
    }

    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const handleDeleteError = (message) => {
  throw new Error(message);
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    for (const educationId of user.educations) {
      await Education.findByIdAndDelete(educationId);
    }

    const populatedWorkshop = await Workshop.find({
      _id: { $in: user.workshop },
    });
    user.workshop = populatedWorkshop;

    const populatedArticles = await Article.find({
      _id: { $in: user.articles },
    });
    user.articles = populatedArticles;

    await Promise.all(
      user.workshop.map(async (element) => {
        const workshop = await supabase.storage
          .from("storage")
          .remove([`${element.poster.path}`]);

        if (workshop.error) {
          handleDeleteError("Error deleting workshop file");
        }

        await Workshop.findByIdAndDelete(element._id);
      })
    );

    await Promise.all(
      user.articles.map(async (element) => {
        const articles = await supabase.storage
          .from("storage")
          .remove([`${element.content.path}`]);
        const image = await supabase.storage
          .from("storage")
          .remove([`${element.image.path}`]);

        if (articles.error || image.error) {
          handleDeleteError("Error deleting articles file");
        }

        await Article.findByIdAndDelete(element._id);
      })
    );

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userProfile = await User.findById(userId);

    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const populatedWorkshop = await Workshop.find({
      _id: { $in: userProfile.workshop },
    });
    userProfile.workshop = populatedWorkshop;

    const populatedEducations = await Education.find({
      _id: { $in: userProfile.educations },
    });
    userProfile.educations = populatedEducations;

    const populatedArticles = await Article.find({
      _id: { $in: userProfile.articles },
    });
    userProfile.articles = populatedArticles;
    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUsersByRole = async (req, res) => {
  try {
    const role = "admin";

    const users = await User.find({ role });

    res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const resetUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.role != "root") {
      return res
        .status(403)
        .json({ error: "Access forbidden. Requires root role." });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.role != "admin") {
      return res.status(403).json({ error: "User alleready admin." });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role: "user" } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User role reset to default successfully",
      updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserByUsername = async (req, res) => {
  try {
    const username = req.params.username;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const userSearch = async (req, res) => {
  const { q } = req.query;

  try {
    const users = await User.find({
      username: { $regex: new RegExp(q, "i") },
    }).limit(4);
    res.json(users);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    existingUser.username = username || existingUser.username;

    await existingUser.save();

    return res
      .status(200)
      .json({ message: "User updated successfully", user: existingUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  setUserRole,
  getUserById,
  getAllUser,
  deleteUser,
  getUsersByRole,
  resetUserRole,
  getUserByUsername,
  userSearch,
  getUserProfile,
  updateUser,
};
