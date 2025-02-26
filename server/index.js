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
import Company from "./models/Company.js";

const app = express();
dotenv.config();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const allowedOrigins = [
    "http://localhost:3000",
    "https://socialshelf.vercel.app",
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests from allowed origins or no origin (e.g., Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Origin',
        'X-Requested-With',
        'Accept',
        'Authorization',
        'x-client-key',
        'x-client-token',
        'x-client-secret'
    ],
    credentials: true
};

// Use the CORS middleware with the defined options
app.use(cors(corsOptions));

app.use(express.json());

app.use(bodyParser.json({ extended: 'true', limit: '30mb' }));
app.use(bodyParser.urlencoded({ extended: 'true', limit: '30mb' }));


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

app.post("/register", upload.single('dp'), async (req, res) => {
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
        return res.status(200).json({ message: "Registration successful!", userId: newUser._id });
    } catch (error) {
        console.log('Error: ', error);
    }
})


app.post("/company/register", upload.single('dp'), async (req, res) => {
    try {
        const { userName, password } = req.body;
        let imagePath = "";
        if (!userName || !password)
            return res.status(201).json({ message: "userName and password are required!" });
        const existingComp = await Company.findOne({ userName });
        if (existingComp) {
            return res.status(201).json({ message: "Company already exists with same username!" });
        }
        if (req.file) imagePath = await uploadImageToS3(req.file);
        const newComp = new Company({ userName, dp: imagePath, password });
        await newComp.save();
        return res.status(200).json({ message: "Registration successful!", companyId: newComp._id });
    } catch (error) {
        console.log('Error: ', error);
    }
})


app.post("/login", async (req, res) => {
    try {
        const { userName, password } = req.body;
        if (!userName || !password)
            return res.status(201).json({ message: "userName and password are required!" });
        const existingUser = await User.findOne({ userName });
        if (!existingUser) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        const isMatch = password === existingUser.password;
        if (!isMatch) return res.status(201).json({ message: "Incorrect password!" });
        return res.status(200).json({ message: "Login successful!", userId: existingUser._id });
    } catch (error) {
        console.log('Error: ,error');
    }
})

app.post("/company/login", upload.single('dp'), async (req, res) => {
    try {
        const { userName, password } = req.body;
        if (!userName || !password)
            return res.status(201).json({ message: "userName and password are required!" });
        const existingComp = await Company.findOne({ userName });
        if (!existingComp) {
            return res.status(201).json({ message: "Company doesn't exists!" });
        }
        const isMatch = password === existingComp.password;
        if (!isMatch) return res.status(201).json({ message: "Incorrect password!" });
        return res.status(200).json({ message: "Login successful!", companyId: existingComp._id });
    } catch (error) {
        console.log('Error: ', error);
    }
})

app.post("/:userId/createPost", upload.single("image"), async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        const { description } = req.body;
        let imagePath = "";
        if (req.file) imagePath = await uploadImageToS3(req.file);
        const newPost = new Post({ image: imagePath, description, userId: userId });
        await newPost.save();
        existingUser.posts.push(newPost._id);
        await existingUser.save();

        return res.status(200).json({ message: "Post created successfully!" });
    } catch (error) {
        console.log('Error: ', error);
    }
})

app.post("/:companyId/createProduct", upload.single("image"), async (req, res) => {
    try {
        const { companyId } = req.params;
        if (!companyId) {
            return res.status(201).json({ message: "Comp doesn't exists!" });
        }
        const existingComp = await Company.findById(companyId);
        if (!existingComp) {
            return res.status(201).json({ message: "Comp doesn't exists!" });
        }
        const { description } = req.body;
        let imagePath = "";
        if (req.file) imagePath = await uploadImageToS3(req.file);
        const newPost = new Post({ image: imagePath, description, companyId: companyId });
        await newPost.save();
        existingComp.posts.push(newPost._id);
        await existingComp.save();

        return res.status(200).json({ message: "Product created successfully!" });
    } catch (error) {
        console.log('Error: ', error);
    }
})

