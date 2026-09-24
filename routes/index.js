import { getServiceCity } from "../config/serviceAreas.js";
import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as auth from "../controllers/authController.js";
import * as services from "../controllers/serviceController.js";
import * as bookings from "../controllers/bookingController.js";

import { protect, admin } from "../middleware/auth.js";
import { uploadServiceImage } from "../middleware/upload.js";
import { asyncHandler as wrap } from "../utils/asyncHandler.js";

const router = Router();

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.get("/services", wrap(services.list));

router.get("/service-area/:pinCode", (req, res) => {
  const { pinCode } = req.params;

  if (!/^\d{6}$/.test(pinCode)) {
    return res.status(400).json({
      message: "Enter a valid 6-digit PIN code.",
    });
  }

  const city = getServiceCity(pinCode);

  if (!city) {
    return res.json({
      available: false,
      message: "Service is not available at this PIN code.",
    });
  }

  return res.json({
    available: true,
    pinCode,
    city,
  });
});

router.post("/auth/register", authLimit, wrap(auth.register));
router.post("/auth/login", authLimit, wrap(auth.login));
router.post("/auth/logout", auth.logout);
router.get("/auth/me", protect, auth.me);

router.get("/bookings", protect, wrap(bookings.mine));
router.post("/bookings", protect, wrap(bookings.create));
router.patch("/bookings/:id/cancel", protect, wrap(bookings.cancel));

router.get("/admin/bookings", protect, admin, wrap(bookings.all));
router.patch("/admin/bookings/:id", protect, admin, wrap(bookings.status));

// Existing aur new services admin mein dekhne ke liye
router.get("/admin/services", protect, admin, wrap(services.all));

// Nayi service + image upload
router.post(
  "/admin/services",
  protect,
  admin,
  uploadServiceImage,
  wrap(services.create),
);

// Purani service edit + optional image replacement
router.patch(
  "/admin/services/:id",
  protect,
  admin,
  uploadServiceImage,
  wrap(services.update),
);

export default router;
