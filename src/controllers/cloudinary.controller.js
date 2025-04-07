import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const resourceTypes = ["image", "video", "raw"]; // raw = pdf, doc, zip etc.

export const deleteStorage = asyncHandler(async (req, res) => {
  try {
    const { folder } = req.body;

    let overallResult = {};

    for (const type of resourceTypes) {
      if (folder) {
        // Delete all resources inside the folder for each type
        const result = await cloudinary.api.delete_resources_by_prefix(folder, {
          resource_type: type,
        });
        overallResult[type] = result;
      } else {
        // Delete all resources of each type (limit 500 per call)
        const { resources } = await cloudinary.api.resources({
          resource_type: type,
          max_results: 500,
        });

        const publicIds = resources.map((r) => r.public_id);

        if (publicIds.length) {
          const result = await cloudinary.api.delete_resources(publicIds, {
            resource_type: type,
          });
          overallResult[type] = result;
        } else {
          overallResult[type] = { message: "No files found" };
        }
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, overallResult, "Cloudinary resources deleted")
      );
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete from Cloudinary", error });
  }
});
