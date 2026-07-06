const express = require("express")
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth.routes")
const profileRouter = require("./routes/profile.routes")
const connectionRequestRouter = require("./routes/connectionRequest.routes")
const userRouter = require("./routes/userFeed.routes")

const app = express();
app.use(express.json())
app.use(cookieParser())
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = new Set([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://pairr-ui.onrender.com" // Replace with your actual frontend URL
    ]);

    // Only set the header if the origin is in our allowed list
    if (origin && allowedOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});


app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/request", connectionRequestRouter);
app.use("/api/user", userRouter);

module.exports = app;
