import { db } from "../libs/db.js";
import { UserRole } from "../generated/prisma/index.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
    getJuggeOLanguageId,
    pollBatchResultsJudgeO,
    submitBatchToJudgeO,
} from "../libs/judge0.lib.js";

// admin controllers
export const createProblem = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testCases,
        codeSnippets,
        referenceSolutions,
    } = req.body;

    // Authorization check: Ensure only admins can create problems
    if (req.user?.role !== UserRole.ADMIN)
        throw new ApiError(403, "Only admins can create problems");

    // check if title is already exists
    const existingProblem = await db.problem.findFirst({
        where: { title },
    });
    if (existingProblem) {
        throw new ApiError(400, "Problem with this title already exists");
    }

    try {
        // Validate reference solutions for each programming language
        // This ensures that all provided solutions actually solve the problem correctly
        for (const [language, solution] of Object.entries(referenceSolutions)) {
            const languageId = getJuggeOLanguageId(language);

            if (!languageId) {
                throw new ApiError(400, `Unsupported language: ${language}`);
            }

            // Prepare batch submission for Judge0 API - each test case will be executed
            // against the reference solution to verify correctness
            const submission = testCases.map(({ input, output }) => ({
                source_code: solution,
                language_id: languageId,
                stdin: input,
                expected_output: output,
            }));

            console.log(
                "Submitting reference solutions to Judge0 for validation:",
                submission,
            );

            // Send batch submission to Judge0 online compiler
            const submissionResponse = await submitBatchToJudgeO(submission);

            // Extract submission tokens for polling results
            const tokens = submissionResponse.map((item) => item.token);

            // Poll Judge0 API until all submissions are processed
            console.log("Tokens for reference solutions:", tokens);
            const results = await pollBatchResultsJudgeO(tokens);

            // Verify that all test cases pass with the reference solution
            // Status ID 3 means "Accepted" in Judge0 API
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                console.log("Result-----", result);
                // console.log(
                //   `Testcase ${i + 1} and Language ${language} ----- result ${JSON.stringify(result.status.description)}`
                // );
                if (result.status.id !== 3) {
                    throw new ApiError(
                        400,
                        `Testcase ${i + 1} failed for language ${language}`,
                    );
                }
            }
        }
        // All solutions validated - create problem record in database
        const problem = await db.problem.create({
            data: {
                title,
                description,
                difficulty,
                tags,
                examples,
                constraints,
                hints: req.body.hints || null,
                editorial: req.body.editorial || null,
                testCases: testCases,
                codeSnippets: codeSnippets,
                referenceSolutions: referenceSolutions,
                userId: req.user.id,
            },
        });

        // Return successful response with created problem data
        return res
            .status(201)
            .json(
                new ApiResponse(201, "Problem created successfully", problem),
            );
    } catch (error) {
        console.error("Error creating problem:", error);
        throw new ApiError(500, "Failed to create problem", error);
    }
});

