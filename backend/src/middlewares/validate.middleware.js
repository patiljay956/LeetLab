import { ZodError } from "zod";

export const validate = (schemas) => (req, res, next) => {
    try {
        if (schemas.body) req.body = schemas.body.parse(req.body);

        if (schemas.query) req.query = schemas.query.parse(req.query);

        if (schemas.params) req.params = schemas.params.parse(req.params);

        next();
    } catch (err) {
        console.log(typeof err);
        console.log(err);
        if (err instanceof ZodError) {
            const zodErrors = err.issues.map((error) => ({
                field: error.path.join("."),
                message: error.message,
            }));

            return res.status(400).json({
                status: "error",
                message: "Validation failed",
                errors: zodErrors,
            });
        }

        next(err);
    }
};
