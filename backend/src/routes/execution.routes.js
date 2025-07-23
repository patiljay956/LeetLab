import { Router } from "express";
import { checkAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import {
    executeCode,
    submitCode,
} from "../controllers/executeCode.controller.js";

const router = Router();

router.route("/execute").post(verifyToken, executeCode);
router.route("/submit").post(verifyToken, submitCode);

export default router;
