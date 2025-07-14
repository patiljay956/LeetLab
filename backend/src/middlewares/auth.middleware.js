import jwt from "jsonwebtoken";
import { db } from "../libs/db.js";
import { ApiError } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyToken = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized Access ");
        }

        const decodeToken = await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
        );

        const user = await db.user.findUnique({
            where: {
                id: decodeToken.id,
            },
        });

        if (!user) {
            throw new ApiError(
                401,
                "User is not Authorized to access this link ",
            );
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "invalid token ");
    }
});
