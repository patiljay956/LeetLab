import { z } from "zod";

export const passwordSchema = z
    .string({ required_error: "Password must be provided" })
    .trim()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(25, { message: "Password must not be more than 25 characters" })
    .refine((val) => /[A-Z]/.test(val), {
        message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[0-9]/.test(val), {
        message: "Password must contain at least one number",
    })
    .refine((val) => /[^A-Za-z0-9]/.test(val), {
        message: "Password must contain at least one special character",
    });

export const registerSchema = z.object({
    email: z
        .email({
            message: "Invalid Email address",
        })
        .trim()
        .min(5, { message: "Email must be provided" })
        .max(100, { message: "Email must be less than 100 characters" }),

    password: passwordSchema,
    name: z
        .string()
        .trim()
        .min(3, { message: "Name must have at least 3 characters" })
        .max(50, { message: "Name must be less than 50 characters" })
        .optional(),

    iamge: z.string().optional(),
});

export const loginSchema = z
    .object({
        email: z
            .email({
                message: "Invalid Email address",
            })
            .trim()
            .min(5, { message: "Email must be provided" })
            .max(100, { message: "Email must be less than 100 characters" }),

        password: passwordSchema,
    })
    .strict();
