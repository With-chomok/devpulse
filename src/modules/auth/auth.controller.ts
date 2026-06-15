import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import pool from "../../config/db";
import { sendSuccess, sendError } from "../../utils/response";

// REGISTER

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  // Validation
  if (!name || !email || !password) {
    sendError(res, StatusCodes.BAD_REQUEST, "Name, email and password are required");
    return;
  }

  if (role && !["contributor", "maintainer"].includes(role)) {
    sendError(res, StatusCodes.BAD_REQUEST, "Role must be contributor or maintainer");
    return;
  }

  try {
    // Email check 
    const existingUser = await pool.query(
        
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {

      sendError(res, StatusCodes.BAD_REQUEST, "Email already registered");
      return;
    }

    // Password hash 
    const hashedPassword = await bcrypt.hash(password, 10);


    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at, updated_at`,

      [name, email, hashedPassword, role || "contributor"]
    );

    const user = result.rows[0];

    sendSuccess(res, StatusCodes.CREATED, "User registered successfully", user);
  } catch (err) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,

      "Registration failed",
      (err as Error).message
    );
  }
};


// login 

export const login = async (req: Request, res: Response): Promise<void> => {

  const { email, password } = req.body;

  // Validation
  if (!email || !password) {

    sendError(res, StatusCodes.BAD_REQUEST, "Email and password are required");
    return;
  }

  try {
    // User finding
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {

      sendError(res, StatusCodes.UNAUTHORIZED, "Invalid email or password");
      return;
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {


      sendError(res, StatusCodes.UNAUTHORIZED, "Invalid email or password");
      return;
    }

    // JWT token create

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    sendSuccess(res, StatusCodes.OK, "Login successful", {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });

  } catch (err) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Login failed",
      (err as Error).message
    );
  }
};