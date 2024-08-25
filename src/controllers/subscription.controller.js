import mongoose from "mongoose";
import { Subscription } from "../models/subscriptions.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel id is required");
  }

  const subscriber = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: new mongoose.Types.ObjectId(channelId),
  });

  if (!subscriber) {
    const newSubscriber = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });

    if (!newSubscriber) {
      throw new ApiError(
        400,
        "There was a problem while adding the subscription"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newSubscriber,
          "Subscription is added to the channel"
        )
      );
  } else {
    const deletedSubscriber = await Subscription.findByIdAndDelete(
      subscriber?._id
    );

    if (!deletedSubscriber) {
      throw new ApiError(
        400,
        "There was a problem while removing the subscription"
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedSubscriber, "Subscription was removed")
      );
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel id is required");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $project: {
        subscriber: 1,
        _id: 0,
      },
    },
  ]);

  if (!subscribers) {
    throw new ApiError(400, "Invalid channel id");
  }

  const subscriberList = subscribers.map((item) => {
    const { password, __v, ...rest } = item.subscriber[0];
    return rest;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, subscriberList, "Subscribers are fetched"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, "Subscriber id is required");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels",
      },
    },
  ]);

  if (!channels) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const channelList = channels.map((item) => {
    const { password, __v, ...rest } = item.channels[0];
    return rest;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, channelList, "Channels are fetched"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
