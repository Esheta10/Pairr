const express = require("express")
const { userVerification: userAuth } = require("../middlewares/auth.middleware")
const userFeedController = require("../controllers/feed.controllers")

const router = express.Router();

// GET -> get all the pending requests received by the user
router.get("/requests/received", userAuth, userFeedController.pendingRequests);

// GET -> get all the pending requests received by the user
router.get("/connections", userAuth, userFeedController.userConnections);

// GET -> get the feed of logged-in user, it should not contain profiles who have accepted/rejected the request, ignored it or is in pending state
router.get("/feed", userAuth, userFeedController.getPublicFeed)

// GET --> find user by id
router.get("/:id", userAuth, userFeedController.findUserById);

// DELETE --> delete user by id
router.delete("/:id", userAuth, userFeedController.deleteUserById);

module.exports = router;

