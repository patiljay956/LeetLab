import axios from "axios";
import { ApiError } from "../utils/apiErrors.js";

export const getJuggeOLanguageId = (language) => {
    const languageMap = {
        CPP: 54,
        JAVA: 62,
        PYTHON: 71,
        JAVASCRIPT: 63,
        // Add more languages as needed
    };
    return languageMap[language] || null;
};

// Api endpoint : POST/submissions/batch{?base64_encoded}
// Example : POST https://ce.judge0.com/submissions/batch?base64_encoded=false&wait=true

export const submitBatchToJudgeO = async (submissions) => {
    try {
        const { data } = await axios.post(
            `${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false&wait=true`,
            { submissions },
        );

        console.log("JudgeO Batch Submission Response:", data);
        return data; // [{token},{token},...]
    } catch (error) {
        console.error("Error submitting batch to JudgeO:", error.message);
        throw new ApiError(500, "Failed to submit code to Judge0", error);
    }
};

// api endpoint : GET/submissions/batch{?tokens,base64_encoded,fields}

// example :  GET https://ce.judge0.com/submissions/batch?tokens=db54881d-bcf5-4c7b-a2e3-d33fe7e25de7,ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1,1b35ec3b-5776-48ef-b646-d5522bdeb2cc&base64_encoded=false&fields=token,stdout,stderr,status_id,language_id

export const pollBatchResultsJudgeO = async (tokens) => {
    while (true) {
        // Make POST request to fetch results for all tokens
        const { data } = await axios.get(
            `${process.env.JUDGE0_API_URL}/submissions/batch`,
            {
                params: {
                    tokens: tokens.join(","), // Join tokens with comma
                    base64_encoded: false, // Don't use base64 encoding
                    wait: true, // Wait for processing
                },
            },
        );

        // Check if all submissions have completed processing
        // Status ID >= 3 means the submission has finished (accepted, error, rejected, runtime error, etc.)
        // if all submissions are completed, return the results
        const isAllCompleted = data.submissions.every(
            (result) => result.status.id >= 3,
        );

        if (isAllCompleted) {
            return data; // Return all submission results
        }

        // Wait for 2 seconds before polling again to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
};

export const getLanguageNameById = (languageId) => {
    const languageMap = {
        54: "CPP",
        62: "Java",
        71: "Python",
        63: "JavaScript",
        // Add more languages as needed
    };
    return languageMap[languageId] || null;
};
