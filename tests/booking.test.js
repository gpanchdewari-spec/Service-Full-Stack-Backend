import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingSchema,
  validateBookingTime,
  calculateTotal,
  registerSchema,
} from "../utils/validation.js";
import app from "../app.js";
test("booking validation rejects invalid quantities, contact details and cities", () => {
  const valid = {
    items: [{ slug: "ac", quantity: 1 }],
    city: "Delhi NCR",
    address: "Flat 100 Example Street",
    phone: "9000000000",
    date: "2026-10-01",
    slot: "09:00",
  };
  assert.equal(bookingSchema.safeParse(valid).success, true);
  for (const invalid of [
    { ...valid, items: [{ slug: "ac", quantity: -1 }] },
    { ...valid, phone: "123" },
    { ...valid, city: "Unknown" },
  ])
    assert.equal(bookingSchema.safeParse(invalid).success, false);
});
test("price always comes from database records", () => {
  const items = calculateTotal(
    [{ slug: "ac", quantity: 2, price: 1 }],
    [{ _id: "a", slug: "ac", price: 649, name: "AC service" }],
  );
  assert.equal(items[0].price * items[0].quantity, 1298);
  assert.throws(() => calculateTotal([{ slug: "missing", quantity: 1 }], []));
});
test("reject past, impossible and far-future appointment dates", () => {
  const now = new Date("2026-09-22T00:00:00Z");
  assert.doesNotThrow(() => validateBookingTime("2026-09-23", "09:00", now));
  for (const day of ["2026-09-21", "2026-02-30", "2027-01-01"])
    assert.throws(() => validateBookingTime(day, "09:00", now));
});
test("registration strips attempted role escalation", () => {
  const result = registerSchema.parse({
    name: "Test",
    email: "test@example.com",
    password: "example-password",
    role: "admin",
  });
  assert.equal(result.role, undefined);
});
test("protected endpoints reject anonymous requests; disallowed origins reject writes", async () => {
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${server.address().port}/api`;
    for (const path of ["/bookings", "/admin/bookings", "/admin/services"]) {
      const res = await fetch(base + path);
      assert.equal(res.status, 401);
    }
    const res = await fetch(base + "/auth/logout", {
      method: "POST",
      headers: { Origin: "https://untrusted.example" },
    });
    assert.equal(res.status, 403);
    assert.equal((await fetch(base + "/health")).status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
