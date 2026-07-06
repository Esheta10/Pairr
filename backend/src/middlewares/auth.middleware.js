const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");

async function userVerification(req, res, next) {
    try {
        // Extract token (access token) from Authorization header
        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({ message: "Access token missing" });
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Destructure id and sessionId from decoded token
        const { id, sessionId } = decoded;
        
        // Check if session is revoked
        const session = await sessionModel.findById(sessionId);
        if (!session || session.revoked) {
            return res.status(401).json({ message: "Session has been revoked. Please login again." });
        }
        
        // Fetch the user from database using the id
        const user = await userModel.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Attach user data to request object
        req.user = user;
        
        // Call next to proceed to the route handler
        next();

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Access token expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
}

module.exports = { userVerification };