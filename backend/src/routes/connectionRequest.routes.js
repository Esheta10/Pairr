const express = require("express");
const { userVerification: userAuth } = require("../middlewares/auth.middleware")
const userModel = require("../models/user.model")
const connectionRequestModel = require("../models/connectionRequest.model")
const connectionRequestController = require("../controllers/connectionRequest.controllers")


const router = express.Router();


// send request for the 1st time -> two available options -> ignore, interested
router.post("/send/:status/:toUserId", userAuth, connectionRequestController.sendRequest);

// review the request -> two available options -> accepted, rejected
router.post("/review/:status/:requestId", userAuth, connectionRequestController.reviewRequest);

module.exports = router;