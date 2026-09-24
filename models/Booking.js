import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: Number,
    city: String,
    pinCode: { type: String, required: true },
    address: String,
    phone: String,
    date: String,
    slot: String,
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: { type: String, default: "Pay after service" },
  },
  { timestamps: true },
);
export default mongoose.model("Booking", schema);
