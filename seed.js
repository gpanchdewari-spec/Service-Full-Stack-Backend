import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Service from "./models/Service.js";
import User from "./models/User.js";
import { services } from "./shared/catalog.js";
dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)) });
try {
  await connectDB();
  for (const service of services)
    await Service.updateOne(
      { slug: service.slug },
      { $setOnInsert: service },
      { upsert: true },
    );
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (
    ADMIN_EMAIL &&
    ADMIN_PASSWORD &&
    ADMIN_PASSWORD !== "change-this-before-running-seed" &&
    ADMIN_PASSWORD.length >= 12
  ) {
    if (!(await User.exists({ email: ADMIN_EMAIL.toLowerCase() })))
      await User.create({
        name: "Administrator",
        email: ADMIN_EMAIL.toLowerCase(),
        password: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: "admin",
      });
    console.log("Admin account ready");
  } else
    console.log(
      "Set ADMIN_EMAIL and a unique ADMIN_PASSWORD (12+ characters) to create an admin.",
    );
  console.log("Services seeded without overwriting existing edits.");
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
