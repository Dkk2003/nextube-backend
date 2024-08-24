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

export { toggleSubscription };
