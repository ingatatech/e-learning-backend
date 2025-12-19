import { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { Answer } from "../database/models/AnswersModel"
import { Users } from "../database/models/UserModel"
import { Assessment } from "../database/models/AssessmentModel"
import { AssessmentQuestion } from "../database/models/AssessmentQuestionModel"
import { excludePassword } from "../utils/excludePassword"
import { Progress } from "../database/models/ProgressModel"
import { sendGradingCompleteEmail } from "../services/SessionOtp"
import { io } from ".."
import { parseCorrectAnswer0 } from "../middleware/parseAnswers"

export const submitAnswers = async (req: Request, res: Response) => {
  try {
    const { userId, assessmentId, answers } = req.body;

    if (!userId || !assessmentId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    const userRepo = AppDataSource.getRepository(Users);
    const assessmentRepo = AppDataSource.getRepository(Assessment);
    const questionRepo = AppDataSource.getRepository(AssessmentQuestion);
    const answerRepo = AppDataSource.getRepository(Answer);

    const user = await userRepo.findOneBy({ id: userId });
    const assessment = await assessmentRepo.findOneBy({ id: assessmentId });

    if (!user || !assessment) {
      return res.status(404).json({ error: "User or assessment not found" });
    }

    // 🔁 We'll process all answers in a loop
    const processedAnswers = [];

    for (const { questionId, answer } of answers) {
      if (!questionId || answer === undefined) continue;

      const question = await questionRepo.findOneBy({ id: questionId });
      if (!question) continue;

      // ----- Parsing helpers -----
      const parseCorrectAnswers = (raw: any): string[] => {
        if (Array.isArray(raw)) return raw.map(String);
        if (typeof raw === "string") {
          const s = raw.trim();
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.map(String);
          } catch (_) {}
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
          return s.split(",").map((x) => x.trim()).filter(Boolean);
        }
        return [String(raw)];
      };

      const parseSubmitted = (raw: any): string[] => {
        if (Array.isArray(raw)) return raw.map(String);
        if (typeof raw === "string") {
          const s = raw.trim();
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.map(String);
          } catch (_) {}
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
          return s.split(",").map((x) => x.trim()).filter(Boolean);
        }
        return [String(raw)];
      };

      const normalize = (s: string) => s.replace(/^"(.*)"$/, "$1").trim().toLowerCase();

      // ---- Evaluation -----
      let correctAnswers = parseCorrectAnswers(question.correctAnswer);
      if (!Array.isArray(correctAnswers)) correctAnswers = [String(correctAnswers)];

      const submittedAnswers = parseSubmitted(answer);

      const normCorrect = correctAnswers.map(normalize).sort();
      const normSubmitted = submittedAnswers.map(normalize).sort();

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.type === "multiple_choice") {
        if (
          normCorrect.length === normSubmitted.length &&
          normCorrect.every((v, i) => v === normSubmitted[i])
        ) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      } else if (question.type === "matching") {
          let submittedMap: Record<string, string> = {}

          try {
            submittedMap =
              typeof answer === "string" ? JSON.parse(answer) : answer
          } catch {
            submittedMap = {}
          }

          let correctPairs: Array<{ left: string; right: string }> = []

          try {
            correctPairs =
              typeof question.correctAnswer === "string"
                ? parseCorrectAnswer0(question.correctAnswer as any)
                : question.correctAnswer
            
          } catch {
            correctPairs = []
          }

          let correctCount = 0

          correctPairs.forEach((pair, index) => {
            const submitted = normalize(submittedMap[index])
            const correct = normalize(pair.right)

            if (submitted && submitted === correct) {
              correctCount++
            }
          })

          // full or partial credit
          if (correctCount > 0) {
            pointsEarned = Math.round(
              (correctCount / correctPairs.length) * question.points
            )
          }

          isCorrect = correctCount === correctPairs.length
      }
      else {
        const correctSingle = normalize(String(question.correctAnswer));
        const submittedSingle = normalize(Array.isArray(answer) ? String(answer[0]) : String(answer));
        if (submittedSingle === correctSingle) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      }

      // ---- Save or update answer ----
      let existingAnswer = await answerRepo.findOne({
        where: {
          user: { id: userId },
          assessment: { id: assessmentId },
          question: { id: questionId },
        },
        relations: ["user", "assessment", "question"],
      });

      if (existingAnswer) {
        existingAnswer.answer = answer;
        existingAnswer.isCorrect = isCorrect;
        existingAnswer.pointsEarned = pointsEarned;
        await answerRepo.save(existingAnswer);
        processedAnswers.push({ ...existingAnswer, updated: true });
      } else {
        const newAnswer = answerRepo.create({
          user,
          assessment,
          question,
          answer,
          isCorrect,
          pointsEarned,
        });
        await answerRepo.save(newAnswer);
        processedAnswers.push({ ...newAnswer, updated: false });
      }
    }

    return res.json({
      success: true,
      count: processedAnswers.length,
      answers: processedAnswers.map((a) => ({
        ...a,
        user: excludePassword(a.user),
      })),
    });
  } catch (err) {
    console.error("Error submitting answers:", err);
    return res.status(500).json({ error: "Failed to submit answers" });
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
      
      io.to(`user-${studentId}`).emit("assessment:graded", {
        assessmentId,
        courseId: assessment.course?.id,
        score: finalScore,
        passed: finalScore >= assessment.passingScore,
      })
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




