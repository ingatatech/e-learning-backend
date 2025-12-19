import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Course } from "../database/models/CourseModel";
import { Module } from "../database/models/ModuleModel";
import { Lesson } from "../database/models/LessonModel";
import { Assessment } from "../database/models/AssessmentModel";
import { AssessmentQuestion } from "../database/models/AssessmentQuestionModel";
import { Users } from "../database/models/UserModel";
import { excludePassword } from "../utils/excludePassword";
import { uploadLessonImageToCloud, uploadLessonVideoToCloud, uploadToCloud } from "../services/cloudinary";
import { Organization } from "../database/models/OrganizationModel";
import { Enrollment } from "../database/models/EnrollmentModel";
import { Category } from "../database/models/CategoryModel";
import { logActivity } from "../middleware/ActivityLog";
import { In } from "typeorm";
import { parseCorrectAnswer, parseCorrectAnswer0 } from "../middleware/parseAnswers";
import { ModuleFinal } from "../database/models/ModuleFinal";
import { io } from "..";
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
                      pairs: q.pairs,
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
        "modules.finalAssessment",
        "modules.finalAssessment.assessment",
        "modules.finalAssessment.assessment.questions",
        "reviews"
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
            } else if(q.type === "matching") {
              q.correctAnswer = parseCorrectAnswer0(q.correctAnswer as any)
            }else {
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
  const userRepo = AppDataSource.getRepository(Users);
  const organizationRepo = AppDataSource.getRepository(Organization);
  const categoryRepo = AppDataSource.getRepository(Category);
  
  const { id } = req.params;
  const { 
    title, description, thumbnail, level, price, isPublished, duration, tags, 
    instructorId, organizationId, categoryName, certificateIncluded,
    language, about, whatYouWillLearn, requirements 
  } = req.body;

  try {
    const course = await courseRepo.findOne({
      where: { id: id },
      relations: ["instructor", "organization", "category"]
    });
    
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (instructorId) {
      const newInstructor = await userRepo.findOneBy({ id: Number(instructorId) });
      if (!newInstructor || !["instructor", "admin"].includes(newInstructor.role)) {
        return res.status(400).json({ message: "Instructor not found or user is not an instructor" });
      }
      course.instructor = newInstructor;
    }

    // Update organization if provided
    if (organizationId) {
      const newOrganization = await organizationRepo.findOneBy({ id: Number(organizationId) });
      if (!newOrganization) return res.status(400).json({ message: "Organization not found" });
      course.organization = newOrganization;
    }

    // Update category if provided
    if (categoryName) {
      let newCategory = await categoryRepo.findOneBy({ name: categoryName });
      if (!newCategory) {
        newCategory = categoryRepo.create({ name: categoryName });
        await categoryRepo.save(newCategory);
      }
      course.category = newCategory;
    }

    // Update course fields
    course.title = title ?? course.title;
    course.description = description ?? course.description;
    course.thumbnail = thumbnail ?? course.thumbnail;
    course.level = level ?? course.level;
    course.price = price ?? course.price;
    course.isPublished = isPublished ?? course.isPublished;
    course.duration = duration ?? course.duration;
    course.tags = tags ?? course.tags;
    course.certificateIncluded = certificateIncluded ?? course.certificateIncluded;
    course.language = language ?? course.language;
    course.about = about ?? course.about;
    course.whatYouWillLearn = whatYouWillLearn ?? course.whatYouWillLearn;
    course.requirements = requirements ?? course.requirements;

    await courseRepo.save(course);

    // Log activity
    if (instructorId) {
      await logActivity({
        userId: instructorId,
        action: "Updated a course's basic details",
        targetId: String(course.id),
        targetType: "Course",
        details: `Updated a course: ${course.title}`,
      });
    }

    // Fetch the updated course with all relations for response
    const updatedCourse = await courseRepo.findOne({
      where: { id: id },
      relations: [
        "instructor",
        "organization", 
        "category",
        "modules", 
        "modules.lessons", 
        "modules.lessons.assessments", 
        "modules.lessons.assessments.questions",
        "modules.finalAssessment",
        "modules.finalAssessment.assessment",
        "modules.finalAssessment.assessment.questions"
      ],
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


export const updateCourseModules = async (req: Request, res: Response) => {
  const courseRepo = AppDataSource.getRepository(Course);
  const moduleRepo = AppDataSource.getRepository(Module);
  const lessonRepo = AppDataSource.getRepository(Lesson);
  const assessmentRepo = AppDataSource.getRepository(Assessment);
  const questionRepo = AppDataSource.getRepository(AssessmentQuestion);
  const moduleFinalRepo = AppDataSource.getRepository(ModuleFinal);
  
  const { id } = req.params;
  const { modules, instructorId } = req.body;

  try {
    // Find the course
    const course = await courseRepo.findOne({
      where: { id: id },
      relations: [
        "modules",
        "modules.lessons",
        "modules.lessons.assessments",
        "modules.lessons.assessments.questions",
        "modules.finalAssessment",
        "modules.finalAssessment.assessment",
        "modules.finalAssessment.assessment.questions"
      ]
    });
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Handle modules
    if (modules && Array.isArray(modules)) {
      for (const mod of modules) {
        let moduleEntity: Module;
        
        // Check if module already exists
        if (mod.id) {
          const existingModule = await moduleRepo.findOne({
            where: { id: mod.id },
            relations: ["course"]
          });
          
          if (existingModule) {
            // Verify this module belongs to the current course
            if (existingModule.course.id !== course.id) {
              return res.status(400).json({ 
                message: `Module ${mod.id} does not belong to course ${course.id}` 
              });
            }
            
            // Update existing module
            existingModule.title = mod.title ?? existingModule.title;
            existingModule.description = mod.description ?? existingModule.description;
            existingModule.order = mod.order ?? existingModule.order;
            await moduleRepo.save(existingModule);
            moduleEntity = existingModule;
          } else {
            // Module ID provided but not found - skip
            continue;
          }
        } else {
          // Create new module with proper course relation
          const newModule = moduleRepo.create({
            title: mod.title || '',
            description: mod.description || '',
            order: mod.order || 0,
            course: course, // Direct reference to the course entity
          });
          
          await moduleRepo.save(newModule);
          moduleEntity = newModule;
        }

        // ========== HANDLE MODULE FINAL ASSESSMENT ==========
        if (mod.finalAssessment && moduleEntity) {
          // Check if module already has a final assessment
          let moduleFinal = await moduleFinalRepo.findOne({
            where: { module: { id: moduleEntity.id } },
            relations: ['assessment', 'assessment.questions']
          });
          
          if (moduleFinal) {
            // Update existing module final
            moduleFinal.type = mod.finalAssessment.type ?? moduleFinal.type;
            moduleFinal.title = mod.finalAssessment.title ?? moduleFinal.title;
            moduleFinal.instructions = mod.finalAssessment.instructions ?? moduleFinal.instructions;
            moduleFinal.passingScore = mod.finalAssessment.passingScore ?? moduleFinal.passingScore;
            moduleFinal.timeLimit = mod.finalAssessment.timeLimit ?? moduleFinal.timeLimit;
            moduleFinal.fileRequired = mod.finalAssessment.fileRequired ?? moduleFinal.fileRequired;
            
            await moduleFinalRepo.save(moduleFinal);
            
            // Handle assessment type specifically
            if ((mod.finalAssessment.type === "assessment" || mod.finalAssessment.type === "final-assessment") && moduleFinal.assessment) {
              const assessment = moduleFinal.assessment;
              assessment.title = mod.finalAssessment.title ?? assessment.title;
              assessment.description = mod.finalAssessment.description ?? assessment.description;
              assessment.type = mod.finalAssessment.type ?? assessment.type;
              assessment.passingScore = mod.finalAssessment.passingScore ?? assessment.passingScore;
              assessment.timeLimit = mod.finalAssessment.timeLimit ?? assessment.timeLimit;
              
              await assessmentRepo.save(assessment);
              
              // Handle questions
              if (mod.finalAssessment.questions && Array.isArray(mod.finalAssessment.questions)) {
                for (const q of mod.finalAssessment.questions) {
                  if (q.id) {
                    const existingQuestion = await questionRepo.findOneBy({ id: q.id });
                    if (existingQuestion) {
                      existingQuestion.question = q.question ?? existingQuestion.question;
                      existingQuestion.type = q.type ?? existingQuestion.type;
                      existingQuestion.options = q.options ?? existingQuestion.options;
                      existingQuestion.pairs = q.pairs ?? existingQuestion.pairs;
                      existingQuestion.correctAnswer = q.correctAnswer ?? existingQuestion.correctAnswer;
                      existingQuestion.points = q.points ?? existingQuestion.points;
                      await questionRepo.save(existingQuestion);
                    }
                  } else {
                    const newQuestion = questionRepo.create({ 
                      ...q, 
                      assessment: assessment 
                    });
                    await questionRepo.save(newQuestion);
                  }
                }
              }
            } else if (mod.finalAssessment.type === "assessment" && !moduleFinal.assessment) {
              // Create new assessment for existing module final
              const newAssessment = assessmentRepo.create({
                title: mod.finalAssessment.title,
                description: mod.finalAssessment.description,
                type: mod.finalAssessment.type,
                passingScore: mod.finalAssessment.passingScore,
                timeLimit: mod.finalAssessment.timeLimit,
                course,
                module: moduleEntity,
              });
              
              await assessmentRepo.save(newAssessment);
              
              moduleFinal.assessment = newAssessment;
              await moduleFinalRepo.save(moduleFinal);
              
              // Create questions
              if (mod.finalAssessment.questions && Array.isArray(mod.finalAssessment.questions)) {
                for (const q of mod.finalAssessment.questions) {
                  const newQuestion = questionRepo.create({
                    question: q.question,
                    type: q.type,
                    options: q.options,
                    pairs: q.pairs,
                    correctAnswer: q.correctAnswer,
                    points: q.points,
                    assessment: newAssessment
                  });
                  await questionRepo.save(newQuestion);
                }
              }
            }
          } else {
            // Create new module final
            const finalObj = moduleFinalRepo.create({
              type: mod.finalAssessment.type,
              title: mod.finalAssessment.title,
              instructions: mod.finalAssessment.instructions || null,
              passingScore: mod.finalAssessment.passingScore || null,
              timeLimit: mod.finalAssessment.timeLimit || null,
              fileRequired: mod.finalAssessment.fileRequired || false,
              module: moduleEntity
            });
            
            await moduleFinalRepo.save(finalObj);
            
            // Handle assessment questions if type is assessment
            if (mod.finalAssessment.type === "assessment") {
              const finalAssessment = assessmentRepo.create({
                title: mod.finalAssessment.title,
                description: mod.finalAssessment.description,
                type: mod.finalAssessment.type,
                passingScore: mod.finalAssessment.passingScore,
                timeLimit: mod.finalAssessment.timeLimit,
                course,
                module: moduleEntity,
              });
              
              await assessmentRepo.save(finalAssessment);
              
              finalObj.assessment = finalAssessment;
              await moduleFinalRepo.save(finalObj);
              
              // Create questions
              if (mod.finalAssessment.questions && Array.isArray(mod.finalAssessment.questions)) {
                for (const q of mod.finalAssessment.questions) {
                  const newQ = questionRepo.create({
                    question: q.question,
                    type: q.type,
                    options: q.options,
                    pairs: q.pairs,
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

        // ========== HANDLE LESSONS ==========
        if (mod.lessons && Array.isArray(mod.lessons) && moduleEntity) {
          for (const les of mod.lessons) {
            let lessonEntity;
            
            if (les.id) {
              // Update existing lesson
              lessonEntity = await lessonRepo.findOne({
                where: { id: les.id },
                relations: ["module"]
              });
              
              if (lessonEntity) {
                // Verify lesson belongs to this module
                if (lessonEntity.module.id !== moduleEntity.id) {
                  return res.status(400).json({ 
                    message: `Lesson ${les.id} does not belong to module ${moduleEntity.id}` 
                  });
                }
                
                lessonEntity.title = les.title ?? lessonEntity.title;
                lessonEntity.content = les.content ?? lessonEntity.content;
                lessonEntity.videoUrl = les.videoUrl ?? lessonEntity.videoUrl;
                lessonEntity.duration = les.duration ?? lessonEntity.duration;
                lessonEntity.order = les.order ?? lessonEntity.order;
                lessonEntity.isProject = !!les.isProject;
                lessonEntity.isExercise = !!les.isExercise;
                
                const resourcesJson = les.resources && les.resources.length > 0
                  ? JSON.stringify(les.resources) 
                  : typeof les.resources === 'object' ? les.resources : null;
                lessonEntity.resources = resourcesJson;
                
                await lessonRepo.save(lessonEntity);
              }
            } else {
              // Create new lesson
              const resourcesJson = les.resources && les.resources.length > 0 
                ? JSON.stringify(les.resources) 
                : null;
                
              lessonEntity = lessonRepo.create({ 
                title: les.title || '',
                content: les.content || '',
                videoUrl: les.videoUrl || '',
                duration: les.duration || 0,
                order: les.order || 0,
                isProject: !!les.isProject,
                isExercise: !!les.isExercise,
                resources: resourcesJson,
                module: moduleEntity,
              });
              await lessonRepo.save(lessonEntity);
            }

            // ========== HANDLE LESSON ASSESSMENTS ==========
            if (les.assessments && Array.isArray(les.assessments) && lessonEntity) {
              for (const ass of les.assessments) {
                let assessmentEntity;
                
                if (ass.id) {
                  assessmentEntity = await assessmentRepo.findOneBy({ id: ass.id });
                  if (assessmentEntity) {
                    assessmentEntity.title = ass.title ?? assessmentEntity.title;
                    assessmentEntity.description = ass.description ?? assessmentEntity.description;
                    assessmentEntity.type = ass.type ?? assessmentEntity.type;
                    assessmentEntity.passingScore = ass.passingScore ?? assessmentEntity.passingScore;
                    assessmentEntity.timeLimit = ass.timeLimit ?? assessmentEntity.timeLimit;
                    await assessmentRepo.save(assessmentEntity);
                  }
                } else {
                  assessmentEntity = assessmentRepo.create({ 
                    title: ass.title,
                    description: ass.description,
                    type: ass.type,
                    passingScore: ass.passingScore,
                    timeLimit: ass.timeLimit,
                    lesson: lessonEntity, 
                    course: course 
                  });
                  await assessmentRepo.save(assessmentEntity);
                }

                // ========== HANDLE ASSESSMENT QUESTIONS ==========
                if (ass.questions && Array.isArray(ass.questions) && assessmentEntity) {
                  for (const q of ass.questions) {
                    if (q.id) {
                      const existingQuestion = await questionRepo.findOneBy({ id: q.id });
                      if (existingQuestion) {
                        existingQuestion.question = q.question ?? existingQuestion.question;
                        existingQuestion.type = q.type ?? existingQuestion.type;
                        existingQuestion.options = q.options ?? existingQuestion.options;
                        existingQuestion.pairs = q.pairs ?? existingQuestion.pairs;
                        existingQuestion.correctAnswer = q.correctAnswer ?? existingQuestion.correctAnswer;
                        existingQuestion.points = q.points ?? existingQuestion.points;
                        await questionRepo.save(existingQuestion);
                      }
                    } else {
                      const newQuestion = questionRepo.create({ 
                        ...q, 
                        assessment: assessmentEntity 
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
    }

    // Update course lesson counts
    const updatedCourse = await courseRepo.findOne({
      where: { id: id },
      relations: [
        "modules",
        "modules.lessons",
        "modules.lessons.assessments",
        "modules.lessons.assessments.questions",
        "modules.finalAssessment",
        "modules.finalAssessment.assessment",
        "modules.finalAssessment.assessment.questions"
      ]
    });

    if (updatedCourse) {
      let totalLessons = 0;
      let totalProjects = 0;
      let totalExercises = 0;

      // Calculate lesson counts
      updatedCourse.modules?.forEach(module => {
        module.lessons?.forEach(lesson => {
          totalLessons++;
          if (lesson.isProject) totalProjects++;
          if (lesson.isExercise) totalExercises++;
        });
      });

      // Update course with counts
      updatedCourse.lessonsCount = totalLessons;
      updatedCourse.projectsCount = totalProjects;
      updatedCourse.exercisesCount = totalExercises;
      await courseRepo.save(updatedCourse);
    }

    res.status(200).json({ 
      message: "Course modules updated successfully", 
      course: updatedCourse 
    });

    if (instructorId) {
      await logActivity({
        userId: instructorId,
        action: "Updated course modules",
        targetId: String(course.id),
        targetType: "Course",
        details: `Updated a course: ${course.title}`,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update course modules" });
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
      targetId: String(id),
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



export const deleteModule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const moduleRepo = AppDataSource.getRepository(Module);

  try {
    const module = await moduleRepo.findOne({
      where: { id },
      relations: ["lessons", "finalAssessment", "finalAssessment.assessment", "finalAssessment.assessment.questions"]
    });

    if (!module) return res.status(404).json({ message: "Module not found" });

    await moduleRepo.remove(module);

    res.status(200).json({ message: "Module deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete module" });
  }
};


export const deleteLesson = async (req: Request, res: Response) => {
  const { id } = req.params;
  const lessonRepo = AppDataSource.getRepository(Lesson);

  try {
    const lesson = await lessonRepo.findOne({
      where: { id },
      relations: ["assessments", "assessments.questions"]
    });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    await lessonRepo.remove(lesson); // cascades assessments & questions

    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete lesson" });
  }
};


export const deleteAssessment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const assessmentRepo = AppDataSource.getRepository(Assessment);

  try {
    const assessment = await assessmentRepo.findOne({
      where: { id },
      relations: ["questions"]
    });

    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    await assessmentRepo.remove(assessment); // cascades questions

    res.status(200).json({ message: "Assessment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete assessment" });
  }
};
