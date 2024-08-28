import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { healthCheck } from "../controllers/healthcheck.controller.js";

const router = Router();

router.use(verifyJwt);

router.route("/").get(healthCheck);

export default router;
