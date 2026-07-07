const userModel = require("../models/user.model")
const sessionModel = require("../models/session.model")
const connectionRequestModel = require("../models/connectionRequest.model")


async function pendingRequests(req,res){

    try{

        const loggedInUser = req.user;

        const connectionRequests = await connectionRequestModel.find({
            toUserId: loggedInUser._id,
            status: "interested"
        }).populate("fromUserId", ["firstName", "lastName", "photoURL", "age" , "skills"]);

        if(connectionRequests){
            res.status(200).json({
                message: "Requests fetched successfully!!!",
                connectionRequests,
            })
        }
    } catch(error){
        res.status(400).json({message: "Invalid Operation"})
    }
}

async function userConnections(req,res){

    try {

        const loggedInUser = req.user;

        // 1. Database se sirf wahi rows nikalo jo 'accepted' hain
        const connectionRequests = await connectionRequestModel.find({
            $or: [
                {   fromUserId: loggedInUser._id,
                    status: "accept",
                },
                {
                    toUserId: loggedInUser._id,
                    status: "accept"
                }
            ]
        })
        .populate("fromUserId", ["firstName", "lastName", "photoURL", "age", "skills"])
        .populate("toUserId", ["firstName", "lastName", "photoURL", "age", "skills"])

        const connections = connectionRequests.map((row) => {
            // Agar 'fromUserId' ki id humari id se match karti hai, toh 'toUserId' humare dost ki hai aur hume sirf usey return karna hai
            if(row.fromUserId._id.toString() === loggedInUser._id.toString()){
                return row.toUserId;
            }
            // Varna 'fromUserId' humara dost hai
            return row.fromUserId;
        })

        return res.status(200).json({
            message: "Connections fetched successfully",
            data: connections,
            })

    } catch(error){
        res.status(400).json({message: "Invalid operation"});
    }
}

async function getPublicFeed(req, res) {
    try {
        const loggedInUser = req.user;
        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 50 ? 50 : limit;
        const skip = (page - 1) * limit;

        // 1. Get all requests associated with the user
        const connectionRequests = await connectionRequestModel.find({
            $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }]
        }).select("fromUserId toUserId");

        // 2. Build the exclusion list
        const hideUsersFromFeed = new Set();
        connectionRequests.forEach((req) => {
            hideUsersFromFeed.add(req.toUserId.toString());
            hideUsersFromFeed.add(req.fromUserId.toString());
        });
        hideUsersFromFeed.add(loggedInUser._id.toString());

        // 3. Define the filter as an OBJECT (The proper MongoDB query)
        const filter = {
            _id: { $nin: Array.from(hideUsersFromFeed) }
        };

        // 4. Fetch the paginated data
        const newUsers = await userModel.find(filter)
            .select("firstName lastName age photoURL")
            .skip(skip)
            .limit(limit);

        // 5. Count total remaining users for this specific user
        const total = await userModel.countDocuments(filter);

        res.status(200).json({
            newUsers,
            page,
            limit,
            hasMore: skip + newUsers.length < total,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function findUserById(req,res){

    try{

        const id = req.params.id;

        const user = await userModel.findOne({ _id: id})

        if(!user){
            return res.status(404).json({message: "User cannot be found"})
        }

        res.status(200).json({
            message: "User details",
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                age: user.age,
                gender: user.gender
            }
        })

    } catch(err){
        res.status(400).json({message: "Invalid user details"})
    }
}

async function deleteUserById(req,res){

   try {
        const id = req.params.id;

        const user = await userModel.deleteOne({ _id: id})
        if(user.deletedCount===0){
            return res.status(400).json({meaasge: "User does not exist"})
        }

        res.status(200).json({
            message: "User has been deleted"
        })
   } catch(err){
    res.status(400).json({
        message: "Invalid Operation"
    })
   }
}

module.exports = { pendingRequests, userConnections, getPublicFeed , findUserById, deleteUserById};