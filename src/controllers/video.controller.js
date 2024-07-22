import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiResponse(400, "All fields are required");
  }

  const videoPath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnailFile[0]?.path;

  if (!videoPath) {
    throw new ApiError(400, "Video file are required");
  }
  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbnail file are required");
  }

  const videoUrl = await uploadToCloudinary(videoPath);
  const thumbnailUrl = await uploadToCloudinary(thumbnailPath);

  if (!videoUrl) {
    throw new ApiError(400, "Video file required");
  }
  if (!thumbnailUrl) {
    throw new ApiError(400, "Thumbnail file required");
  }

  const video = await Video.create({
    videoFile: videoUrl.url,
    thumbnail: thumbnailUrl.url,
    title,
    description,
    duration: videoUrl?.duration || null,
    views: 0,
    isPublished: true,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

export { getAllVideos, publishAVideo };
