const express = require("express");
const router = express.Router();
const {
  setUserRole,
  getUserById,
  getAllUser,
  getUsersByRole,
  resetUserRole,
  getUserByUsername,
  userSearch,
  updateUser,
} = require("../controllers/users");
const validateToken = require("../middleware/validateTokenHandler");

router.get("/search", validateToken, userSearch);
router.get("/by-username/:username", validateToken, getUserByUsername);
router.get("/by-role/:role", validateToken, getUsersByRole);
router.put("/:id/set-role", validateToken, setUserRole);
router.put("/:id/reset-role", validateToken, resetUserRole);
router.put("/:id", validateToken, updateUser);
router.get("/:id", validateToken, getUserById);
router.get("/", validateToken, getAllUser);

module.exports = router;
