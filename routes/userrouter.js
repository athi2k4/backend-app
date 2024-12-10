const express = require("express");
//import all the functions from controller and route them to specific web adresses to access them
const { login, signup, logout } = require("../controller/usercontroller");

const router = express.Router();

router.get("/login", (req, res) => res.render("login"));
router.post("/login", login);

router.get("/signup", (req, res) => res.render("signup"));
router.post("/signup", signup);

router.get("/logout", logout);

module.exports = router;
