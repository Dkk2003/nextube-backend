import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJwt);

router.route("/toggleSubscription/:channelId").post(toggleSubscription);
router
  .route("/getUserChannelSubscribers/:channelId")
  .get(getUserChannelSubscribers);
router.route("/getSubscribedChannels/:subscriberId").get(getSubscribedChannels);

export default router;
