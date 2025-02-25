import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            default: ""
        },
        image: {
            type: String,
        },
        userId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }


    }
)

const Post = mongoose.model('Post', postSchema);
export default Post;