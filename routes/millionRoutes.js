const express = require("express");
const { fetchmillion } = require("../controllers/millionController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/result", authenticateToken, fetchmillion);
router.get("/", authenticateToken, (req, res) => res.render("index", { user: req.user }));

module.exports = router;
