const mongoose = require("mongoose")


const connectionRequestSchema = new mongoose.Schema({

    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    status: {
        type: String,
        enum: {
            values: ["accept", "ignore", "interested", "reject"],
        },
    }
}, { timestamps: true})

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1});

const connectionRequestModel = mongoose.model("connectionRequest", connectionRequestSchema);

module.exports = connectionRequestModel;