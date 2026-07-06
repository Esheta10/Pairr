const userModel = require("../models/user.model")
const sessionModel = require("../models/session.model")
const crypto = require("crypto");

async function viewProfile(req,res){

    const user = req.user;
    const safeUser = user.toObject ? user.toObject() : Object.assign({}, user);
    delete safeUser.password;
    res.send(safeUser);
}

async function updateProfile(req, res){

    try {

        const user = req.user;
        if(!user){
            return res.status(404).json({ message: "User does not exist" })
        }

        const data = req.body || {};
        const updates = Object.keys(data); // fields sent by client
        const ALLOWED_UPDATES = ["age","about","skills","photoURL","gender"];

        const isUpdatesAllowed = updates.every((k) => ALLOWED_UPDATES.includes(k));
        if(!isUpdatesAllowed){
            throw new Error("Updates are not allowed");
        }

        // Use the current user's id
        const id = user._id;

        // 1. Pass 'id' and 'data'
        // 2. Add { new: true } to return the updated user object
        // 3. Added { runValidators: true } to ensure updates follow your schema
        const updatedUser = await userModel.findByIdAndUpdate(id, data,{
            new: true,
            runValidators: true
        })

        if(!updatedUser){
            return res.status(404).json({ message: "User does not exist" })
        }

        res.status(200).json({
            message: "User updated successfully",
            user: {
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                age: updatedUser.age,
                gender: updatedUser.gender,
                skills: updatedUser.skills
                },
        })
    } catch(err){
        res.status(400).json({message: "Invalid operation"})
    }
}

async function updatePassword(req, res){
    try {
        const user = req.user;
        if(!user){
            return res.status(404).json({ message: "User does not exist" })
        }

        const { currentPassword, newPassword, confirmPassword } = req.body || {};
        if(!currentPassword || !newPassword || !confirmPassword){
            return res.status(400).json({ message: "currentPassword, newPassword and confirmPassword are required" });
        }

        if(newPassword !== confirmPassword){
            return res.status(400).json({ message: "New password and confirm password must match" });
        }

        const currentHashedPassword = crypto.createHash("sha256").update(currentPassword).digest("hex");
        if(currentHashedPassword !== user.password){
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const currentNewPassword = crypto.createHash("sha256").update(newPassword).digest("hex");
        user.password = currentNewPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch(err){
        res.status(400).json({ message: "Invalid operation" });
    }
}

module.exports = {viewProfile, updateProfile, updatePassword};