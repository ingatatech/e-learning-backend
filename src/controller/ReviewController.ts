import { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { Review } from "../database/models/ReviewModel"
import { Users } from "../database/models/UserModel"
import { Course } from "../database/models/CourseModel"

/**
 * Create or update a review
 */
export const createOrUpdateReview = async (req: Request, res: Response) => {
  try {
    const { userId, courseId, rating, comment } = req.body

    if (!userId || !courseId || !rating) {
      return res.status(400).json({ message: "userId, courseId, and rating are required" })
    }

    const userRepo = AppDataSource.getRepository(Users)
    const courseRepo = AppDataSource.getRepository(Course)
    const reviewRepo = AppDataSource.getRepository(Review)

    const user = await userRepo.findOne({ where: { id: Number(userId) } })
    if (!user) return res.status(404).json({ message: "User not found" })

    const course = await courseRepo.findOne({ where: { id: courseId } })
    if (!course) return res.status(404).json({ message: "Course not found" })

    // Check if review already exists
    let review = await reviewRepo.findOne({ where: { user: { id: user.id }, course: { id: course.id } } })

    if (review) {
      // Update existing review
      review.rating = rating
      review.comment = comment || review.comment
      await reviewRepo.save(review)
      return res.json({ message: "Review updated successfully", review })
    }

    // Create new review
    review = reviewRepo.create({ user, course, rating, comment })
    await reviewRepo.save(review)

    const sanitize = {
      id: review.id,
      rating: review.rating,
      user: { userId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      course: { courseId: course.id, title: course.title },
      comment: review.comment,
      createdAt: review.createdAt,
    }

    return res.status(201).json({ message: "Review created successfully", review: sanitize })
  } catch (error) {
    console.error("Error creating/updating review:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

/**
 * Get all reviews for a course
 */
export const getCourseReviews = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params

    if (!courseId) return res.status(400).json({ message: "courseId is required" })

    const reviewRepo = AppDataSource.getRepository(Review)

    const reviews = await reviewRepo.find({
      where: { course: { id: courseId } },
      relations: ["user", "course"],
      order: { createdAt: "DESC" },
    })

    const sanitize = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      user: { userId: review.user.id, email: review.user.email, firstName: review.user.firstName, lastName: review.user.lastName },
      course: { courseId: review.course.id, title: review.course.title },
      comment: review.comment,
      createdAt: review.createdAt,
    }))

    return res.json({ reviews: sanitize })
  } catch (error) {
    console.error("Error fetching course reviews:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// Get all reviews for a user 
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    if (!userId) return res.status(400).json({ message: "userId is required" })

    const reviewRepo = AppDataSource.getRepository(Review)

    const reviews = await reviewRepo.find({
      where: { user: { id: Number(userId) } },
      relations: ["course", "user"],
      order: { createdAt: "DESC" },
    })

    const sanitize = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      user: { userId: review.user.id, email: review.user.email, firstName: review.user.firstName, lastName: review.user.lastName },
      course: { courseId: review.course.id, title: review.course.title },
      comment: review.comment,
      createdAt: review.createdAt,
    }))

    return res.json({ reviews: sanitize })
  } catch (error) {
    console.error("Error fetching course reviews:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
/**
 * Delete a review
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params
    if (!reviewId) return res.status(400).json({ message: "reviewId is required" })

    const reviewRepo = AppDataSource.getRepository(Review)
    const review = await reviewRepo.findOne({ where: { id: reviewId } })

    if (!review) return res.status(404).json({ message: "Review not found" })

    await reviewRepo.remove(review)
    return res.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error deleting review:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

/**
 * Get a review by a user for a specific course
 */
export const getUserReviewForCourse = async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.params

    if (!userId || !courseId) return res.status(400).json({ message: "userId and courseId are required" })

    const reviewRepo = AppDataSource.getRepository(Review)
    const review = await reviewRepo.findOne({
      where: { user: { id: Number(userId) }, course: { id: courseId } },
      relations: ["user", "course"],
    })

    if (!review) return res.status(404).json({ message: "Review not found" })

    return res.json({ review })
  } catch (error) {
    console.error("Error fetching user review:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
