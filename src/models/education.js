const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const EducationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  video: { type: String, required: false },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
EducationSchema.plugin(mongoosePaginate);

const Education = mongoose.model("Education", EducationSchema);

module.exports = Education;
