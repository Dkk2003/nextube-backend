import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.use(verifyJwt);

router.route("/getAllVideos").get(getAllVideos);
router.route("/publishVideo").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnailFile", maxCount: 1 },
  ]),
  publishAVideo
);
router.route("/getVideo/:videoId").get(getVideoById);
router
  .route("/updateVideo/:videoId")
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/deleteVideo/:videoId").delete(deleteVideo);
router.route("/togglePublishStatus/:videoId").patch(togglePublishStatus);

export default router;
