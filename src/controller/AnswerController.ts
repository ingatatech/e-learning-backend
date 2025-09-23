import { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { Answer } from "../database/models/AnswersModel"
import { Users } from "../database/models/UserModel"
import { Assessment } from "../database/models/AssessmentModel"
import { AssessmentQuestion } from "../database/models/AssessmentQuestionModel"
import { excludePassword } from "../utils/excludePassword"

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const { userId, assessmentId, questionId, answer } = req.body;

    if (!userId || !assessmentId || !questionId || answer === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userRepo = AppDataSource.getRepository(Users);
    const assessmentRepo = AppDataSource.getRepository(Assessment);
    const questionRepo = AppDataSource.getRepository(AssessmentQuestion);
    const answerRepo = AppDataSource.getRepository(Answer);

    const user = await userRepo.findOneBy({ id: userId });
    const assessment = await assessmentRepo.findOneBy({ id: assessmentId });
    const question = await questionRepo.findOneBy({ id: questionId });

    if (!user || !assessment || !question) {
      return res
        .status(404)
        .json({ error: "Users, assessment, or question not found" });
    }

    // Calculate correctness and points
    let isCorrect = false;
    let pointsEarned = 0;

    let correctAnswers: string[];
    try {
      correctAnswers = JSON.parse(question.correctAnswer);
      if (!Array.isArray(correctAnswers)) {
        correctAnswers = [String(correctAnswers)];
      }
    } catch (e) {
      // fallback if it's not JSON
      correctAnswers = [question.correctAnswer];
    }

    if (question.type === "multiple_choice") {
      if (
        Array.isArray(answer) &&
        answer.sort().join() === correctAnswers.sort().join()
      ) {
        isCorrect = true;
        pointsEarned = question.points;
      }
    } else {
      if (answer === question.correctAnswer) {
        isCorrect = true;
        pointsEarned = question.points;
      }
    }

    // 🔑 Check if this answer already exists
    let existingAnswer = await answerRepo.findOne({
      where: {
        user: { id: userId },
        assessment: { id: assessmentId },
        question: { id: questionId },
      },
      relations: ["user", "assessment", "question"],
    });

    if (existingAnswer) {
      // Update existing
      existingAnswer.answer = answer;
      existingAnswer.isCorrect = isCorrect;
      existingAnswer.pointsEarned = pointsEarned;

      await answerRepo.save(existingAnswer);

      return res.json({
        success: true,
        answer: {
          ...existingAnswer,
          user: excludePassword(existingAnswer.user),
        },
        updated: true,
      });
    } else {
      // Create new
      const newAnswer = answerRepo.create({
        user,
        assessment,
        question,
        answer,
        isCorrect,
        pointsEarned,
      });

      await answerRepo.save(newAnswer);

      return res.json({
        success: true,
        answer: {
          ...newAnswer,
          user: excludePassword(newAnswer.user),
        },
        updated: false,
      });
    }
  } catch (err) {
    console.error("Error submitting answer:", err);
    return res.status(500).json({ error: "Failed to submit answer" });
  }
};


export const getUserAssessmentAnswers = async (req: Request, res: Response) => {
  try {
    const { assessmentId, userId } = req.params;

    if (!assessmentId || !userId) {
      return res.status(400).json({ error: "Missing assessmentId or userId" });
    }

    const answerRepo = AppDataSource.getRepository(Answer);

    const answers = await answerRepo.find({
      where: { 
        assessment: { id: assessmentId },
        user: { id: Number(userId) }
      },
      relations: ["question"],
    });

    return res.json({ success: true, answers });
  } catch (err) {
    console.error("Error fetching user assessment answers:", err);
    return res.status(500).json({ error: "Failed to fetch answers" });
  }
};

