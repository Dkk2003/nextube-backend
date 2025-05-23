import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import otpGenerate from "otp-generator";
import {
  sendOtpEmail,
  sendAccountCreationEmail,
  sendForgotPasswordLink,
} from "../utils/emailService.js";
import axios from "axios";
import { PROVIDER_ENUM } from "../constants.js";

const otpStore = new Map();

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existedUser) {
    let conflictField = "";

    if (existedUser.email === email) {
      conflictField = "email";
    }
    if (existedUser.username === username) {
      conflictField = conflictField ? "both email and username" : "username";
    }

    return res.status(409).json({
      message: `User with ${conflictField} already exists`,
      conflictField,
    });
  }

  const otp = otpGenerate.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  // Store OTP with an expiration time (5 minutes)
  otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  await sendOtpEmail(email, otp);
  return res
    .status(201)
    .json(new ApiResponse(200, { otp }, "OTP sent successfully"));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { otp, fullName, email, username, password } = req.body;

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  if (!email?.trim() || !otp?.trim()) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const storedOtpData = otpStore.get(email);

  if (!storedOtpData || storedOtpData.otp !== otp) {
    throw new ApiError(400, "Invalid OTP. Please request a new one.");
  }

  if (Date.now() > storedOtpData.expiresAt) {
    otpStore.delete(email);
    throw new ApiError(400, "OTP expired. Please request a new one.");
  }

  // OTP verified, remove from store
  otpStore.delete(email);

  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let coverImageLocalPath =
    req.files?.coverImage?.length > 0 ? req.files.coverImage[0].path : null;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadToCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
    provider: PROVIDER_ENUM.email,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  await sendAccountCreationEmail(email);

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  // Check if an OTP already exists and is still valid
  const storedOtpData = otpStore.get(email);
  if (storedOtpData && Date.now() < storedOtpData.expiresAt) {
    throw new ApiError(
      429,
      "OTP already sent. Please wait before requesting a new one."
    );
  }

  // Generate a new OTP
  const otp = otpGenerate.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  // Store new OTP with a fresh expiration time (5 minutes)
  otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  // Send the new OTP via email
  await sendOtpEmail(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, { otp }, "New OTP sent successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(400, "User not found");

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendForgotPasswordLink(email, resetLink);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset link sent to your email"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
});

const resetpassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid or expired token"));
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset successful"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
});

const loginUser = asyncHandler(async (req, res) => {
  //get input from user (email,password)
  //username or email
  //find the user
  //password check
  //accesstoken and refreshtoken
  //send cookie

  const { username, email, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError("User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user creadentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;

  // Prepare an object with only the fields that are passed
  const updateData = {};

  if (username) {
    const existedUsername = await User.findOne({
      username,
      _id: { $ne: req.user?._id }, // prevent collision with own username
    });

    if (existedUsername) {
      throw new ApiError(409, "Username already exists");
    }

    updateData.username = username;
  }

  if (fullName) {
    updateData.fullName = fullName;
  }

  // If nothing to update
  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "Nothing to update");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateData },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const userAvatarUpdate = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error While upload avatar image to cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const userCoverImageUpdate = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Coverimage file is missing");
  }

  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error While upload cover image to cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const genrateUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

const signWithGoogle = asyncHandler(async (req, res) => {
  const idToken = req.body?.accessToken;

  if (!idToken) {
    throw new ApiError(400, "Access token is required");
  }

  const profile = await axios.get(`${process?.env?.GOOGLE_PROFILE_DATA_URL}`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  const data = profile?.data;

  if (!data) {
    throw new ApiError(400, "Wrong access token");
  }

  const user = await User.findOne({ email: data.email });

  if (!user) {
    const createdUser = await User.create({
      fullName: data?.name,
      avatar: data.picture,
      email: data.email,
      provider: PROVIDER_ENUM.google,
    });

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      createdUser._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    await sendAccountCreationEmail(data?.email);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: createdUser,
            accessToken,
            refreshToken,
          },
          "User Logged In Successfully"
        )
      );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const completeProfile = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const existedUser = await User.findOne({ username });

  if (existedUser) {
    throw new ApiError(409, "Username already taken");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError("User does not exist");
  }

  user.username = username;
  user.password = password;
  await user.save();

  if (!user) {
    throw new ApiError(400, "Username and Password not updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Username and Password Updated"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  userAvatarUpdate,
  userCoverImageUpdate,
  genrateUserChannelProfile,
  getWatchHistory,
  verifyOtp,
  forgotPassword,
  resetpassword,
  resendOtp,
  signWithGoogle,
  completeProfile,
};
