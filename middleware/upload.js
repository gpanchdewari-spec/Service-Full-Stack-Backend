import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter(req, file, callback) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      const error = new Error("Only JPG, PNG and WebP images are allowed");
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

export const uploadServiceImage = upload.single("image");
