import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJwt);

router.route("/toggleVideoLike/:videoId").post(toggleVideoLike);
router.route("/toggleCommentLike/:commentId").post(toggleCommentLike);
router.route("/toggleTweetLike/:tweetId").post(toggleTweetLike);
router.route("/getLikedVideos").get(getLikedVideos);

export default router;
