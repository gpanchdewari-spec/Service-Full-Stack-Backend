import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import {
  bookingSchema,
  validateBookingTime,
  calculateTotal,
} from "../utils/validation.js";
import { getServiceCity } from "../config/serviceAreas.js";
import { z } from "zod";

export async function create(req, res) {
  const data = bookingSchema.parse(req.body);

  // Booking sirf allowed PIN code par banegi.
  // PIN ki city aur request ki city bhi match honi chahiye.
  const serviceCity = getServiceCity(data.pinCode);

  if (!serviceCity || serviceCity !== data.city) {
    return res.status(400).json({
      message: "Service is not available at this PIN code.",
    });
  }

  validateBookingTime(data.date, data.slot);

  if (new Set(data.items.map((i) => i.slug)).size !== data.items.length) {
    return res.status(400).json({
      message: "Duplicate service in cart.",
    });
  }

  const records = await Service.find({
    slug: { $in: data.items.map((i) => i.slug) },
    active: true,
  });

  const items = calculateTotal(data.items, records);

  const booking = await Booking.create({
    ...data,
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    user: req.user._id,
  });

  res.status(201).json({ booking });
}

export async function mine(req, res) {
  res.json({
    bookings: await Booking.find({ user: req.user._id }).sort({
      createdAt: -1,
    }),
  });
}

export async function cancel(req, res) {
  const booking = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
      status: { $in: ["Pending", "Confirmed"] },
    },
    { status: "Cancelled" },
    { new: true },
  );

  if (!booking) {
    return res.status(409).json({
      message: "This booking cannot be cancelled.",
    });
  }

  res.json({ booking });
}

export async function all(req, res) {
  res.json({
    bookings: await Booking.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(500),
  });
}

export async function status(req, res) {
  const { status } = z
    .object({
      status: z.enum(["Confirmed", "Completed", "Cancelled"]),
    })
    .parse(req.body);

  const allowed =
    status === "Confirmed"
      ? ["Pending"]
      : status === "Completed"
        ? ["Confirmed"]
        : ["Pending", "Confirmed"];

  const booking = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      status: { $in: allowed },
    },
    { status },
    { new: true },
  );

  if (!booking) {
    return res.status(409).json({
      message: "This status transition is not allowed.",
    });
  }

  res.json({ booking });
}
