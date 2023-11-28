const express = require("express");
const router = express.Router();
const {
  getEducationById,
  createEducation,
  deleteEducation,
  updateEducation,
  getAllEducation,
  getAllEducationByUser,
  searchEducation,
} = require("../controllers/educations");
const validateToken = require("../middleware/validateTokenHandler");

router.get("/", validateToken, getAllEducationByUser);
router.post("/", validateToken, createEducation);
router.put("/:id", validateToken, updateEducation);

router.get("/search", searchEducation);
router.get("/recommendation", getAllEducation);
router.get("/:id", getEducationById);
router.delete("/:id", validateToken, deleteEducation);

module.exports = router;
