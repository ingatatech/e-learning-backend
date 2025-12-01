import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Course } from "../database/models/CourseModel";
import { Module } from "../database/models/ModuleModel";
import { Lesson } from "../database/models/LessonModel";
import { Assessment } from "../database/models/AssessmentModel";
import { AssessmentQuestion } from "../database/models/AssessmentQuestionModel";
import { Users } from "../database/models/UserModel";
import { excludePassword } from "../utils/excludePassword";
import { cloudinary, uploadLessonImageToCloud, uploadLessonVideoToCloud, uploadToCloud } from "../services/cloudinary";
import { Organization } from "../database/models/OrganizationModel";
import { Enrollment } from "../database/models/EnrollmentModel";
import { Category } from "../database/models/CategoryModel";
import { logActivity } from "../middleware/ActivityLog";
import { In } from "typeorm";
import parseCorrectAnswer from "../middleware/parseAnswers";
import { DocumentMedia } from "../database/models/DocumentMediaModel";
import { Document } from "../database/models/DocumentModel";
import { ModuleFinal } from "../database/models/ModuleFinal";
export interface CustomRequest extends Request {
  user?: Users; 
}

export const createCourse = async (req: Request, res: Response) => {
  const courseRepo = AppDataSource.getRepository(Course);
  const moduleRepo = AppDataSource.getRepository(Module);
  const lessonRepo = AppDataSource.getRepository(Lesson);
  const assessmentRepo = AppDataSource.getRepository(Assessment);
  const questionRepo = AppDataSource.getRepository(AssessmentQuestion);
  const userRepo = AppDataSource.getRepository(Users);
  const categoryRepo = AppDataSource.getRepository(Category);
  const moduleFinalRepo = AppDataSource.getRepository(ModuleFinal);

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
    modules,
    categoryName,
    certificateIncluded,
    language,
    about,
    whatYouWillLearn,
    requirements
  } = req.body;

  try {
    const instructor = await userRepo.findOneBy({ id: Number(instructorId) });
    if (!instructor || !["instructor", "admin"].includes(instructor.role)) {
        return res.status(400).json({ message: "Instructor not found or user is not an instructor" });
        }
    const organization = await userRepo.findOneBy({ id: Number(organizationId) });
    if (!organization) return res.status(400).json({ message: "Organization not found" });

    let category = await categoryRepo.findOneBy({ name: categoryName });
    if (!category) {
      const cat = categoryRepo.create({ name: categoryName });
      await categoryRepo.save(cat);
      category = cat;
    };

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
      category,
      certificateIncluded,
      language,
      about: about,
      whatYouWillLearn,
      requirements,
    });

    await courseRepo.save(course);

    let totalLessons = 0;
    let totalProjects = 0;
    let totalExercises = 0;

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
            // Store resources as JSON in the lesson
            const resourcesJson = les.resources && les.resources.length > 0 
              ? JSON.stringify(les.resources) 
              : null;

            const newLesson = lessonRepo.create({
              title: les.title,
              content: les.content,
              videoUrl: les.videoUrl,
              duration: les.duration,
              order: les.order,
              module: newModule,
              isProject: !!les.isProject,
              isExercise: !!les.isExercise,
              resources: resourcesJson,
            });
            totalLessons++;

            if (les.isProject) totalProjects++;
            if (les.isExercise) totalExercises++;

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

        // FINAL ASSESSMENT FOR MODULE
        if (mod.finalAssessment) {
          const finalData = mod.finalAssessment;

          const finalObj = moduleFinalRepo.create({
            type: finalData.type,              // "assessment" | "project"
            title: finalData.title,
            instructions: finalData.instructions || null,
            passingScore: finalData.passingScore || null,
            timeLimit: finalData.timeLimit || null,
            fileRequired: finalData.fileRequired || false,
            module: newModule
          });

          await moduleFinalRepo.save(finalObj);

          // Handle assessment questions ONLY when type is assessment
          if (finalData.type === "assessment") {
          const finalAssessment = assessmentRepo.create({
            title: finalData.title,
            description: finalData.description,
            type: finalData.type,
            passingScore: finalData.passingScore,
            timeLimit: finalData.timeLimit,
            course,
            module: newModule,
          });

          await assessmentRepo.save(finalAssessment);

          // attach assessment to ModuleFinal
          finalObj.assessment = finalAssessment;
          await moduleFinalRepo.save(finalObj);

          // Now save questions correctly
          for (const q of finalData.questions) {
            const newQ = questionRepo.create({
              question: q.question,
              type: q.type,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points,
              assessment: finalAssessment
            });

            await questionRepo.save(newQ);
          }
        }

        }

      }
    }

    course.lessonsCount = totalLessons;
    course.projectsCount = totalProjects;
    course.exercisesCount = totalExercises; 
    await courseRepo.save(course);

     // Save this log in the activity log
    await logActivity({
      userId: instructor.id,
      action: "Created a course",
      targetId: String(course.id),
      targetType: "Course",
      details: `Created a course: ${course.title}`,
    }); 

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

