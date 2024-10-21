import mongoose from "mongoose";

try {
    const DESTINATION = process.env.MONGO_DEST
    mongoose.connect(DESTINATION as string)
    console.log('Connected to mongodb.')
} catch (error) {
    console.log('Err:', error)
}
