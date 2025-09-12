import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Course } from "../database/models/CourseModel";
import { Module } from "../database/models/ModuleModel";
import { Lesson } from "../database/models/LessonModel";
import { Assessment } from "../database/models/AssessmentModel";
import { AssessmentQuestion } from "../database/models/AssessmentQuestionModel";
import { Users } from "../database/models/UserModel";
import { excludePassword } from "../utils/excludePassword";
import { uploadToCloud } from "../services/cloudinary";
import { Organization } from "../database/models/OrganizationModel";

export const createCourse = async (req: Request, res: Response) => {
  const courseRepo = AppDataSource.getRepository(Course);
  const moduleRepo = AppDataSource.getRepository(Module);
  const lessonRepo = AppDataSource.getRepository(Lesson);
  const assessmentRepo = AppDataSource.getRepository(Assessment);
  const questionRepo = AppDataSource.getRepository(AssessmentQuestion);
  const userRepo = AppDataSource.getRepository(Users);

  const {
    title,
    description,
    thumbnail,
    level,
    price,
    isPublished,
    duration,
    tags,
    instructorId,
    organizationId,
    modules, // array of modules with lessons & assessments
  } = req.body;

  try {
    const instructor = await userRepo.findOneBy({ id: Number(instructorId) });
    if (!instructor || !["instructor", "admin"].includes(instructor.role)) {
        return res.status(400).json({ message: "Instructor not found or user is not an instructor" });
        }
    const organization = await userRepo.findOneBy({ id: Number(organizationId) });
    if (!organization) return res.status(400).json({ message: "Organization not found" });

    const course = courseRepo.create({
      title,
      description,
      thumbnail,
      level,
      price,
      isPublished,
      duration,
      tags,
      instructor,
      organization,
    });

    await courseRepo.save(course);

    if (modules && modules.length > 0) {
      for (const mod of modules) {
        const newModule = moduleRepo.create({
          title: mod.title,
          description: mod.description,
          order: mod.order,
          course,
        });
        await moduleRepo.save(newModule);

        if (mod.lessons && mod.lessons.length > 0) {
          for (const les of mod.lessons) {
            const newLesson = lessonRepo.create({
              title: les.title,
              content: les.content,
              videoUrl: les.videoUrl,
              duration: les.duration,
              order: les.order,
              module: newModule,
            });
            await lessonRepo.save(newLesson);

            if (les.assessments && les.assessments.length > 0) {
              for (const ass of les.assessments) {
                const newAssessment = assessmentRepo.create({
                  title: ass.title,
                  description: ass.description,
                  type: ass.type,
                  passingScore: ass.passingScore,
                  timeLimit: ass.timeLimit,
                  lesson: newLesson,
                  course,
                });
                await assessmentRepo.save(newAssessment);

                if (ass.questions && ass.questions.length > 0) {
                  for (const q of ass.questions) {
                    const newQuestion = questionRepo.create({
                      question: q.question,
                      type: q.type,
                      options: q.options,
                      correctAnswer: q.correctAnswer,
                      points: q.points,
                      assessment: newAssessment,
                    });
                    await questionRepo.save(newQuestion);
                  }
                }
              }
            }
          }
        }
      }
    }

    res.status(201).json({ message: "Course created successfully", courseId: course.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create course" });
  }
};

export const uploadCourseThumbnail = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  try {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({ message: "Only image files are allowed (jpg, png, webp)" });
      return;
    }

    const result = await uploadToCloud(file.path); 

    // Return the URL, frontend will send this when creating the course
    res.status(200).json({ message: "Thumbnail uploaded", thumbnailUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err });
  }
}


