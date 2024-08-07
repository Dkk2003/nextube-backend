import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();
router.use(verifyJwt);

router.route("/createTweet").post(createTweet);
router.route("/getTweets").get(getUserTweets);
router.route("/updateTweet/:tweetId").patch(updateTweet);
router.route("/deleteTweet/:tweetId").delete(deleteTweet);

export default router;
