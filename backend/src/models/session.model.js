const mongoose = require("mongoose")

/**
 * user ---> refrences userSchema
 * refreshtokenHash
 * ip
 * userAgent
 */
const sessionSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "user is required"]
    }, 
    refreshTokenHash: {

        type: String,
        required: [true, "refresh token is required"]
    },
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const sessionModel = new mongoose.model("session",sessionSchema)

module.exports = sessionModel;