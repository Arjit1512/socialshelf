import axios from "axios";
import express from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import multer from "multer";
import User from "./models/User.js";
import Post from "./models/Post.js";
import AWS from 'aws-sdk';

const app = express();
dotenv.config();
app.use(express.json());

app.use(bodyParser.json({ extended: 'true', limit: '30mb' }));
app.use(bodyParser.urlencoded({ extended: 'true', limit: '30mb' }));
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const uploadImageToS3 = async (file) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `images/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        return (await s3.upload(params).promise()).Location;
    } catch (error) {
        throw new Error(`S3 Upload Error: ${error.message}`);
    }
};

app.post("/register",upload.single('dp'), async (req, res) => {
    try {
        const { userName, password } = req.body;
        let imagePath = "";
        if (!userName || !password)
            return res.status(201).json({ message: "userName and password are required!" });
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
            return res.status(201).json({ message: "User already exists with same username!" });
        }
        if (req.file) imagePath = await uploadImageToS3(req.file);
        const newUser = new User({ userName, dp: imagePath, password });
        await newUser.save();
        return res.status(200).json({ message: "Registartion successful!", userId:newUser._id });
    } catch (error) {
        console.log('Error: ', error);
    }
})

app.post("/login",async(req,res) => {
    try{
        const { userName, password } = req.body;
        if (!userName || !password)
            return res.status(201).json({ message: "userName and password are required!" });
        const existingUser = await User.findOne({ userName });
        if (!existingUser) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        const isMatch = password === existingUser.password;
        if(!isMatch)return res.status(201).json({ message: "Incorrect password!" });
        return res.status(200).json({ message: "Login successful!", userId:existingUser._id  });
    }catch(error){
        console.log('Error: ,error');
    }
})

app.post("/:userId/createPost", upload.single("image"), async(req,res) => {
    try{
        const { userId } = req.params;
        if (!userId) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        const {description} = req.body;
        let imagePath="";
        if(req.file)imagePath = await uploadImageToS3(req.file);
        const newPost = new Post({image:imagePath,description,userId:userId});
        await newPost.save();
        existingUser.posts.push(newPost._id);
        await existingUser.save();

        return res.status(200).json({ message: "Post created successfully!" });
    }catch(error){
        console.log('Error: ',error);
    }
})

app.post("/:userId/addFriend/:friendId", async(req,res) => {
    try{
        const { userId,friendId } = req.params;
        if(userId === friendId)return res.status(201).json({ message: "Choose another user!" });
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);
        
        if (!user) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        if (!friend) {
            return res.status(201).json({ message: "Friend doesn't exists!" });
        }
        if(user.friends.includes(friendId)){
            return res.status(200).json({message:" Already friends!"});
        }
        await User.findByIdAndUpdate(userId,{$push: {friends: friend._id}});
        await User.findByIdAndUpdate(friendId,{$push: {friends: user._id}});
        
        return res.status(200).json({ message: "Friend added successfully!" });
    }catch(error){
        console.log('Error: ',error);
    }
})


app.post("/:userId/removeFriend/:friendId", async(req,res) => {
    try{
        const { userId,friendId } = req.params;
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);
        
        if (!user) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        if (!friend) {
            return res.status(201).json({ message: "Friend doesn't exists!" });
        }
        if(!user.friends.includes(friendId)){
            return res.status(200).json({message:"You guys are not friends previously!"});
        }
        await User.findByIdAndUpdate(userId,{$pull: {friends: friend._id}});
        await User.findByIdAndUpdate(friendId,{$pull: {friends: user._id}});
        
        return res.status(200).json({ message: "Friend removed successfully!" });
    }catch(error){
        console.log('Error: ',error);
    }
})

app.get("/:userId/feed" , async(req,res) => {
    try{
        const { userId} = req.params;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        
        const userPosts = await Post.find({ userId });
        const friendPosts = await Post.find({ userId: { $in: user.friends } });
        const allPosts = [...userPosts, ...friendPosts].sort((a, b) => b.createdAt - a.createdAt);

        return res.status(200).json(allPosts);
    }catch(error){
        console.log('Error: ',error);
    }
})


app.get("/users" , async(req,res) => {
    try{
        const users = await User.find();

        return res.status(200).json(users);
    }catch(error){
        console.log('Error: ',error);
    }
})



const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        })
    })
    .catch((error) => {
        console.log('Error: ', error);
    })