import { z } from "zod";
import { cities, slots } from "../shared/catalog.js";
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(100),
});
export const loginSchema = registerSchema.omit({ name: true });
export const bookingSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        quantity: z.number().int().min(1).max(5),
      }),
    )
    .min(1)
    .max(30),
  city: z.enum(cities),
  pinCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  address: z.string().trim().min(10).max(500),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(slots),
});
export function validateBookingTime(date, slot, now = new Date()) {
  const when = new Date(`${date}T${slot}:00+05:30`);
  if (
    !Number.isFinite(when.getTime()) ||
    when.toISOString().slice(0, 10) !== date ||
    when <= now ||
    when.getTime() > now.getTime() + 30 * 86400000
  )
    throw Object.assign(
      new Error("Choose a future slot within the next 30 days."),
      { status: 400 },
    );
}
export function calculateTotal(items, records) {
  return items.map((item) => {
    const s = records.find((s) => s.slug === item.slug);
    if (!s)
      throw Object.assign(new Error("A selected service is unavailable."), {
        status: 400,
      });
    return {
      service: s._id,
      name: s.name,
      price: s.price,
      quantity: item.quantity,
    };
  });
}
