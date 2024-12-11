
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const millionRoutes = require("./routes/millionRoutes");

const app = express();
const url = "mongodb://localhost:27017";
const dbname = "million";
let db;

// Middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Connect to MongoDB
MongoClient.connect(url)
    .then((client) => {
        db = client.db(dbname);
        app.locals.db = db; // Make the database accessible in routes
        app.listen(3000, () => {
            console.log("Server running on port 3000 and connected to database");
        });
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

// Routes
app.use("/auth", authRoutes);
app.use("/million", millionRoutes);

// Default route
app.get("/", (req, res) => {
    res.send("Welcome to the API");
});

module.exports = app;
