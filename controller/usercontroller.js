//used to handle the login signup and logout fucntions that
// have to be handled before being able to access that database

//bcyrrpt is used to encrypt the password
const bcrypt = require("bcrypt");
//jwt is used to sign the token
const jwt = require("jsonwebtoken");

const TOKEN_EXPIRY = "10s";
//arrow function is used to handle login
const login = async (req, res) => {
    //obatains the uname and pass from the request body

    try {
        const { username, password } = req.body;
        const db = req.app.locals.db;
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ username });

        if (user && (await bcrypt.compare(password, user.password))) {
            //sign is used to sign the token and authenticate it which is hen sent as cookies
            // to the client and accessed in ''/million''
            const token = jwt.sign(
                { id: user._id, username: user.username },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );
                //send the token as cookie
            res.cookie("token", token, { httpOnly: true });
            res.redirect("/million"); // Redirect to protected route
        } else {
            res.status(401).send("Invalid credentials"); // Unauthorized access
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Error logging in.");
    }
};

//used to register a user into the database using bcrypt
const signup = async (req, res) => {
    const { username, password } = req.body;
    const db = req.app.locals.db;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const usersCollection = db.collection("users");
        await usersCollection.insertOne({ username, password: hashedPassword });
        res.redirect("/login");
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).send("Error signing up.");
    }
};
//logsout of the current user session
const logout = (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
};

module.exports = { login, signup, logout };

/*
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRY = "10s"; // Access token expiry
const REFRESH_TOKEN_EXPIRY = "7d"; // Refresh token expiry

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, username: user.username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    const refreshToken = jwt.sign(
        { id: user._id, username: user.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    return { accessToken, refreshToken };
};

// Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = req.app.locals.db;
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ username });
        if (user && (await bcrypt.compare(password, user.password))) {
            const { accessToken, refreshToken } = generateTokens(user);

            await usersCollection.updateOne(
                { _id: user._id },
                { $set: { accessToken } }
            );

            res.cookie("token", accessToken, { httpOnly: true });
            res.cookie("refreshToken", refreshToken, { httpOnly: true });
            res.redirect("/million");
        } else {
            res.status(401).send("Invalid credentials");
        }
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).send("Error logging in.");
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    const db = req.app.locals.db;
    const usersCollection = db.collection("users");
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        console.error("No refresh token provided");
        return res.status(401).send("No refresh token provided");
    }

    try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log("Decoded payload:", payload);

        const user = await usersCollection.findOne({ _id: payload.id });
        console.log("Database user:", user);

        if (!user || user.refreshToken !== refreshToken) {
            console.error("Token mismatch. DB:", user?.refreshToken, "Cookie:", refreshToken);
            return res.status(403).send("Invalid refresh token");
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { refreshToken: newRefreshToken } }
        );

        res.cookie("token", accessToken, { httpOnly: true });
        res.cookie("refreshToken", newRefreshToken, { httpOnly: true });

        res.status(200).send("Tokens refreshed");
    } catch (err) {
        console.error("Refresh token error:", err.message);
        res.status(403).send("Invalid refresh token");
    }
};

// Signup
const signup = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const db = req.app.locals.db;
        const usersCollection = db.collection("users");

        await usersCollection.insertOne({ username, password: hashedPassword });
        res.redirect("/login");
    } catch (err) {
        console.error("Signup error:", err.message);
        res.status(500).send("Error signing up.");
    }
};

// Logout
const logout = async (req, res) => {
    const db = req.app.locals.db;
    const { refreshToken } = req.cookies;

    if (refreshToken) {
        await db.collection("users").updateOne(
            { refreshToken },
            { $unset: { refreshToken: "" } }
        );
    }

    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.redirect("/login");
};

module.exports = { login, signup, logout, refreshToken, generateTokens };
*/