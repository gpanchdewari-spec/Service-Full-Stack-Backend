import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { registerSchema, loginSchema } from "../utils/validation.js";
const safe = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const options = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 86400000,
  path: "/",
});
function session(res, user) {
  res.cookie(
    "uc_token",
    jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" }),
    options(),
  );
  return res.json({ user: safe(user) });
}
export async function register(req, res) {
  const data = registerSchema.parse(req.body);
  if (await User.exists({ email: data.email }))
    return res
      .status(409)
      .json({ message: "An account already exists with this email." });
  const user = await User.create({
    ...data,
    password: await bcrypt.hash(data.password, 12),
  });
  return session(res, user);
}
export async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user || !(await bcrypt.compare(data.password, user.password)))
    return res.status(401).json({ message: "Incorrect email or password." });
  return session(res, user);
}
export function logout(req, res) {
  res.clearCookie("uc_token", { ...options(), maxAge: undefined });
  res.json({ message: "Signed out" });
}
export function me(req, res) {
  res.json({ user: safe(req.user) });
}
