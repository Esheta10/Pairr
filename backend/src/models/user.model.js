const mongoose = require("mongoose")
const validator = require("validator")

/**
 * firstName
 * lastName
 * email
 * password
 * age
 * gender
 */
const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type:String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // email should be unique
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid email: "+ value);
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
    },
    gender: {
        type: String,
        enum: {
            values: ["Male", "Female", "Others"],
            message: '{VALUE} is not a valid gender type'
        },
    },
    photoURL: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/thumbnails/051/498/303/small/social-media-chatting-online-default-male-blank-profile-picture-head-and-body-icon-people-standing-icon-grey-background-free-vector.jpg",
    },
    about: {
        type: String,
        default: "I am awesome",
    },
    skills: {
        type: [String],
    }

}, {timestamps: true})

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;