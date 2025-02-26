import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
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
        posts:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'Post'
            }
        ]

    }
)

const Company = mongoose.model('Company',CompanySchema);
export default Company;