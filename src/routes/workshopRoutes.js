const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  getWorkshopById,
  createWorkshop,
  deleteWorkshop,
  searchWorkshop,
  getAllWorkshopByUser,
  getAllWorkshop,
  createPeserta,
  updateWorkshop,
} = require("../controllers/workshop");
const validateToken = require("../middleware/validateTokenHandler");

router.get("/recommendation", getAllWorkshop);
router.get("/search", searchWorkshop);
router.get("/", getAllWorkshopByUser);
router.post("/:id/peserta", validateToken, createPeserta);
router.get("/:id", getWorkshopById);
router.post("/", validateToken, upload.single("files"), createWorkshop);
router.put("/:id", validateToken, upload.single("files"), updateWorkshop);
router.delete("/:id", validateToken, deleteWorkshop);

module.exports = router;
