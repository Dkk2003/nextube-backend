import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  getPublicVideos,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/getPublicVideos").get(getPublicVideos);
router.route("/getAllVideos").get(verifyJwt, getAllVideos);
router.route("/publishVideo").post(
  verifyJwt,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnailFile", maxCount: 1 },
  ]),
  publishAVideo
);
router.route("/getVideo/:videoId").get(verifyJwt, getVideoById);
router
  .route("/updateVideo/:videoId")
  .patch(verifyJwt, upload.single("thumbnail"), updateVideo);

router.route("/deleteVideo/:videoId").delete(verifyJwt, deleteVideo);
router
  .route("/togglePublishStatus/:videoId")
  .patch(verifyJwt, togglePublishStatus);

export default router;
