import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { ApiError, logger } from "@onetap/shared";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info(`Auth check headers: ${JSON.stringify(req.headers)}`);
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            return next(new ApiError(401, "Unauthorized: Please log in to access this resource"));
        }

        (req as any).user = session.user;
        (req as any).session = session.session;
        next();
    } catch (error) {
        next(new ApiError(401, "Authentication failed"));
    }
};
