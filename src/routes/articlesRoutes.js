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
} = require("../controllers/articles");
const multer = require("multer");

const storage = multer.memoryStorage(); // Simpan file di dalam memori
const upload = multer({ storage: storage });
const validateToken = require("../middleware/validateTokenHandler");

router.get("/recommendation", getAllArticle);
router.get("/search", searchArticle);
router.get("/", getAllArticleByUser);
router.get("/:id", getArticleById);

router.post("/", validateToken, upload.array("files", 2), createArticle);
router.delete("/:id", validateToken, deleteArticle);
router.put("/:id", validateToken, upload.array("files", 2), updateArticle);

module.exports = router;
