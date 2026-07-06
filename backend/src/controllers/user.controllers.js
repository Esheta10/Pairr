const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const userModel = require("../models/user.model")
const sessionModel = require("../models/session.model")
const jwt = require("jsonwebtoken")

async function createUser(req,res){

   try {
        
        const {firstName, lastName, email, password, age, gender, skills} = req.body;

        // Check if user already exists
        const existingUser = await userModel.findOne({email})
        if(existingUser){
            return res.status(409).json({message: "User already exists"});
        }
        
        // Hash the password
        // Method-1 : Using crypto package
        const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

        // Method-2: Using bcryptjs package
        // const hashedPassword = await bcrypt.hash(password, 10);

        // Save the newUser to db
        const newUser = await userModel.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            age,
            gender,
            skills
        })

        res.status(200).json({
        message: "User registered successfully",
        user: {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            age: newUser.age,
            gender: newUser.gender
        }
    })
   } catch(err){

        res.status(400).json({message: "User could not be registered"})
   }
}

// Helper function
const cookieOptions = {
    httpOnly: true,
    secure: true,        // Required for HTTPS
    sameSite: "none",    // REQUIRED for cross-origin (Frontend <-> Backend)
    path: "/"            // Ensures the cookie is sent for all API routes
};
async function createLogin(req, res){

    try{

        const {email, password} = req.body;

        // Validating email 
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(400).json({message: "Invalid credentials"})
        }
        // Validating password
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        // if(!isPasswordValid){
        //     return res.status(400).json({message: "Invalid credentials"})
        // }

        const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
        const isPasswordValid = hashedPassword === user.password;
        if(!isPasswordValid){
            return res.status(400).json({message: "Invalid credentials"})
        }

        //Token generation
        const refreshToken = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: "7d"});
        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        // const refreshTokenHash = await bcrypt.hash(refreshToken, 10);


        const session = await sessionModel.create({
                user: user._id,
                refreshTokenHash,
                ip: req.ip,
                userAgent: req.headers["user-agent"]
           
        })

        //Injection session id inside Acccess token
        const accessToken = jwt.sign({id: user._id, sessionId: session._id}, process.env.JWT_SECRET, { expiresIn: "15m"})

        //Secure cookie transmission from server to client -> cookie has refreshToken 
        res.cookie("refreshToken", refreshToken, {...cookieOptions})

        return res.status(200).json({
            message:"User logged in successfully",
            user: {
                email: user.email,
            },
            accessToken
        })
    } catch(err){
        res.status(400).json({message: "Login failed"})
    }

}

async function createRefreshToken(req, res){

    try {

        // reading token from cookie
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(400).json({message: "Refresh token missing"})
        }

        // verifying the token to read the payload (id) and creating its hash --> qki refresh token se user ki id mil jayegi
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        // database mein validation check, kya iss hash naam ke login session ki koi entry hai? Aur kya ye session active hai?
        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false, // matlab user abhi logged-in hai 
        })

        if(!session){
            return res.status(400).json({message: "Invalid or expired session"})
        }
        
        // creating new access token
        const accessToken = jwt.sign({id: decoded.id, sessionId: session._id}, process.env.JWT_SECRET, { expiresIn: "15m" });

        // issuing new refresh token --> Refresh token rotation
        const newRefreshToken = jwt.sign({id: decoded.id} , process.env.JWT_SECRET, { expiresIn: "7d" });
        const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

        // database se puraane token ka hash mita kar, naya save kar rahe
        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();

        // server, browser ko order de raha, apne computer ki memory mein ek naya locker banao uska naam "refreshToken" rakhna aur usme
        // ye refreshToken save kar lo ache se
        res.cookie("refreshToken", newRefreshToken, {...cookieOptions});

        res.status(200).json({accessToken});
    } catch(err){
        res.status(400).json({message: "Invalid operation"})
    }
}

async function userLogout(req, res){

    try {
        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken){
            return res.status(400).json({message: "Request token not found"});
        }

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false
        })

        if(!session){
            return res.status(400).json({message: "Invalid refresh token"})
        }

        session.revoked = true;
        await session.save();


        res.clearCookie("refreshToken", {...cookieOptions});
        res.status(200).json({message: "User logged out successfully"});
        
    } catch(err){
        res.status(400).json({message: "Invalid operation"});
    }
}




module.exports = { createUser, createLogin, createRefreshToken, userLogout};