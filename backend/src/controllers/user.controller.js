import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
//import {uploadOnSpaces} from '../utils/spaceDigitalOcean.js'
import ApiResponse from '../utils/ApiResponse.js';
import Joi from 'joi'

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefreshToken()

        user.refrashToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token",error)
    }
}

//Joi
const joiSchema = Joi.object({
    email: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().min(1).required()
})

const registerUser = asyncHandler( async (req,res)=>{
    
    // Get user details from frontend
    // Check all fields are fullfilled
    // check user already exist 
    // check for avatar and coverImage
    // upload them to cloudinary 
    // create user object , entry in db

    const {username, email, fullName, password} = req.body;

    if([username, email, fullName, password].some((fields)=>fields?.trim()==="")){
        throw new ApiError(400,"All fileds are required");    
    }

    const existUser = await User.findOne({
        $or :[{username}, {email}]
    })
    if ( existUser){
        throw new ApiError(409, "Email | Username Already Exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    // ? mean chaining it optionally
    
    if (!avatarLocalPath ){
        throw new ApiError(400,"Avatar file is required | Missing path");
    } 

    const avatar = await uploadOnCloudinary(avatarLocalPath) //for cloudinary
    //const spaceAwatar = await uploadOnSpaces(avatarLocalPath) //for spacess
    
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if( !avatar){
        throw new ApiError(400,"Avatar file is required")
    } 

    const user = await User.create({
        fullName,
        avatar: avatar?.url || "",
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
        new ApiResponse(200, createdUser, "User Created Succesfully")
    )

})

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body;

    //Joi validation

    const { error } = joiSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    //const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})


export { registerUser, loginUser, logoutUser }