const userModel = require("../models/user.model")
const connectionRequestModel = require("../models/connectionRequest.model")
const sessionModel = require("../models/session.model")


async function sendRequest(req,res){
    try {

        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        // You cannot send connection request to yourself
        if(fromUserId.toString() === toUserId){
            return res.status(403).json({message: "You cannot send connection request to yourself."})
        }

        // Check if toUser exists
        const toUser = await userModel.findById(toUserId);
        if(!toUser){
           return res.status(400).json({message: "User does not exist"});
        }

        // status check
        const ALLOWED_UPDATES = ["interested","ignore"];

        if(!ALLOWED_UPDATES.includes(status)){
            return res.status(400).json({message: "Invalid status type"});
        }

        // check if the connection is already extablished between sender and receiver, if so then forbade sending the request back again
        // from both sides
        const existingConnectionRequest = await connectionRequestModel.findOne({
            $or: [
                {fromUserId, toUserId},
                {fromUserId: toUserId, toUserId: fromUserId},
            ]
        })

        if(existingConnectionRequest){
            return res.status(400).json({message: "Connection was already established"});
        }

        // add connection request to db
        const connectionRequest = await connectionRequestModel.create({
            fromUserId,
            toUserId,
            status
        })

        res.status(200).json({
            message: `Connection established between ${req.user.firstName} and ${toUser.firstName} with status: ${status}`,
            connectionRequest: {
                fromUserId: connectionRequest.fromUserId,
                toUserId: connectionRequest.toUserId,
                status: connectionRequest.status,
            }
        })
    } catch(err){
        console.error(err);
        res.status(400).json({message: "Invalid operation"});
    }
}


async function reviewRequest(req, res){
    try {

        const loggedInUser = req.user; // jisse request mili hai review karne ke liye
        const {status, requestId} = req.params;

        // validate status
        const ALLOWED_STATUS = ["accept", "reject"];
        if(!ALLOWED_STATUS.includes(status)){
            return res.status(400).json({message: "Invalid status"})
        }

        // find and update the status of request from "interested" to either "accept" or "reject"
        const connectionRequest = await connectionRequestModel.findOneAndUpdate({
            _id: requestId,
            toUserId: loggedInUser._id,
            status: "interested",
        }, 
        {
            status: status,   
        },
        {
            new: true,  // return the updated document
        })

        // if request doesn't exist -> return connectionRequest not found
        if(!connectionRequest){
            return res.status(400).json({message: "Connection request doesn't exist or you are not authorized to review the request"});
        }
    
        return res.status(200).json({
            message: `Connection request status has been updated to ${status}`,
            connectionRequest: {
                id: connectionRequest._id,
                fromUserId: connectionRequest.fromUserId,
                toUserId: connectionRequest.toUserId,
                status: connectionRequest.status,
            }
        })
    } catch(error){
        return res.status(400).json({message: "Invalid operation"});
    }
}
module.exports = { sendRequest, reviewRequest };