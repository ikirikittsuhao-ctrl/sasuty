import { Router } from "express";
import health from "./health";
import authRouter from "./auth";
import postsRouter from "./posts";
import usersRouter from "./users";
import feedRouter from "./feed";

const router = Router();

router.use("/", health);
router.use("/auth", authRouter);
router.use("/posts", postsRouter);
router.use("/users", usersRouter);

// Feed, trending, search, notifications all handled in feedRouter
// but mounted at root so the paths inside it match /feed, /trending, /search, /notifications
router.use("/", feedRouter);

export default router;
