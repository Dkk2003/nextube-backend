import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if ([name, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Name and description are required");
  }

  const existPlaylist = await Playlist.findOne({ name, owner: req.user?._id });

  if (existPlaylist) {
    throw new ApiError(400, "Playlist already exist");
  }

  const playlist = await Playlist.create({
    name,
    description,
    videos: [],
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "There was a problem while creating playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  const playlists = await Playlist.find({ owner: userId });

  if (!playlists) {
    throw new ApiError(400, "User id is incorrect");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "All playlist are fetched"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlist id are required");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Incorrect playlist id");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if ([playlistId, videoId].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Playlist id and Video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Incorrect video id");
  }
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Incorrect playlist id");
  }

  if (
    playlist.videos.some((field) => field.toString() === video?._id.toString())
  ) {
    throw new ApiError(400, "Video is already in this playlist");
  }

  playlist.videos.push(video?._id);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added in playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if ([playlistId, videoId].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Playlist id and Video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Incorrect video id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Incorrect playlist id");
  }

  await Playlist.updateOne(
    { _id: playlist?.id },
    { $pull: { videos: video?._id } }
  );
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, [], "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlist id are required");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(400, "Playlist id is incorrect");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedPlaylist, "Playlist are deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId) {
    throw new ApiError(400, "playlist id are required");
  }

  if ([name, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Name and description are required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Playlist id is incorrect");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist are updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
