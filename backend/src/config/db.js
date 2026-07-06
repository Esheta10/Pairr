const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
    try {
        // Ensure MONGO_URI is actually loaded
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in your .env file");
        }
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected successfully...");
    } catch (err) {
        console.error("Database connection error details:", err.message);
        // Do not exit if you want to keep the server process alive, 
        // but note that the app won't work without a DB.
    }
}

module.exports = connectDB;