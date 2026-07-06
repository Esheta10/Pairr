const express = require("express")
const userController = require("../controllers/user.controllers")
const userAuth = require("../middlewares/auth.middleware")

const router = express.Router();

// POST --> user registration or signing up for the 1st time
router.post("/signup", userController.createUser);

// POST --> user login
router.post("/login", userController.createLogin);

// GET ---> new refresh Token
router.get("/refresh-token", userAuth.userVerification , userController.createRefreshToken);

// GET --> logout
router.get("/logout", userAuth.userVerification, userController.userLogout);


module.exports = router;