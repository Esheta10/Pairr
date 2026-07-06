require("dotenv").config()
const express = require("express")
const connectDB = require("./src/config/db")
const app = require("./src/app")
const PORT = 5500;

app.use(express.json())

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
})