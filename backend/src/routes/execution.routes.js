import { Router } from "express";
import { checkAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import {
    executeCode,
    getSubmissionById,
    getSubmissionsByProblem,
    getSubmissionsByUser,
    submitCode,
} from "../controllers/executeCode.controller.js";

const router = Router();

router.route("/execute").post(verifyToken, executeCode);
router.route("/submit").post(verifyToken, submitCode);

router.route("/p/:id").get(getSubmissionsByProblem);
router.route("/s/:id").get(getSubmissionById);
router.route("/u/:id").get(getSubmissionsByUser);

export default router;
