import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJwt);

router.route("/toggleSubscription/:channelId").post(toggleSubscription);

export default router;
