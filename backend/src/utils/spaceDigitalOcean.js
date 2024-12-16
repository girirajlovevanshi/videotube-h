import AWS from 'aws-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({});

const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT); // Change this if your region is different

const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
});

const uploadOnSpaces = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        const fileContent = fs.readFileSync(localFilePath);
        const fileName = `uploads/${Date.now().toString()}_${localFilePath.split('/').pop()}`; // Generate unique file name
        
        const params = {
            Bucket: process.env.SPACES_BUCKET, // Ensure this is set in your .env file
            Key: fileName, // Path to the file in the Spaces bucket
            Body: fileContent,
            ACL: 'public-read', // Make file publicly accessible (change as needed)
            ContentType: 'image/jpeg', // Set appropriate MIME type
            ContentDisposition: 'inline', // Ensure inline preview
        };
        
        const response = await s3.upload(params).promise();
        
        console.log("File is uploaded on DigitalOcean Spaces", response.Location);
        
        fs.unlinkSync(localFilePath); // Remove the local file after successful upload
        
        return response;
    } catch (error) {
        console.error("Error uploading file to DigitalOcean Spaces", error);
        
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // Remove the local file if upload failed
        }
        
        return null;
    }
}

export { uploadOnSpaces };
