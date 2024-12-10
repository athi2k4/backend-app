
//express is used to  help bbuild the web app as it can 
//handle routing, middleware and templates in a robust way
const express = require("express");
//parses incoming request bodies and makes them 
//available as objects in the req. body property
const bodyParser = require("body-parser");
//middleware that simplifies handling cookies
const cookieParser = require("cookie-parser");
//using mongoclient to access the db instead 
//of mongoose to prevent overhead
const { MongoClient } = require("mongodb");
//used to stpre sensistive info in .env
// and access it from there
require("dotenv").config();

//import the routes to access them
const userRoutes = require("./routes/userrouter");
const millionRoutes = require("./routes/millionrouter");
//create app and assign database link to url
const app = express();
const url = "mongodb://localhost:27017";
const dbname = "million";

let db;

// middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// routes
app.use("/", userRoutes);
app.use("/million", millionRoutes);

// connect with MongoDB
MongoClient.connect(url)
    .then((client) => {
        db = client.db(dbname);
        app.locals.db = db;
        app.listen(3000, () => {
            console.log("database connected");
        });
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });
