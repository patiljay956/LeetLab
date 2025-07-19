import { Router } from "express";
import { checkAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { executeCode } from "../controllers/executeCode.controller.js";

const router = Router();

router.route("/execute").post(verifyToken, executeCode);

export default router;
