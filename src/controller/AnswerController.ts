import { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { Answer } from "../database/models/AnswersModel"
import { Users } from "../database/models/UserModel"
import { Assessment } from "../database/models/AssessmentModel"
import { AssessmentQuestion } from "../database/models/AssessmentQuestionModel"
import { excludePassword } from "../utils/excludePassword"
import { Course } from "../database/models/CourseModel"
import { In } from "typeorm"
import { Progress } from "../database/models/ProgressModel"
import { sendGradingCompleteEmail } from "../services/SessionOtp"

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

    // Helper: parse various stored correctAnswer formats into string[]
    const parseCorrectAnswers = (raw: any): string[] => {
      if (Array.isArray(raw)) return raw.map(String);

      if (typeof raw === "string") {
        const s = raw.trim();

        // Try JSON first (["a","b"])
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) return parsed.map(String);
          if (parsed !== null && parsed !== undefined) return [String(parsed)];
        } catch (e) {
          // not JSON — continue
        }

        // Postgres array literal: {"a","b"} or {a,b}
        if (s.startsWith("{") && s.endsWith("}")) {
          const inner = s.slice(1, -1);
          // match either "quoted items" or unquoted items separated by commas
          const re = /"([^"]+)"|([^,]+)/g;
          const out: string[] = [];
          let m: RegExpExecArray | null;
          while ((m = re.exec(inner)) !== null) {
            const val = (m[1] || m[2] || "").trim();
            if (val) out.push(val);
          }
          return out;
        }

        // Fallback: comma-separated string "a,b"
        return s.split(",").map((x) => x.trim()).filter(Boolean);
      }

      // Anything else
      return [String(raw)];
    };

    // Helper: parse submitted answer (may be array or string)
    const parseSubmitted = (raw: any): string[] => {
      if (Array.isArray(raw)) return raw.map(String);
      if (typeof raw === "string") {
        const s = raw.trim();
        // If it's JSON array string
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) return parsed.map(String);
        } catch (_) {}
        // If looks like postgres array literal
        if (s.startsWith("{") && s.endsWith("}")) {
          const inner = s.slice(1, -1);
          const re = /"([^"]+)"|([^,]+)/g;
          const out: string[] = [];
          let m: RegExpExecArray | null;
          while ((m = re.exec(inner)) !== null) {
            const val = (m[1] || m[2] || "").trim();
            if (val) out.push(val);
          }
          return out;
        }
        // comma-separated
        return s.split(",").map((x) => x.trim()).filter(Boolean);
      }
      return [String(raw)];
    };

    // normalize: strip surrounding quotes, trim, lowercase
    const normalize = (s: string) => s.replace(/^"(.*)"$/,'$1').trim().toLowerCase();

    // Get correct answers from question.correctAnswer
    let correctAnswers = parseCorrectAnswers(question.correctAnswer);
    if (!Array.isArray(correctAnswers)) correctAnswers = [String(correctAnswers)];

    // Get submitted answers
    const submittedAnswers = parseSubmitted(answer);

    // For comparison: normalize and sort
    const normCorrect = correctAnswers.map(normalize).sort();
    const normSubmitted = submittedAnswers.map(normalize).sort();

    let isCorrect = false;
    let pointsEarned = 0;

    if (question.type === "multiple_choice") {
      // compare sets (order-insensitive)
      if (
        normCorrect.length === normSubmitted.length &&
        normCorrect.every((v, i) => v === normSubmitted[i])
      ) {
        isCorrect = true;
        pointsEarned = question.points;
      }
    } else {
      // for other types: compare normalized single answers
      const correctSingle = normalize(String(question.correctAnswer));
      const submittedSingle = normalize(Array.isArray(answer) ? String(answer[0]) : String(answer));
      if (submittedSingle === correctSingle) {
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


export const getSubmissionsByInstructor = async (req: Request, res: Response) => {
  const { instructorId } = req.params

  try {
    if (!instructorId) {
      return res.status(400).json({ message: "Missing instructorId" })
    }

    const answerRepo = AppDataSource.getRepository(Answer)

    // Join Progress manually
    const answers = await answerRepo
      .createQueryBuilder("answer")
      .leftJoinAndSelect("answer.user", "user")
      .leftJoinAndSelect("answer.assessment", "assessment")
      .leftJoinAndSelect("answer.question", "question")
      .leftJoinAndSelect("assessment.lesson", "lesson")
      .leftJoinAndSelect("lesson.module", "module")
      .leftJoinAndSelect("module.course", "course")
      .innerJoin(Progress, "progress", "progress.assessmentId = assessment.id AND progress.userId = user.id")
      .where("course.instructorId = :instructorId", { instructorId })
      .andWhere("progress.status = :status", { status: "pending" })
      .orderBy("answer.createdAt", "DESC")
      .getMany()

    if (!answers.length) {
      return res.status(404).json({ message: "No pending submissions found" })
    }

    // Group by student + assessment
    const submissionMap = new Map<string, any>()

    for (const ans of answers) {
      const key = `${ans.user.id}-${ans.assessment.id}`
      if (!submissionMap.has(key)) {
        submissionMap.set(key, {
          id: key,
          assessmentId: `${ans.assessment.id}`,
          studentId: `${ans.user.id}`,
          studentName: `${ans.user.firstName} ${ans.user.lastName}`,
          studentEmail: ans.user.email,
          courseName: ans.assessment.lesson?.module.course.title,
          assessmentTitle: ans.assessment.title,
          submittedAt: ans.createdAt,
          questions: [],
        })
      }

      const submission = submissionMap.get(key)
      submission.questions.push({
        id: ans.question.id,
        question: ans.question.question,
        type: ans.question.type,
        answer: ans.answer,
        answerId: ans.id,
        points: ans.question.points || 0,
        isCorrect: ans.isCorrect,
        pointsEarned: ans.pointsEarned || 0,
      })
    }

    const submissions = Array.from(submissionMap.values())

    return res.status(200).json({
      success: true,
      instructorId,
      totalSubmissions: submissions.length,
      submissions,
    })
  } catch (err) {
    console.error("Failed to fetch pending submissions:", err)
    return res.status(500).json({ message: "Failed to fetch submissions" })
  }
}



export const gradeAssessmentManually = async (req: Request, res: Response) => {
  const { assessmentId, studentId, gradedAnswers, finalScore } = req.body

  const answerRepo = AppDataSource.getRepository(Answer)
  const progressRepo = AppDataSource.getRepository(Progress)
  const assessmentRepo = AppDataSource.getRepository(Assessment)

  try {
    // Fetch assessment
    const assessment = await assessmentRepo.findOne({
      where: { id: assessmentId },
    })
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" })
    }

    // Update each answer with pointsEarned
    for (const graded of gradedAnswers) {
      console.log(graded)
      await answerRepo.update(
        { id: graded.answerId, user: { id: studentId } },
        { pointsEarned: graded.pointsEarned }
      )
    }

    //  Update progress table
    const progress = await progressRepo.findOne({
      where: { user: { id: studentId }, course: { id: assessment.course?.id }, assessment: { id: assessmentId } },
      relations: ["course", "user"],
    })

    if (progress) {
      if (finalScore >= assessment.passingScore) {
        progress.status = "completed"
        progress.isCompleted = true
      } else {
        progress.status = "failed"
        progress.isCompleted = false
      }

      progress.score = finalScore
      await progressRepo.save(progress)

      // Send grading complete email
      if (progress.user?.email) {
        await sendGradingCompleteEmail(
          progress.user.email,
          progress.user.lastName || "",
          progress.user.firstName || "",
          assessment.title,
          req
        )
      }
    }

    return res.status(200).json({
      message: "Assessment graded successfully",
      score: finalScore,
      passed: finalScore >= assessment.passingScore,
    })
  } catch (err) {
    console.error("Manual grading error:", err)
    res.status(500).json({ message: "Failed to grade assessment" })
  }
}




