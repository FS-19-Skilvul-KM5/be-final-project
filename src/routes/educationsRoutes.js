const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  getEducationById,
  createEducation,
  deleteEducation,
  updateEducation,
  getAllEducation,
  getAllEducationByUser,
  searchEducation,
  getEducationRecommendations,
} = require("../controllers/educations");
const validateToken = require("../middleware/validateTokenHandler");

router.get("/:educationId/recommendations", getEducationRecommendations);
router.get("/", getAllEducation);

router.get("/user", validateToken, getAllEducationByUser);
router.post("/", validateToken, upload.single("files"), createEducation);
router.put("/:id", validateToken, upload.single("files"), updateEducation);

router.get("/search", searchEducation);
router.get("/recommendation", getAllEducation);
router.get("/:id", getEducationById);
router.delete("/:id", validateToken, deleteEducation);

module.exports = router;