export const uploadLessonImage = async (req: Request, res: Response) => {
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

    const result = await uploadLessonImageToCloud(file.path); 

    // Return the URL
    res.status(200).json({ message: "Image uploaded", imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err });
  }
}

export const uploadLessonVideo = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  try {
    const allowedMimeTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({ message: "Only video files are allowed (mp4, webm, ogg)" });
      return;
    }

    const result = await uploadLessonVideoToCloud(file.path); 

    // Return the URL
    res.status(200).json({ message: "Video uploaded", videoUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err });
  }
}

export const getCourseById = async (req: Request, res: Response) => {
  const { id } = req.params
  const courseRepo = AppDataSource.getRepository(Course)

  try {
    const course = await courseRepo.findOne({
      where: { id },
      relations: [
        "instructor",
        "category",
        "organization",
        "modules",
        "modules.lessons",
        "modules.lessons.assessments",
        "modules.lessons.assessments.questions",
      ],
      order: { modules: { order: "ASC", lessons: { order: "ASC"} } },
    })

    if (!course) return res.status(404).json({ message: "Course not found" })

    // walk through the structure and normalize only the questions
    course.modules?.forEach((mod) => {
      mod.lessons?.forEach((lesson) => {
        lesson.assessments?.forEach((assessment) => {
           assessment.questions?.forEach((q) => {
            if (q.type === "multiple_choice") {
              // multiple answers possible → array
              q.correctAnswer = parseCorrectAnswer(q.correctAnswer as any) as string[];
            } else {
              // just keep it as string
              q.correctAnswer = q.correctAnswer as string;
            }
          });
        })
      })
    })

    const sanitize = {
      ...course,
      instructor: excludePassword(course.instructor),
    }

    res.status(200).json({ message: "Course fetched successfully", course: sanitize })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch course" })
  }
}

  export const getCoursesByInstructor = async (req: Request, res: Response) => {
  const { instructorId } = req.params;
  const courseRepo = AppDataSource.getRepository(Course);

  try {
    const courses = await courseRepo.find({
      where: { instructor: { id: Number(instructorId) } },
      relations: ["instructor", "category", "organization", "modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
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

export const getLiveCoursesByInstructor = async (req: Request, res: Response) => {
  const { instructorId } = req.params;
  const courseRepo = AppDataSource.getRepository(Course);

  try {
    const courses = await courseRepo.find({
      where: { instructor: { id: Number(instructorId) }, isPublished: true },
      relations: ["instructor", "category", "organization", "modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
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


export const publishCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const courseRepo = AppDataSource.getRepository(Course);

  try {
    const course = await courseRepo.findOne({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.isPublished = true;
    await courseRepo.save(course);

    res.status(200).json({ message: "Course published successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to publish course" });
  }
}


  export const getCoursesByOrganization = async (req: Request, res: Response) => {
    const courseRepo = AppDataSource.getRepository(Course);
    const organizationRepo = AppDataSource.getRepository(Organization);
    const { orgId } = req.params;
    const orgIdNum = Number(orgId);
    if (isNaN(orgIdNum)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    try {
      const organization = await organizationRepo.findOne({
        where: { id: orgIdNum },
      })
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const courses = await courseRepo.find({
        where: { organization: { id: Number(orgId) } },
        relations: ["instructor", "category", "organization", "modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
        order: { createdAt: "DESC" },
      });

      if (!courses || courses.length === 0) {
        return res.status(404).json({ message: "No courses found in this organization" });
      }

      const sanitizedCourses = courses.map(course => ({
        ...course,
        instructor: excludePassword(course.instructor),
      }));

      res.status(200).json({ message: "Courses fetched successfully", courses: sanitizedCourses });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to fetch courses" });
    }
  }

  export const getDraftCoursesByOrganization = async (req: Request, res: Response) => {
    const courseRepo = AppDataSource.getRepository(Course);
    const organizationRepo = AppDataSource.getRepository(Organization);
    const { orgId } = req.params;
    const orgIdNum = Number(orgId);
    if (isNaN(orgIdNum)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    try {
      const organization = await organizationRepo.findOne({
        where: { id: orgIdNum },
      })
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const courses = await courseRepo.find({
        where: { organization: { id: Number(orgId) }, isPublished: false },
        relations: ["instructor", "category", "organization", "modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
        order: { createdAt: "DESC" },
      });

      if (!courses || courses.length === 0) {
        return res.status(404).json({ message: "No courses found in this organization" });
      }

      const sanitizedCourses = courses.map(course => ({
        ...course,
        instructor: excludePassword(course.instructor),
      }));

      res.status(200).json({ message: "Courses fetched successfully", courses: sanitizedCourses });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to fetch courses" });
    }
  }


export const updateCourse = async (req: Request, res: Response) => {
  const courseRepo = AppDataSource.getRepository(Course);
  const moduleRepo = AppDataSource.getRepository(Module);
  const lessonRepo = AppDataSource.getRepository(Lesson);
  const assessmentRepo = AppDataSource.getRepository(Assessment);
  const questionRepo = AppDataSource.getRepository(AssessmentQuestion);
  const userRepo = AppDataSource.getRepository(Users);
  const organizationRepo = AppDataSource.getRepository(Organization);
  const categoryRepo = AppDataSource.getRepository(Category);

  const { id } = req.params;
  const { title, description, thumbnail, level, price, isPublished, duration, tags, instructorId, organizationId, categoryName, modules } = req.body;

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

    let category = await categoryRepo.findOneBy({ name: categoryName });
    if (categoryName && !category) {
      category = categoryRepo.create({ name: categoryName });
      await categoryRepo.save(category);
    };

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
    if (category) course.category = category;

    await courseRepo.save(course);

    // Handle modules/lessons/assessments with deletion logic
    if (modules && Array.isArray(modules)) {
      // Get IDs from request for comparison
      const requestedModuleIds = modules.map(mod => mod.id).filter(Boolean);
      const requestedLessonIds: string[] = [];
      const requestedAssessmentIds: string[] = [];
      const requestedQuestionIds: string[] = [];

      // Process modules
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

        // Process lessons
        if (mod.lessons && Array.isArray(mod.lessons) && newModule) {
          const requestedLessonIdsForModule = mod.lessons.map((les: { id: any; }) => les.id).filter(Boolean);
          requestedLessonIds.push(...requestedLessonIdsForModule);

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

            // Process assessments
            if (les.assessments && Array.isArray(les.assessments) && newLesson) {
              const requestedAssessmentIdsForLesson = les.assessments.map((ass: { id: any; }) => ass.id).filter(Boolean);
              requestedAssessmentIds.push(...requestedAssessmentIdsForLesson);

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

                // Process questions
                if (ass.questions && Array.isArray(ass.questions) && newAssessment) {
                  const requestedQuestionIdsForAssessment = ass.questions.map((q: { id: any; }) => q.id).filter(Boolean);
                  requestedQuestionIds.push(...requestedQuestionIdsForAssessment);

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

      // Delete entities that are not in the request
      // Delete questions not in request
      if (course.modules) {
        for (const module of course.modules) {
          if (module.lessons) {
            for (const lesson of module.lessons) {
              if (lesson.assessments) {
                for (const assessment of lesson.assessments) {
                  if (assessment.questions) {
                    const questionsToDelete = assessment.questions.filter(
                      question => !requestedQuestionIds.includes(question.id)
                    );
                    for (const question of questionsToDelete) {
                      await questionRepo.delete(question.id);
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Delete assessments not in request
      if (course.modules) {
        for (const module of course.modules) {
          if (module.lessons) {
            for (const lesson of module.lessons) {
              if (lesson.assessments) {
                const assessmentsToDelete = lesson.assessments.filter(
                  assessment => !requestedAssessmentIds.includes(assessment.id)
                );
                for (const assessment of assessmentsToDelete) {
                  await assessmentRepo.delete(assessment.id);
                }
              }
            }
          }
        }
      }

      // Delete lessons not in request
      if (course.modules) {
        for (const module of course.modules) {
          if (module.lessons) {
            const lessonsToDelete = module.lessons.filter(
              lesson => !requestedLessonIds.includes(lesson.id)
            );
            for (const lesson of lessonsToDelete) {
              await lessonRepo.delete(lesson.id);
            }
          }
        }
      }

      // Delete modules not in request
      const modulesToDelete = course.modules.filter(
        module => !requestedModuleIds.includes(module.id)
      );
      for (const module of modulesToDelete) {
        await moduleRepo.delete(module.id);
      }
    } else {
      // If no modules in request, delete all existing modules and their children
      if (course.modules && course.modules.length > 0) {
        for (const module of course.modules) {
          await moduleRepo.delete(module.id);
        }
      }
    }

    // Save this log in the activity log
    await logActivity({
      userId: instructorId,
      action: "Updated a course",
      targetId: String(course.id),
      targetType: "Course",
      details: `Updated a course: ${course.title}`,
    });

    // Reload the course to get the updated structure
    const updatedCourse = await courseRepo.findOne({
      where: { id: id },
      relations: ["modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
    });

    const sanitized = {
      ...updatedCourse,
      instructor: excludePassword(updatedCourse!.instructor),
    };

    res.status(200).json({ message: "Course updated successfully", course: sanitized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update course" });
  }
};


export const deleteCourse = async (req: CustomRequest, res: Response) => {
  const courseRepo = AppDataSource.getRepository(Course);
  const { id } = req.params;

  try {
    const course = await courseRepo.findOne({ where: { id } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    await courseRepo.remove(course);
    
     // Save this log in the activity log
    await logActivity({
      userId: req.user!.id,
      action: "Deleted a course",
      targetId: String(course.id),
      targetType: "Course",
      details: `Deleted a course: ${course.title}`,
    }); 
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete course" });
  }
};


export const getCoursesWithEnrollmentStatus = async (req: Request, res: Response) => {
  const {userId } = req.body;
  const courseRepo = AppDataSource.getRepository(Course);
  const enrollmentRepo = AppDataSource.getRepository(Enrollment);

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const courses = await courseRepo.find({
      relations: ["instructor", "organization", "modules", "category"],
      order: { createdAt: "DESC" },
    });

    // fetch all enrollments for this user in one go
    const userEnrollments = await enrollmentRepo.find({
      where: { user: { id: userId } },
      relations: ["course"],
    });
    const enrolledCourseIds = new Set(userEnrollments.map(e => e.course.id));

    const sanitizedCourses = courses.map(course => ({
      ...course,
      instructor: excludePassword(course.instructor),
      isEnrolled: enrolledCourseIds.has(course.id),
    }));

    res.status(200).json({ message: "Courses fetched successfully", courses: sanitizedCourses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};


export const getStudentsByCourse = async (req: Request, res: Response) => { 
  try { 
    const { courseId } = req.params; 
    if (!courseId) return res.status(400).json({ error: "Missing courseId" }); 
    const enrollmentRepo = AppDataSource.getRepository(Enrollment); 
    const enrollments = await enrollmentRepo.find({ where: { course: { id: courseId } }, relations: ["user"], }); 
    const students = enrollments.map((enroll) => enroll.user); // Remove duplicates (in case the same user appears twice) 
    const uniqueStudents = Array.from(new Map(students.map(s => [s.id, s])).values()); 
    const sanitize = uniqueStudents.map((student) => ({ 
      id: student.id, 
      firstName: student.firstName, 
      lastName: student.lastName, 
      email: student.email, 
      role: student.role, 
      createdAt: student.createdAt, 
      updatedAt: student.updatedAt, 
      profilePicture: student.profilePicUrl, 
      disabled: student.disabled 
    })); 
    return res.json({ success: true, students: sanitize });
  } catch (err) { 
    console.error("Failed to fetch students:", err); 
    return res.status(500).json({ error: "Failed to fetch students" }); 
  } };

export const getStudentsByInstructor = async (req: Request, res: Response) => {
  try {
    const { instructorId } = req.params;
    if (!instructorId) {
      return res.status(400).json({ error: "Missing instructorId" });
    }

    const courseRepo = AppDataSource.getRepository(Course);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);

    // Get instructor's courses
    const courses = await courseRepo.find({
      where: { instructor: { id: Number(instructorId) } },
      select: ["id", "title"], // we just need course IDs
    });

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found for this instructor" });
    }

    const courseIds = courses.map(c => c.id);

    // Get all enrollments for these courses
    const enrollments = await enrollmentRepo.find({
      where: { course: { id: In(courseIds) } },
      relations: ["user", "course"],
    });

     // Map students to courses
    const studentMap: Record<number, { student: Users; courses: Course[] }> = {};

    for (const enroll of enrollments) {
      const user = enroll.user;
      if (user && !studentMap[user.id]) {
        studentMap[user.id] = { student: user, courses: [] };
        studentMap[user.id].courses.push({
          id: enroll.course.id,
          title: enroll.course.title,
          level: enroll.course.level
        } as Course);
      }

    }

    const studentsWithCourses = Object.values(studentMap).map(entry => ({
      student: excludePassword(entry.student),
      courses: entry.courses,
    }));

    return res.json({
      success: true,
      instructorId,
      studentCount: studentsWithCourses.length,
      students: studentsWithCourses,
    });
  } catch (err) {
    console.error("Failed to fetch students by instructor:", err);
    return res.status(500).json({ error: "Failed to fetch students" });
  }
};


export const getInstructorAssessments = async (req: Request, res: Response) => {
  const { instructorId } = req.params;

  try {
    if (!instructorId) {
      return res.status(400).json({ message: "Missing instructorId" });
    }

    const courseRepo = AppDataSource.getRepository(Course);

    // Grab instructor’s courses with nested modules/lessons/assessments
    const courses = await courseRepo.find({
      where: { instructor: { id: Number(instructorId) } },
      relations: [
        "modules",
        "modules.lessons",
        "modules.lessons.assessments",
        "modules.lessons.assessments.questions"
      ],
    });

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found for this instructor" });
    }

    // Flatten all assessments across all lessons/modules
    const assessments = courses.flatMap(course =>
      course.modules.flatMap(module =>
        module.lessons.flatMap(lesson =>
          lesson.assessments.map(assessment => ({
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            courseId: course.id,
            courseTitle: course.title,
            questions: assessment.questions
          }))
        )
      )
    );

    return res.status(200).json({
      success: true,
      instructorId,
      totalAssessments: assessments.length,
      assessments,
    });
  } catch (err) {
    console.error("Failed to fetch instructor assessments:", err);
    return res.status(500).json({ message: "Failed to fetch assessments" });
  }
};


export const getPopularCourses = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20

    const courseRepo = AppDataSource.getRepository(Course)

    const popularCourses = await courseRepo
      .createQueryBuilder("course")
      .leftJoinAndSelect("course.reviews", "review")
      .loadRelationCountAndMap("course.enrollmentCount", "course.enrollments") 
      .addSelect("AVG(review.rating)", "averageRating")
      .groupBy("course.id")
      .orderBy("((AVG(review.rating) * 0.7) + (COUNT(review.id) * 0.3) + (course.enrollmentCount * 0.5))", "DESC")
      .limit(limit)
      .getRawMany()

    return res.json({ popularCourses })
  } catch (error) {
    console.error("Error fetching popular courses:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}



