import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const skip = (page - 1) * limit;

  const comments = await Comment.find({
    video: videoId,
  })
    .skip(skip)
    .limit(limit);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Fetch All Comments Successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId, content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if (!content) {
    throw new ApiError(400, "Comment content are empty");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(400, "There was a problem while add comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added to video"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { videoId, commentId, newContent } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  if (!newContent) {
    throw new ApiError(400, "Comment content are empty");
  }

  const comment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      video: videoId,
      owner: req.user?._id,
    },
    {
      $set: {
        content: newContent,
      },
    },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(400, "There was a problem while update comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { videoId, commentId } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const comment = await Comment.findOneAndDelete(
    {
      _id: commentId,
      video: videoId,
      owner: req.user?._id,
    },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(400, "There was a problem while update comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
