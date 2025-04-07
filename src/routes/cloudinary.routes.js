import { Router } from "express";
import { deleteStorage } from "../controllers/cloudinary.controller.js";

const router = Router();

router.delete("/delete", deleteStorage);

export default router;
