import { db } from "../libs/db.js";
import { UserRole } from "../generated/prisma/index.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
    pollBatchResultsJudgeO,
    submitBatchToJudgeO,
} from "../libs/judge0.lib.js";

export const executeCode = asyncHandler(async (req, res) => {
    const { problemId, languageId, code } = req.body;

    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized access");
    }

    if (!problemId || !languageId || !code) {
        throw new ApiError(
            400,
            "Problem ID, language ID, and code are required",
        );
    }

    // check if problem exists
    const problem = await db.problem.findUnique({
        where: { id: problemId },
        select: {
            id: true,
            title: true,
            testCases: true,
        },
    });
    if (!problem) {
        throw new ApiError(404, "Problem not found");
    }
    console.log("problem:", problem);
    const publicTestCases = problem.testCases.filter(
        (testCase) => testCase.type === "public",
    );
    console.log("testCases:", publicTestCases);
    // prepare the submission and use JudgeO to execute the code

    const submissions = publicTestCases.map((testCase) => ({
        language_id: languageId,
        source_code: code,
        stdin: testCase.input,
        expected_output: testCase.output,
    }));

    // submit the batch to JudgeO
    const submissionResults = await submitBatchToJudgeO(submissions);

    // Extract tokens from the submission results
    const tokens = submissionResults.map((result) => result.token);
    // Poll for results using the tokens
    let results = await pollBatchResultsJudgeO(tokens);

    console.log("Submission results:", results);

    // prepare the response
    const response = results.submissions.map((result, index) => ({
        testCase: index + 1,
        input: publicTestCases[index].input,
        output: result.stdout.trim(),
        expectedOutput: publicTestCases[index].output,
        status: result.status.description,
        time: result.time,
        memory: result.memory,
    }));

    res.status(200).json(
        new ApiResponse(200, "Code executed successfully", response, true),
    );
});

export const submitCode = asyncHandler(async (req, res) => {});

export const getSubmission = asyncHandler(async (req, res) => {});

export const getSubmissionsByProblem = asyncHandler(async (req, res) => {});

export const getSubmissionsByUser = asyncHandler(async (req, res) => {});
