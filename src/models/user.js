const mongoose = require("mongoose");
const userRoles = ["root", "admin", "user"];

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  articles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
    },
  ],
  workshop: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
    },
  ],
  educations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Education",
    },
  ],
  role: {
    type: String,
    enum: userRoles,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
