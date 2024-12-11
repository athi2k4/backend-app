
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const TOKEN_EXPIRY = "10h";
const REFRESH_TOKEN_EXPIRY = "1d";

// Login
const login = async (req, res) => {
    const { username, password } = req.body;
    const db = req.app.locals.db;
    const usersCollection = db.collection("users");

    try {
        const user = await usersCollection.findOne({ username });
        if (user && (await bcrypt.compare(password, user.password))) {
            const accessToken = jwt.sign(
                { id: user._id, username: user.username },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );

            const refreshToken = jwt.sign(
                { id: user._id, username: user.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: REFRESH_TOKEN_EXPIRY }
            );

            await usersCollection.updateOne({ username }, { $set: { refreshToken } });
            res.cookie("token", accessToken, { httpOnly: true, secure: true });
            res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });
            res.redirect("/million");
        } else {
            res.status(401).send("Invalid credentials");
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Error logging in.");
    }
};

// Signup
const signup = async (req, res) => {
    const { username, password } = req.body;
    const db = req.app.locals.db;
    const usersCollection = db.collection("users");

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await usersCollection.insertOne({ username, password: hashedPassword });
        res.redirect("/auth/login");
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).send("Error signing up.");
    }
};

// Refresh Token
const refreshToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).send("Refresh token missing");
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send("Invalid or expired refresh token");
        }

        const newAccessToken = jwt.sign(
            { id: user.id, username: user.username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        res.cookie("token", newAccessToken, { httpOnly: true, secure: true });
        res.send({ accessToken: newAccessToken });
    });
};
const logout = (req, res) => {
    res.clearCookie("token");
    res.redirect("/auth/login");
};

module.exports={login,signup,refreshToken,logout};