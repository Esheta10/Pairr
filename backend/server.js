const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Using Google DNS
require("dotenv").config(); // Load this first!
const express = require("express");
const connectDB = require("./src/config/db");
const app = require("./src/app");
const PORT = 5500;

app.use(express.json());

// Call connectDB after environment variables are loaded
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on PORT: ${PORT}`);
    });
});