const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: {
    url: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
  },
  content: {
    url: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  publication_date: { type: Date, default: Date.now },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
