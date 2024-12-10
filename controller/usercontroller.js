//used to handle the login signup and logout fucntions that
// have to be handled before being able to access that database

//bcyrrpt is used to encrypt the password
const bcrypt = require("bcrypt");
//jwt is used to sign the token
const jwt = require("jsonwebtoken");

const TOKEN_EXPIRY = "1m";
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