export const getCourseById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const courseRepo = AppDataSource.getRepository(Course);

    try {
      const course = await courseRepo.findOne({
        where: { id },
        relations: ["instructor", "organization", "modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
      });

      if (!course) return res.status(404).json({ message: "Course not found" });

      const sanitize = {
        ...course,
        instructor: excludePassword(course.instructor),
      }

      res.status(200).json({ message: "Course fetched successfully", course: sanitize });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  };

  export const getCoursesByInstructor = async (req: Request, res: Response) => {
  const { instructorId } = req.params;
  const courseRepo = AppDataSource.getRepository(Course);

  try {
    const courses = await courseRepo.find({
      where: { instructor: { id: Number(instructorId) } },
      relations: ["instructor", "organization", "modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
      order: { createdAt: "DESC" },
    });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: "No courses found for this instructor" });
    }

    const sanitizedCourses = courses.map(course => ({
      ...course,
      instructor: excludePassword(course.instructor),
    }));

    res.status(200).json({ message: "Courses fetched successfully", courses: sanitizedCourses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};


  export const updateCourse = async (req: Request, res: Response) => {
  const courseRepo = AppDataSource.getRepository(Course);
  const moduleRepo = AppDataSource.getRepository(Module);
  const lessonRepo = AppDataSource.getRepository(Lesson);
  const assessmentRepo = AppDataSource.getRepository(Assessment);
  const questionRepo = AppDataSource.getRepository(AssessmentQuestion);
  const userRepo = AppDataSource.getRepository(Users);
  const organizationRepo = AppDataSource.getRepository(Organization);


  const { id } = req.params;
  const { title, description, thumbnail, level, price, isPublished, duration, tags, instructorId, organizationId, modules } = req.body;

  try {
    const course = await courseRepo.findOne({
      where: { id: id },
      relations: ["modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
    });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const instructor = await userRepo.findOneBy({ id: Number(instructorId) });
    if (!instructor || !["instructor", "admin"].includes(instructor.role)) {
      return res.status(400).json({ message: "Instructor not found or user is not an instructor" });
    }

    // Optional: organization check
    const organization = organizationId ? await organizationRepo.findOneBy({ id: Number(organizationId) }) : null;
    if (organizationId && !organization) return res.status(400).json({ message: "Organization not found" });

    // Update course fields
    course.title = title ?? course.title;
    course.description = description ?? course.description;
    course.thumbnail = thumbnail ?? course.thumbnail;
    course.level = level ?? course.level;
    course.price = price ?? course.price;
    course.isPublished = isPublished ?? course.isPublished;
    course.duration = duration ?? course.duration;
    course.tags = tags ?? course.tags;
    course.instructor = instructor;
    if (organization) course.organization = organization;

    await courseRepo.save(course);

    // Handle modules/lessons/assessments
    if (modules && modules.length > 0) {
      for (const mod of modules) {
        let newModule;
        if (mod.id) {
          newModule = await moduleRepo.findOneBy({ id: mod.id });
          if (newModule) {
            newModule.title = mod.title ?? newModule.title;
            newModule.description = mod.description ?? newModule.description;
            newModule.order = mod.order ?? newModule.order;
            await moduleRepo.save(newModule);
          }
        } else {
          newModule = moduleRepo.create({ ...mod, course });
          await moduleRepo.save(newModule);
        }

        if (mod.lessons && mod.lessons.length > 0 && newModule) {
          for (const les of mod.lessons) {
            let newLesson;
            if (les.id) {
              newLesson = await lessonRepo.findOneBy({ id: les.id });
              if (newLesson) {
                newLesson.title = les.title ?? newLesson.title;
                newLesson.content = les.content ?? newLesson.content;
                newLesson.videoUrl = les.videoUrl ?? newLesson.videoUrl;
                newLesson.duration = les.duration ?? newLesson.duration;
                newLesson.order = les.order ?? newLesson.order;
                await lessonRepo.save(newLesson);
              }
            } else {
              newLesson = lessonRepo.create({ ...les, module: newModule });
              await lessonRepo.save(newLesson);
            }

            if (les.assessments && les.assessments.length > 0 && newLesson) {
              for (const ass of les.assessments) {
                let newAssessment;
                if (ass.id) {
                  newAssessment = await assessmentRepo.findOneBy({ id: ass.id });
                  if (newAssessment) {
                    newAssessment.title = ass.title ?? newAssessment.title;
                    newAssessment.description = ass.description ?? newAssessment.description;
                    newAssessment.type = ass.type ?? newAssessment.type;
                    newAssessment.passingScore = ass.passingScore ?? newAssessment.passingScore;
                    newAssessment.timeLimit = ass.timeLimit ?? newAssessment.timeLimit;
                    await assessmentRepo.save(newAssessment);
                  }
                } else {
                  newAssessment = assessmentRepo.create({ ...ass, lesson: newLesson, course });
                  await assessmentRepo.save(newAssessment);
                }

                if (ass.questions && ass.questions.length > 0 && newAssessment) {
                  for (const q of ass.questions) {
                    if (q.id) {
                      const newQuestion = await questionRepo.findOneBy({ id: q.id });
                      if (newQuestion) {
                        newQuestion.question = q.question ?? newQuestion.question;
                        newQuestion.type = q.type ?? newQuestion.type;
                        newQuestion.options = q.options ?? newQuestion.options;
                        newQuestion.correctAnswer = q.correctAnswer ?? newQuestion.correctAnswer;
                        newQuestion.points = q.points ?? newQuestion.points;
                        await questionRepo.save(newQuestion);
                      }
                    } else {
                      const newQuestion = questionRepo.create({ ...q, assessment: newAssessment });
                      await questionRepo.save(newQuestion);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({ message: "Course updated successfully" });
  } catch (err) {
    console.error(err);
    console.log(err)
    res.status(500).json({ message: "Failed to update course" });
  }
};


export const deleteCourse = async (req: Request, res: Response) => {
  const courseRepo = AppDataSource.getRepository(Course);
  const { id } = req.params;

  try {
    const course = await courseRepo.findOne({ where: { id } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    await courseRepo.remove(course);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete course" });
  }
};



