
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)) });
const { connectDB } = await import("./config/db.js");
try {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.startsWith("replace-with")
  )
    throw new Error(
      "Set a unique JWT_SECRET of at least 32 characters in server/.env.",
    );
  await connectDB();
  const { default: app } = await import("./app.js");
  const { default: express } = await import("express");
  const path = await import("node:path");
  const root = fileURLToPath(new URL("../dist", import.meta.url));
  app.use(express.static(root));
  app.get("*", (req, res) => res.sendFile(path.join(root, "index.html")));
  app.listen(process.env.PORT || 5000, () =>
    console.log("API running on port " + (process.env.PORT || 5000)),
  );
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
