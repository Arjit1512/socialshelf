import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        userName:{
            type:String,
            required:true,
            unique:true,
        },
        password:{
            type:String,
            required:true,
        },
        dp:{
            type:String,
        },
        friends:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'User'
            }
        ],
        posts:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'Post'
            }
        ]

    }
)

const User = mongoose.model('User',userSchema);
export default User;