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

export default app;
