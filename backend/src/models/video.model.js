import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile : {
            type : String, //Cloudinary
            required : ture
        },
        thumbnail : {
            type : String, //Cloudinary
            required : ture
        },
        title : {
            type : String,
            required : ture
        },
        description : {
            type : String,
            required : ture
        },
        duration : {
            type : Number, //from Cloudinary
            required : ture
        },
        views : {
            type : Number,
            default : 0 
        },
        isPublished: {
            type : true,
            default : true
        },
        owner :{
            type: Schema.Types.ObjectId,
            ref : "User"
        }
    },
    {
        timestamps : true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)