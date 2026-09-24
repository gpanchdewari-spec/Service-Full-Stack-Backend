import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.uc_token;
  if (!token)
    return res.status(401).json({ message: "Please sign in to continue." });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res
      .status(401)
      .json({ message: "Session expired. Please sign in again." });
  }
  req.user = await User.findById(payload.id);
  if (!req.user) return res.status(401).json({ message: "Account not found." });
  next();
});
export const admin = (req, res, next) =>
  req.user.role === "admin"
    ? next()
    : res.status(403).json({ message: "Administrator access required." });
