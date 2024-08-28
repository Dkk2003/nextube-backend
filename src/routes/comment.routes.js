import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getVideoComments } from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJwt);

router.route("/getVideoComments/:videoId").get(getVideoComments);

export default router;
