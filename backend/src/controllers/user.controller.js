import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler( async (req,res)=>{
    
    // Get user details from frontend
    // Check all fields are fullfilled
    // check user already exist 
    // check for avatar and coverImage
    // upload them to cloudinary 
    // create user object , entry in db

    const {username, email, fullName, password} = res.body;

    if([username, email, fullName, password].some((fields)=>fileds?.trim()==="")){
        throw new ApiError(400,"All fileds are required");    
    }

    const existUser = User.findOne({
        $or :[{username}, {email}]
    })
    if ( existUser){
        throw new ApiError(409, "Email | Username Already Exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // ? mean chaining it optionally
    
    if (!avatarLocalPath ){
        throw new ApiError(400,"Avatar file is required | Missing path");
    }
    if (avatarLocalPath){
        const avatar = await uploadOnCloudinary(avatarLocalPath)
    }
    if (coverImageLocalPath){
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }
    if( !avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase() ,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refrashToken "
    )
    // this is a wired syntax where you need to mention what you dont need using select using -

    if(!createdUser){
        throw new ApiError(500,"Something went wrong, unable to create user");
    }

    return res.status(201).json(
        new ApiResponce(200, createdUser, "User Created Succesfully")
    )

})
export { registerUser }