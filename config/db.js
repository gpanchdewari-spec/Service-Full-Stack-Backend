import mongoose from "mongoose";
export async function connectDB() {
  if (!process.env.MONGODB_URI)
    throw new Error(
      "MONGODB_URI is missing. Copy server/.env.example to server/.env and set your MongoDB connection string.",
    );
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");
}