app.post("/:userId/addFriend/:friendId", async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        if (!isValidObjectId(userId) || !isValidObjectId(friendId)) {
            return res.status(400).json({ message: "Invalid user ID format!" });
        }
        if (userId === friendId) return res.status(201).json({ message: "You can't add yourself!" });
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        if (!friend) {
            return res.status(201).json({ message: "Friend doesn't exists!" });
        }
        if (user.friends.includes(friendId)) {
            return res.status(200).json({ message: " Already friends!" });
        }
        await User.findByIdAndUpdate(userId, { $push: { friends: friend._id } });
        await User.findByIdAndUpdate(friendId, { $push: { friends: user._id } });

        return res.status(200).json({ message: "Friend added successfully!" });
    } catch (error) {
        console.log('Error: ', error);
    }
})


app.post("/:userId/removeFriend/:friendId", async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        if (!isValidObjectId(userId) || !isValidObjectId(friendId)) {
            return res.status(400).json({ message: "Invalid user ID format!" });
        }
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        if (!friend) {
            return res.status(201).json({ message: "Friend doesn't exists!" });
        }
        if (!user.friends.includes(friendId)) {
            return res.status(200).json({ message: "You guys are not friends previously!" });
        }
        await User.findByIdAndUpdate(userId, { $pull: { friends: friend._id } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: user._id } });

        return res.status(200).json({ message: "Friend removed successfully!" });
    } catch (error) {
        console.log('Error: ', error);
    }
})

app.post("/:userId/addReview/:postId", async (req, res) => {
    try {
        const { userId, postId } = req.params;
        if (!isValidObjectId(userId) || !isValidObjectId(postId)) {
            return res.status(400).json({ message: "Invalid ID format!" });
        }
        const user = await User.findById(userId);
        const post = await Post.findById(postId);

        if (!user) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        if (!post) {
            return res.status(201).json({ message: "Post doesn't exists!" });
        }

        const { review } = req.body;
        if(review === "")return res.status(201).json({ message: "Review can't be empty!" });
        await Post.findByIdAndUpdate(postId, { $push: { reviews: { userId: user._id, review: review } } });

        return res.status(200).json({ message: "Review added successfully!" });
    } catch (error) {
        console.log('Error: ', error);
    }
})

app.get("/:userId/seeReview/:postId", async (req, res) => {
    try {
        const { userId, postId } = req.params;
        if (!isValidObjectId(userId) || !isValidObjectId(postId)) {
            return res.status(400).json({ message: "Invalid ID format!" });
        }
        const user = await User.findById(userId);
        const post = await Post.findById(postId);

        if (!user) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }
        if (!post) {
            return res.status(201).json({ message: "Post doesn't exists!" });
        }

        //displaying only that particular user's friends reviews only
        const friendsSet = new Set(user.friends.map(friend => friend.toString()));
        friendsSet.add(userId);
        
        // Filter reviews: Keeping only those where the reviewer is a friend
        const friendReviews = post.reviews.filter(review => friendsSet.has(review.userId.toString()));
        
        return res.status(200).json({ message: "Reviews fetched successfully!", reviews: friendReviews });
    } catch (error) {
        console.log('Error: ', error);
    }
})



app.get("/:userId/feed", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid user ID format!" });
        }
        const user = await User.findById(userId);

        if (!user) {
            return res.status(201).json({ message: "User doesn't exists!" });
        }

        const userPosts = await Post.find({ userId });
        const friendPosts = await Post.find({ userId: { $in: user.friends } });
        const allPosts = [...userPosts, ...friendPosts].sort((a, b) => b.createdAt - a.createdAt);

        return res.status(200).json(allPosts);
    } catch (error) {
        console.log('Error: ', error);
    }
})

app.get("/:companyId/products", async (req, res) => {
    try {
        const { companyId } = req.params;
        if (!isValidObjectId(companyId)) {
            return res.status(400).json({ message: "Invalid company ID format!" });
        }
        const comp = await Company.findById(companyId);

        if (!comp) {
            return res.status(201).json({ message: "Company doesn't exists!" });
        }

        const compPosts = await Post.find({ companyId });

        return res.status(200).json(compPosts);
    } catch (error) {
        console.log('Error: ', error);
    }
})


app.get("/users", async (req, res) => {
    try {
        const users = await User.find();

        return res.status(200).json(users);
    } catch (error) {
        console.log('Error: ', error);
    }
})


app.get("/companies", async (req, res) => {
    try {
        const companies = await Company.find();

        return res.status(200).json(companies);
    } catch (error) {
        console.log('Error: ', error);
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