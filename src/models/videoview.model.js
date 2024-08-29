import mongoose, { Schema } from "mongoose";

const videoViewModel = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video",
  },
});

export const VideoView = mongoose.model("VideoView", videoViewModel);
