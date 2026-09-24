import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, min: 1, required: true },
    duration: Number,
    image: String,
    imagePublicId: String,
    rating: String,
    reviews: String,
    description: String,
    includes: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export default mongoose.model("Service", schema);
