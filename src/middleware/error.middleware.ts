import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";
import { StatusCodes } from "http-status-codes";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Unexpected error:", err.message);
  sendError(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    "Something went wrong",
    err.message
  );
};