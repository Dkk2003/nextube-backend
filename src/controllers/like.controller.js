import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const like = await Like.findOne({ video: videoId, likedBy: req.user?._id });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like Removed Successfully"));
  }

  const newLike = await Like.create({ video: videoId, likedBy: req.user?._id });

  if (!newLike) {
    throw new ApiError(400, "Please provide valid id's");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Like Added Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const like = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment Like Removed Successfully"));
  }

  const newLike = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Comment Like Added Successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const like = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet Like Removed Successfully"));
  }

  const newLike = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Tweet Like Added Successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({ likedBy: req.user?._id }).populate({
    path: "video",
    populate: { path: "owner", select: "fullName username avatar" },
  });

  const likedVideos = likes
    .filter((like) => like.video)
    .map((like) => like.video);

  if (likedVideos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "You haven't liked any videos yet"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
