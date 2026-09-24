import { randomUUID } from "node:crypto";
import { z } from "zod";
import Service from "../models/Service.js";
import { categories, cities } from "../../shared/catalog.js";
import { getCloudinary } from "../config/cloudinary.js";

const boolFromForm = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean(),
);

const serviceFields = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(categories.map((item) => item.slug)),
  price: z.coerce.number().int().min(1).max(100000),
  duration: z.coerce.number().int().min(1).max(1440),
  description: z.string().trim().min(10).max(2000),
  active: boolFromForm,
});

function makeSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `${base || "service"}-${randomUUID()}`;
}

function uploadImage(file) {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "urban-company/services",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
}

async function deleteUploadedImage(publicId) {
  if (!publicId?.startsWith("urban-company/services/")) return;

  try {
    await getCloudinary().uploader.destroy(publicId);
  } catch (error) {
    console.error("Could not remove old image:", error.message);
  }
}

// Customer website: available services
export async function list(req, res) {
  const filter = { active: true };

  if (req.query.category) {
    filter.category = String(req.query.category);
  }

  const services = await Service.find(filter).sort({ createdAt: -1 });

  res.json({ services, categories, cities });
}

// Admin: all services
export async function all(req, res) {
  const services = await Service.find().sort({ createdAt: -1 });

  res.json({ services });
}

// Admin: add new service WITH image
export async function create(req, res) {
  const data = serviceFields.parse(req.body);

  if (!req.file) {
    return res.status(400).json({
      message: "Please select a service image",
    });
  }

  const uploaded = await uploadImage(req.file);

  try {
    const service = await Service.create({
      ...data,
      slug: makeSlug(data.name),
      image: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      rating: "New",
      reviews: "0",
      includes: [],
    });

    res.status(201).json({ service });
  } catch (error) {
    await deleteUploadedImage(uploaded.public_id);
    throw error;
  }
}

// Admin: edit existing service; image is optional
export async function update(req, res) {
  const data = serviceFields.partial().parse(req.body);

  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      message: "Service not found",
    });
  }

  const oldPublicId = service.imagePublicId;
  let uploaded;

  if (req.file) {
    uploaded = await uploadImage(req.file);
  }

  Object.assign(service, data);

  if (uploaded) {
    service.image = uploaded.secure_url;
    service.imagePublicId = uploaded.public_id;
  }

  try {
    await service.save();
  } catch (error) {
    if (uploaded) await deleteUploadedImage(uploaded.public_id);
    throw error;
  }

  if (uploaded && oldPublicId) {
    await deleteUploadedImage(oldPublicId);
  }

  res.json({ service });
}
