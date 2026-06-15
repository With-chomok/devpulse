import { Router } from "express";
import {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
} from "./issues.controller";

import { authenticate, authorizeRole } from "../../middleware/auth.middleware";

const router = Router();

// Public rout

router.get("/", getAllIssues);
router.get("/:id", getSingleIssue);

// Authenticated routesss


router.post("/", authenticate, createIssue);
router.patch("/:id", authenticate, updateIssue);

router.delete("/:id", authenticate, authorizeRole("maintainer"), deleteIssue);

export default router;