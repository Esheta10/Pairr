const express = require("express")
const { userVerification: userAuth } = require("../middlewares/auth.middleware")
const profileController = require("../controllers/profile.controllers")

const router = express.Router();

// fetch profile details
router.get("/view", userAuth, profileController.viewProfile);

// update/edit profile details
router.patch("/edit", userAuth, profileController.updateProfile);

// update password only
router.patch("/password", userAuth, profileController.updatePassword);

module.exports =  router ;