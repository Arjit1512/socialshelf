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
        },
        companyId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
        },
        reviews: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                review: {
                    type: String,
                    required: true
                }
            }
        ]


    }
)

const Post = mongoose.model('Post', postSchema);
export default Post;