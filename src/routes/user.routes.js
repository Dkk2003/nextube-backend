import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

// register
router.route("/register").post(upload.none(), registerUser);

router.route("/verifyOtp").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  verifyOtp
);

router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetpassword);
router.route("/resend-otp").post(resendOtp);
router.route("/google-login").post(signWithGoogle);

//secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, updateUserDetails);
router.route("/complete-profile").patch(verifyJwt, completeProfile);
router
  .route("/avatar")
  .patch(verifyJwt, upload.single("avatar"), userAvatarUpdate);
router
  .route("/cover-image")
  .patch(verifyJwt, upload.single("coverImage"), userCoverImageUpdate);
router.route("/channel/:username").get(verifyJwt, genrateUserChannelProfile);
router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
