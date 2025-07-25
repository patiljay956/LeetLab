import { Router } from "express";
import { checkAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import {
    createProblem,
    deleteProblem,
    getAllProblems,
    getAllSolvedProblemsByUser,
    getProblemById,
    getProblemsByTags,
    getProblemsByDifficulty,
    updateProblem,
} from "../controllers/problem.controller.js";
const router = Router();
// Problem management routes (admin only)
router
    .route("/p/:id")
    .put(verifyToken, checkAdmin, updateProblem)
    .delete(verifyToken, checkAdmin, deleteProblem);

router.route("/create-problem").post(verifyToken, checkAdmin, createProblem);

// public problem routes
router.route("/get-problem/:id").get(getProblemById);
router.route("/get-all-problems").get(getAllProblems);
router.route("/tags/:tag").get(getProblemsByTags);
router.route("/difficulty/:level").get(getProblemsByDifficulty);

// Submission routes
router.route("/submit-all").get(verifyToken, getAllSolvedProblemsByUser); // get all problems solved by user

export default router;
