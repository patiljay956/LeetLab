import { db } from "../libs/db.js";
import { UserRole } from "../generated/prisma/index.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
    getLanguageNameById,
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
    console.log("submissions:", submissions);

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

export const submitCode = asyncHandler(async (req, res) => {
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

    const TestCases = problem.testCases;
    console.log("testCases:", TestCases);

    // prepare the submission and use JudgeO to execute the code

    const submissions = TestCases.map((testCase) => ({
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

    if (!results || !results.submissions || results.submissions.length === 0) {
        throw new ApiError(500, "Failed to get submission results from JudgeO");
    }

    // check if all test cases are passed else create detailed reason for failure and add it into final response

    const passedAndFailedTestCasesCount = results.submissions.reduce(
        (acc, result) => {
            if (result.status.id === 3) {
                // "Accepted"
                acc.passed++;
            } else {
                acc.failed++;
            }
            return acc;
        },
        { passed: 0, failed: 0 },
    );

    // prepare data to save in the database
    const submissionData = {
        userId,
        problemId: problem.id,
        sourceCode: {
            language: getLanguageNameById(languageId),
            code,
        },
        language: getLanguageNameById(languageId),
        stdin: JSON.stringify(TestCases.map((testCase) => testCase.input)),

        stdout: JSON.stringify(
            results.submissions.map((result) => result.stdout?.trim() || null),
        ),

        stderr: JSON.stringify(
            results.submissions.map((result) =>
                result.stderr || result.stderr === "" ? result.stderr : null,
            ),
        ),

        compiledOutput: JSON.stringify(
            results.submissions.map((result) =>
                result.compiled_output || result.compiled_output === ""
                    ? result.compiled_output
                    : null,
            ),
        ),

        status: results.submissions.every(
            (result) => result.status.id === 3, //  "Accepted"
        )
            ? "accepted"
            : "Wrong Answer", // or any other status you want to set

        timeTaken: Math.round(
            results.submissions.reduce(
                (total, result) => total + (parseFloat(result.time) || 0),
                0,
            ) * 1000,
        ), // Convert to milliseconds and round to integer

        memoryUsed: results.submissions.reduce(
            (total, result) => total + (parseInt(result.memory) || 0),
            0,
        ), // Ensure integer values
    };

    console.log("submissionData:", submissionData);
    // Save the submission in the database
    const savedSubmission = await db.submission.create({
        data: submissionData,
    });
    console.log("savedSubmission:", savedSubmission);

    if (!savedSubmission) {
        throw new ApiError(500, "Failed to save submission");
    }

    // if all test cases are passed, mark the problem as solved
    if (
        results.submissions.length > 0 &&
        results.submissions.every(
            (result) => result.status.id === 3, //  "Accepted"
        )
    ) {
        // upsert: if the record exists, update it; if not, create a new one
        await db.problemSolved.upsert({
            where: {
                userId_problemId: {
                    userId: userId,
                    problemId: problem.id,
                },
            },
            update: {},
            create: {
                userId: userId,
                problemId: problem.id,
            },
        });
    }

    // prepare test case results to save in the database
    const TestCaseResultData = {
        submissionId: savedSubmission.id,
        testCaseIndex: 0, // This will be updated later
        input: "",
        expectedOutput: "",
        actualOutput: "",
        status: "",
        timeTaken: 0,
        memoryUsed: 0,
        type: "public", // Assuming all test cases are public for now
    };
    const testCaseResults = results.submissions.map((result, index) => ({
        ...TestCaseResultData,
        testCaseIndex: index + 1,
        input: TestCases[index].input,
        expectedOutput: TestCases[index].output,
        actualOutput: result.stdout.trim(),
        status: result.status.description.toLowerCase(),
        timeTaken: parseFloat(result.time) * 1000, // Convert seconds to milliseconds
        memoryUsed: result.memory,
        type: TestCases[index].type || "public", // Default to public if not specified
    }));

    console.log("testCaseResults:", testCaseResults);
    // Save the submission and test case results in the database

    const savedTestCaseResults = await db.testCaseResult.createMany({
        data: testCaseResults,
    });

    console.log("savedTestCaseResults:", savedTestCaseResults);

    if (!savedTestCaseResults) {
        throw new ApiError(500, "Failed to save test case results");
    }

    // create the response object for frontend
    const response = {
        submission: {
            ...submissionData,
            id: savedSubmission.id || "generated-submission-id", // Replace with actual saved submission ID
        },
        testCaseResults: testCaseResults
            .filter((result) => result.type === "public")
            .map((result) => ({
                ...result,
                submissionId: savedSubmission.id, // Link test case results to the submission
            })),
        results: passedAndFailedTestCasesCount,
    };

    res.status(200).json(
        new ApiResponse(200, "Code submitted successfully", response, true),
    );
});

export const getSubmission = asyncHandler(async (req, res) => {});

export const getSubmissionsByProblem = asyncHandler(async (req, res) => {});

export const getSubmissionsByUser = asyncHandler(async (req, res) => {});
