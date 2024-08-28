import express from "express";
import cors from "cors";
import { JSON_LIMIT, URL_ENCODED_LIMIT } from "./constants.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: URL_ENCODED_LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import

import userRoute from "./routes/user.routes.js";
import videoRoute from "./routes/video.routes.js";
import tweetRoute from "./routes/tweet.routes.js";
import subscriptionRoute from "./routes/subscription.routes.js";
import playlistRoute from "./routes/playlist.routes.js";
import likeRoute from "./routes/like.routes.js";
import healthCheckRoute from "./routes/healthcheck.routes.js";
import commentRoute from "./routes/comment.routes.js";

app.use("/api/v1/users", userRoute);
app.use("/api/v1/videos", videoRoute);
app.use("/api/v1/tweet", tweetRoute);
app.use("/api/v1/subscription", subscriptionRoute);
app.use("/api/v1/playlist", playlistRoute);
app.use("/api/v1/like", likeRoute);
app.use("/api/v1/healthCheck", healthCheckRoute);
app.use("/api/v1/comment", commentRoute);

export default app;
