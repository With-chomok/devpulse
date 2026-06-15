import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pool from "../../config/db";
import { sendSuccess, sendError } from "../../utils/response";

// CREATE ISSUE

export const createIssue = async (req: Request, res: Response): Promise<void> => {
  const { title, description, type } = req.body;
  const reporter_id = req.user!.id;

  // Validation
  if (!title || !description || !type) {
    sendError(res, StatusCodes.BAD_REQUEST, "Title, description and type are required");
    return;
  }

  if (title.length > 150) {
    sendError(res, StatusCodes.BAD_REQUEST, "Title must be 150 characters or less");
    return;
  }

  if (description.length < 20) {
    sendError(res, StatusCodes.BAD_REQUEST, "Description must be at least 20 characters");
    return;
  }

  if (!["bug", "feature_request"].includes(type)) {
    sendError(res, StatusCodes.BAD_REQUEST, "Type must be bug or feature_request");
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO issues (title, description, type, reporter_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, type, reporter_id]
    );

    sendSuccess(res, StatusCodes.CREATED, "Issue created successfully", result.rows[0]);
  } catch (err) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to create issue",
      (err as Error).message
    );
  }
};

// GET ALL ISSUES

export const getAllIssues = async (req: Request, res: Response): Promise<void> => {
  const { sort, type, status } = req.query;

  try {
    // Base query 
    let query = "SELECT * FROM issues WHERE 1=1";
    const params: unknown[] = [];
    let paramCount = 1;

    // Filter by typeee
    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    // Filter by statu
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Sortted

    if (sort === "oldest") {
      query += " ORDER BY created_at ASC";
    } else {
      query += " ORDER BY created_at DESC";
    }

    const issuesResult = await pool.query(query, params);
    const issues = issuesResult.rows;

    if (issues.length === 0) {

      sendSuccess(res, StatusCodes.OK, "Issues retrived successfully", []);
      return;
    }

    
    const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

    const reportersResult = await pool.query(
      `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
      [reporterIds]
    );


    const reporterMap: Record<number, { id: number; name: string; role: string }> = {};
    reportersResult.rows.forEach((reporter) => {
      reporterMap[reporter.id] = reporter;
    });


    const issuesWithReporter = issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterMap[issue.reporter_id] || null,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    }));

    sendSuccess(res, StatusCodes.OK, "Issues retrived successfully", issuesWithReporter);
  } catch (err) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch issues",
      (err as Error).message
    );
  }
};


// GET SINGLE ISSUE

export const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const issueResult = await pool.query(
      "SELECT * FROM issues WHERE id = $1",
      [id]
    );

    if (issueResult.rows.length === 0) {
      sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
      return;
    }

    const issue = issueResult.rows[0];


    const reporterResult = await pool.query(
      "SELECT id, name, role FROM users WHERE id = $1",
      [issue.reporter_id]
    );

    const reporter = reporterResult.rows[0] || null;

    sendSuccess(res, StatusCodes.OK, "Issue retrived successfully", {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    })




  } catch (err) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch issue",
      (err as Error).message
    );
  }
};


// UPDATE ISSUE

export const updateIssue = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, type } = req.body;
  const { role, id: userId } = req.user!;

  try {

    const issueResult = await pool.query(
      "SELECT * FROM issues WHERE id = $1",
      [id]
    );



    if (issueResult.rows.length === 0) {
      sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
      return;
    }

    const issue = issueResult.rows[0];


    if (role === "contributor") {

      if (issue.reporter_id !== userId) {
        sendError(res, StatusCodes.FORBIDDEN, "You can only update your own issues");
        return;
      }

      if (issue.status !== "open") {
        sendError(
          res,
          StatusCodes.CONFLICT,
          "You can only update issues with open status"
        );
        return;
      }
    }

    // Validation
    if (title && title.length > 150) {
      sendError(res, StatusCodes.BAD_REQUEST, "Title must be 150 characters or less");
      return;
    }

    if (description && description.length < 20) {
      sendError(res, StatusCodes.BAD_REQUEST, "Description must be at least 20 characters");
      return;
    }

    if (type && !["bug", "feature_request"].includes(type)) {
      sendError(res, StatusCodes.BAD_REQUEST, "Type must be bug or feature_request");
      return;
    }

    // Update 
    const updatedTitle = title || issue.title;
    const updatedDescription = description || issue.description;
    const updatedType = type || issue.type;

    const result = await pool.query(
      `UPDATE issues
       SET title = $1, description = $2, type = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [updatedTitle, updatedDescription, updatedType, id]
    );

    sendSuccess(res, StatusCodes.OK, "Issue updated successfully", result.rows[0]);
  } catch (err) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update issue",
      (err as Error).message
    );
  }
};


// DELETE ISSUE

export const deleteIssue = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const issueResult = await pool.query(
      "SELECT id FROM issues WHERE id = $1",
      [id]
    );

    if (issueResult.rows.length === 0) {
      sendError(res, StatusCodes.NOT_FOUND, "Issue not found");
      return;
    }

    await pool.query("DELETE FROM issues WHERE id = $1", [id]);

    sendSuccess(res, StatusCodes.OK, "Issue deleted successfully", null);
  } catch (err) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to delete issue",
      (err as Error).message
    );
  }
};