export const updateProblem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testCases,
        codeSnippets,
        referenceSolutions,
    } = req.body;

    // Authorization check: Ensure only admins can update problems
    if (req.user?.role !== UserRole.ADMIN)
        throw new ApiError(403, "Only admins can update problems");

    // Check if problem exists
    const existingProblem = await db.problem.findUnique({
        where: { id },
    });
    if (!existingProblem) {
        throw new ApiError(404, "Problem not found");
    }

    try {
        // Validate reference solutions for each programming language
        for (const [language, solution] of Object.entries(referenceSolutions)) {
            const languageId = getJuggeOLanguageId(language);

            if (!languageId) {
                throw new ApiError(400, `Unsupported language: ${language}`);
            }

            const submission = testCases.map(({ input, output }) => ({
                source_code: solution,
                language_id: languageId,
                stdin: input,
                expected_output: output,
            }));

            console.log(
                "Submitting reference solutions to Judge0 for validation:",
                submission,
            );

            const submissionResponse = await submitBatchToJudgeO(submission);
            const tokens = submissionResponse.map((item) => item.token);

            console.log("Tokens for reference solutions:", tokens);
            const results = await pollBatchResultsJudgeO(tokens);

            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                console.log("Result-----", result);
                if (result.status.id !== 3) {
                    throw new ApiError(
                        400,
                        `Testcase ${i + 1} failed for language ${language}`,
                    );
                }
            }
        }

        // Update problem record in database
        const updatedProblem = await db.problem.update({
            where: { id },
            data: {
                title,
                description,
                difficulty,
                tags,
                examples,
                constraints,
                hints: req.body.hints || null,
                editorial: req.body.editorial || null,
                testCases: testCases || existingProblem.testCases,
                codeSnippets: codeSnippets || existingProblem.codeSnippets,
                referenceSolutions:
                    referenceSolutions || existingProblem.referenceSolutions,
            },
        });

        if (!updatedProblem) {
            throw new ApiError(404, "Problem not found");
        }

        // Return successful response with updated problem data
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Problem updated successfully",
                    updatedProblem,
                ),
            );
    } catch (error) {
        console.error("Error updating problem:", error);
        throw new ApiError(500, "Failed to update problem", error);
    }
});

export const deleteProblem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res
            .status(400)
            .json(new ApiResponse(400, "Problem ID is required"));
    }

    // Authorization check: Ensure only admins can delete problems
    if (req.user?.role !== UserRole.ADMIN)
        throw new ApiError(403, "Only admins can delete problems");

    // Check if problem exists
    const existingProblem = await db.problem.findUnique({
        where: { id },
    });
    if (!existingProblem) {
        throw new ApiError(404, "Problem not found");
    }

    // Delete problem record from database
    await db.problem.delete({
        where: { id },
    });

    // Return successful response
    return res
        .status(200)
        .json(new ApiResponse(200, "Problem deleted successfully"));
});

// public controllers
export const getProblemById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res
            .status(400)
            .json(new ApiResponse(400, "Problem ID is required"));
    }
    const problem = await db.problem.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    if (!problem) {
        return res.status(404).json(new ApiResponse(404, "Problem not found"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Problem fetched successfully", problem));
});

export const getAllProblems = asyncHandler(async (req, res) => {
    const problems = await db.problem.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    if (problems.length === 0) {
        return res.status(404).json(new ApiResponse(404, "No problems found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "All problems fetched successfully", problems),
        );
});

export const getProblemsByTags = asyncHandler(async (req, res) => {
    const { tag } = req.params;
    if (!tag) {
        return res.status(400).json(new ApiResponse(400, "Tag is required"));
    }

    const problems = await db.problem.findMany({
        where: {
            tags: {
                has: tag,
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    if (problems.length === 0) {
        return res.status(404).json(new ApiResponse(404, "No problems found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `Problems with tag ${tag} fetched successfully`,
                problems,
            ),
        );
});

export const getProblemsByDifficulty = asyncHandler(async (req, res) => {
    const { level } = req.params;
    if (!level) {
        return res
            .status(400)
            .json(new ApiResponse(400, "Difficulty level is required"));
    }

    const problems = await db.problem.findMany({
        where: { difficulty: level },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    if (problems.length === 0) {
        return res.status(404).json(new ApiResponse(404, "No problems found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `Problems with difficulty ${level} fetched successfully`,
                problems,
            ),
        );
});

export const getAllSolvedProblemsByUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const solvedProblems = await db.problemSolved.findMany({
        where: { userId },
        include: {
            problem: {
                select: {
                    id: true,
                    title: true,
                    difficulty: true,
                    tags: true,
                },
            },
        },
    });

    if (solvedProblems.length === 0) {
        return res
            .status(404)
            .json(new ApiResponse(404, "No solved problems found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "All solved problems fetched successfully",
                solvedProblems,
            ),
        );
});
