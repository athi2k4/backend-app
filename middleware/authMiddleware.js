const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) return res.render("login");

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(401).send("Token expired.");
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };