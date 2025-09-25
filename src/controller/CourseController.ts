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
import { Enrollment } from "../database/models/EnrollmentModel";
import { Category } from "../database/models/CategoryModel";
import { logActivity } from "../middleware/ActivityLog";
import { In } from "typeorm";
import { profile } from "console";

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
            const newLesson = lessonRepo.create({
              title: les.title,
              content: les.content,
              videoUrl: les.videoUrl,
              duration: les.duration,
              order: les.order,
              module: newModule,
              isProject: !!les.isProject,
              isExercise: !!les.isExercise,
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


export const getCourseById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const courseRepo = AppDataSource.getRepository(Course);

    try {
      const course = await courseRepo.findOne({
        where: { id },
        relations: ["instructor", "category", "organization", "modules", "modules.lessons", "modules.lessons.assessments", "modules.lessons.assessments.questions"],
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

     // Save this log in the activity log
    await logActivity({
      userId: instructorId,
      action: "Updated a course",
      targetId: String(course.id),
      targetType: "Course",
      details: `Updated a course: ${course.title}`,
    }); 

    res.status(200).json({ message: "Course updated successfully" });
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
      select: ["id"], // we just need course IDs
    });

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found for this instructor" });
    }

    const courseIds = courses.map(c => c.id);

    // Get all enrollments for these courses
    const enrollments = await enrollmentRepo.find({
      where: { course: { id: In(courseIds) } },
      relations: ["user"],
    });

    const students = enrollments.map(enroll => enroll.user);

    // Deduplicate by user id
    const uniqueStudents = Array.from(new Map(students.map(s => [s.id, s])).values());

    return res.json({
      success: true,
      instructorId,
      studentCount: uniqueStudents.length,
      students: uniqueStudents,
    });
  } catch (err) {
    console.error("Failed to fetch students by instructor:", err);
    return res.status(500).json({ error: "Failed to fetch students" });
  }
};




