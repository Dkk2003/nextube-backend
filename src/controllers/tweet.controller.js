import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Please fill require fields");
  }

  const tweet = await Tweet.create({
    owner: req.user?._id,
    content,
  });

  if (!tweet) {
    throw new ApiError(400, "Invalid user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet are created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const tweets = Tweet.aggregate([
    {
      $match: {
        owner: req.user._id,
      },
    },
  ]);

  if (!tweets) {
    throw new ApiError(400, "Invalid user");
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const tweetsPagination = await Tweet.aggregatePaginate(tweets, options);

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweetsPagination, "Tweets fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!(tweetId || content)) {
    throw ApiError(400, "Please fill require field");
  }
  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content },
    },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet successfully updated"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw ApiError(400, "Please fill require field");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(400, "Tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
