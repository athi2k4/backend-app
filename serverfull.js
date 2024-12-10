const { MongoClient } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const url = "mongodb://localhost:27017";
const dbname = "million";
require("dotenv").config();

const TOKEN_EXPIRY = "1m"; 
let db;

// Middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB
MongoClient.connect(url)
    .then((client) => {
        db = client.db(dbname);
        app.locals.db = db;
        app.listen(3000, () => {
            console.log("Server running on port 3000 and connected to database");
        });
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

// Middleware to authenticate token
app.use(cookieParser());

function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) return res.status(401).send("Access denied. Token missing.");

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid or expired token.");
        req.user = user; // Attach user payload to the request
        next();
    });
}


// Routes

// Home route (Protected)
app.get("/", authenticateToken, (req, res) => {
    res.render("index", { user: req.user });
});

// Login route
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ username });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Generate JWT
            const token = jwt.sign({ id: user._id, username: user.username }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: TOKEN_EXPIRY,
            });

            // Send the token as a cookie and redirect
            res.cookie("token", token, { httpOnly: true }); // Secure the cookie
            res.redirect("/million");
        } else {
            res.status(401).send("Invalid credentials");
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Error logging in.");
    }
});


// Signup route
app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const usersCollection = db.collection("users");
        await usersCollection.insertOne({ username, password: hashedPassword });
        res.redirect("/login");
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).send("Error signing up.");
    }
});

// Protected route to fetch data
app.get("/million", authenticateToken, async (req, res) => {
    try {
        res.render("index", { user: req.user });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Error accessing the million page.");
    }
});

// Fetch paginated results (Protected)
app.get("/million/result", authenticateToken, async (req, res) => {
    try {
        const pageno =decodeURIComponent(req.query.pageno);
        const Organization = decodeURIComponent(req.query.Organization);
        const Rating = decodeURIComponent(req.query.Rating);
        const limit = 10;
        const filter = {};
        console.log(req.query);
        console.log(pageno,Organization)
        function ExtraCharacters(input) {
            //search for documents iwth speical characters  like / & \ too
            return input.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
        }

        if(Organization) {
            const org= ExtraCharacters(Organization)
            console.log(org);
            filter.Organization = { $regex: `${org}`, $options: "i" }; 
        }
        if (Rating) filter.Rating = parseFloat(Rating);

        const collection = db.collection("millions");
        const targetPage = parseInt(pageno, 10);
        const documentsToSkip = (targetPage - 1) * limit;

        const data = await collection.find(filter).skip(documentsToSkip).limit(limit).toArray();
        const totalDocuments = await collection.countDocuments(filter);
        const totalPages = Math.ceil(totalDocuments / limit);

        res.json({
            data,
            totalp: totalPages,
            currentp: targetPage,
            filter: { Organization, Rating },
            nextfinalID: data.length > 0 ? data[data.length - 1]._id : null,

        });
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).send("An error occurred while fetching data.");
    }
});

// Logout route
app.get("/logout", (req, res) => {
    res.clearCookie("token"); // Clear the JWT cookie
    res.redirect("/login"); // Redirect to login page
});


// Start the app
module.exports = app;
