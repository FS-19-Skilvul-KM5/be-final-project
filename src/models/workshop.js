const mongoose = require("mongoose");

const WorkshopSchema = new mongoose.Schema({
  title: { type: String, required: true },
  poster: {
    url: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
  },
  fasilitas: {
    type: Array,
    default: [],
  },
  materi: {
    type: Array,
    default: [],
  },
  tujuan: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  moderator: {
    type: Array,
    default: [],
  },
  peserta: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  narasumber: {
    type: Array,
    default: [],
  },
  date: { type: Date, require: true },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  timeZone: {
    type: String,
    default: "WIB",
  },
  location: { type: String, required: true },
  price: {
    type: String,
    default: "free",
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

const Workshop = mongoose.model("Workshop", WorkshopSchema);

module.exports = Workshop;
