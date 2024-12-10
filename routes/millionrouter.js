const express = require("express");
const { fetchmillion } = require("../controller/millioncontroller");
const jwt=require("jsonwebtoken");
const router = express.Router();



//here the cookie is read and data is taken from it and jwt is verified
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    // If there is no token, return a 401 Unauthorized response.
    if (!token) return res.status(401).send("Access denied. Token missing.");

    // Verify the token using the ACCESS_TOKEN_SECRET environment variable.
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // If there is an error, return a 403 Forbidden response.
        if (err) return res.status(403).send("Invalid or expired token.");

        // Set the req.user property to the user payload from the token.
        req.user = user;

        // Call the next middleware function in the stack.
        next();
    });
};

//route the functions to specific web adresses
router.get("/", authenticateToken, (req, res) => res.render("index", { user: req.user }));
router.get("/result", authenticateToken, fetchmillion);

module.exports = router;
