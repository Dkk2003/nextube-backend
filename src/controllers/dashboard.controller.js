import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { Video } from "../models/video.model.js";
import { VideoView } from "../models/videoview.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const views = await VideoView.find({ user: req.user?.id });
  if (!views) {
    throw new ApiError(400, "There was a problem while get views");
  }

  const subscribers = await Subscription.find({ channel: req.user?.id });
  if (!subscribers) {
    throw new ApiError(400, "There was a problem while get subscribers");
  }

  const videos = await Video.find({ owner: req.user?.id });
  if (!videos) {
    throw new ApiError(400, "There was a problem while get videos");
  }

  const likes = await Like.find({ likedBy: req.user?.id });
  if (!likes) {
    throw new ApiError(400, "There was a problem while get likes");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalViews: views?.length,
        totalSubscribers: subscribers?.length,
        totalVideos: videos?.length,
        totalLikes: likes?.length,
      },
      "All dashboard data are fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const allVideos = await Video.find({ owner: req.user?.id });
  if (!allVideos) {
    throw new ApiError(400, "There was a problem while get videos");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "All Videos are fetched"));
});

export { getChannelStats, getChannelVideos };
