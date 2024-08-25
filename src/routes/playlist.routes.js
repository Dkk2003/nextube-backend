import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJwt);

router.route("/createPlaylist").post(createPlaylist);
router.route("/getUserPlaylists/:userId").get(getUserPlaylists);
router.route("/getPlaylistById/:playlistId").get(getPlaylistById);
router
  .route("/addVideoToPlaylist/:playlistId/:videoId")
  .post(addVideoToPlaylist);
router
  .route("/removeVideoFromPlaylist/:playlistId/:videoId")
  .delete(removeVideoFromPlaylist);
router.route("/deletePlaylist/:playlistId").delete(deletePlaylist);
router.route("/updatePlaylist/:playlistId").patch(updatePlaylist);

export default router;
