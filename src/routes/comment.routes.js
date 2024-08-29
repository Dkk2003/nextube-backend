import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJwt);

router.route("/getVideoComments/:videoId").get(getVideoComments);
router.route("/addComment").post(addComment);
router.route("/updateComment").patch(updateComment);
router.route("/deleteComment").delete(deleteComment);

export default router;
