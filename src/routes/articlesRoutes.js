const express = require("express");
const router = express.Router();
const {
  getArticleById,
  createArticle,
  deleteArticle,
  updateArticle,
  getAllArticle,
  getAllArticleByUser,
  searchArticle,
  getArticleRecommendations,
} = require("../controllers/articles");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const validateToken = require("../middleware/validateTokenHandler");

router.get("/recommendations", getArticleRecommendations);

router.get("/", getAllArticle);

router.get("/search", searchArticle);
router.get("/user", getAllArticleByUser);
router.get("/:id", getArticleById);

router.post("/", validateToken, upload.array("files", 2), createArticle);
router.put("/:id", validateToken, upload.single("files"), updateArticle);
router.delete("/:id", validateToken, deleteArticle);

module.exports = router;
