import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Category } from "../database/models/CategoryModel";

// Create Category
export const createCategory = async (req: Request, res: Response) => {
  const categoryRepo = AppDataSource.getRepository(Category);
  const { name, description } = req.body;

  try {
    const existing = await categoryRepo.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = categoryRepo.create({ name, description });
    await categoryRepo.save(category);

    return res.status(201).json({ message: "Category created", category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create category" });
  }
};

// Get All Categories
export const getCategories = async (_req: Request, res: Response) => {
  const categoryRepo = AppDataSource.getRepository(Category);
  try {
    const categories = await categoryRepo.find({
      relations: ["courses"],
      order: { createdAt: "DESC" },
    });
    return res.status(200).json({ categories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// Get Single Category
export const getCategoryById = async (req: Request, res: Response) => {
  const categoryRepo = AppDataSource.getRepository(Category);
  const { id } = req.params;

  try {
    const category = await categoryRepo.findOne({
      where: { id: Number(id) },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch category" });
  }
};

// Update Category
export const updateCategory = async (req: Request, res: Response) => {
  const categoryRepo = AppDataSource.getRepository(Category);
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const category = await categoryRepo.findOne({ where: { id: Number(id) } });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.name = name ?? category.name;
    category.description = description ?? category.description;

    await categoryRepo.save(category);

    return res.status(200).json({ message: "Category updated", category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update category" });
  }
};

// Delete Category
export const deleteCategory = async (req: Request, res: Response) => {
  const categoryRepo = AppDataSource.getRepository(Category);
  const { id } = req.params;

  try {
    const category = await categoryRepo.findOne({ where: { id: Number(id) } });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await categoryRepo.remove(category);

    return res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete category" });
  }
};
