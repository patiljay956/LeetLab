import bcrypt from "bcryptjs";
import { db } from "../libs/db.js";
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        throw new ApiError(400, "Email already exists, please login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate initials for avatar
    const initials = name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    const avatarUrl = `https://placehold.co/150x150/${randomColor}/000000?text=${initials}`;

    const user = await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: UserRole.USER,
            image: avatarUrl,
        },
    });

    if (!user) {
        throw new ApiError(500, "Unable to create user");
    }

    // Generate Access Token
    const accessToken = jwt.sign(
        { id: user.id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
    );

    // Remove sensitive data
    const userResponse = {
        ...user,
        password: undefined,
    };

    const options = {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                201,
                { user: userResponse },
                "User registered successfully",
            ),
        );
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await db.user.findUnique({
        where: {
            email,
        },
    });

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate Access Token
    const accessToken = jwt.sign(
        { id: user.id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
    );

    // Generate Access Token
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        },
    );

    // Remove sensitive data
    const userResponse = {
        ...user,
        password: undefined,
    };

    const options = {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: userResponse },
                "User logged in successfully",
            ),
        );
});

export const logout = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const check = asyncHandler(async (req, res) => {
    // This assumes req.user is set by middleware
    if (!req.user) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { authenticated: false },
                    "User not authenticated",
                ),
            );
    }

    const user = await db.user.findUnique({
        where: {
            id: req.user.id,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { authenticated: false },
                    "User not found",
                ),
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { authenticated: true, user },
                "User authenticated",
            ),
        );
});
