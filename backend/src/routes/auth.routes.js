import { Router } from "express";
import {
    check,
    login,
    logout,
    register,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

router.route("/register").post(validate({ body: registerSchema }), register);
router.route("/login").post(validate({ body: loginSchema }), login);
router.route("/logout").post(verifyToken, logout);
router.route("/check").get(verifyToken, check);
export default router;
