import { Router } from "express";
import {
    check,
    login,
    logout,
    register,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(verifyToken, logout);
router.route("/check").get(verifyToken, check);
export default router;
