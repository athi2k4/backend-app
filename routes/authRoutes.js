
const express = require("express");
//import all the functions from controller and route them to specific web adresses to access them
const { login, signup, logout, refreshToken } = require("../controllers/userController");

const router = express.Router();

router.get("/", (req,res)=>res.redirect("/login"));

router.get("/login", (req, res) => res.render("login"));
router.post("/login", login);

router.get("/signup", (req, res) => res.render("signup"));
router.post("/signup", signup);

router.get("/logout", logout);
router.post("/refresh",refreshToken);
module.exports = router;
