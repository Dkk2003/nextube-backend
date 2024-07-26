import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;

  if (!userId) {
    throw new ApiError(404, "User id is required");
  }

  const aggregate = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  try {
    const videos = await Video.aggregatePaginate(aggregate, options);
    res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message);
  }
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

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video are fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailPath = req.file?.path;

  if (!title || !description || !thumbnailPath) {
    throw new ApiError(400, "All fields are required");
  }

  const thumbnail = await uploadToCloudinary(thumbnailPath);

  if (!thumbnail) {
    throw new ApiError(400, "Please upload valid file");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { title, description, thumbnail: thumbnail.url },
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(400, "Video not available");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo };
