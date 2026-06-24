import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schemas';
import {
  listAllCategories, listActiveCategories, createCategory, updateCategory, deactivateCategory,
} from '../services/category.service';

export async function listAllCategoriesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await listAllCategories();
    res.json({ categories });
  } catch (err) { next(err); }
}

export async function listActiveCategoriesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await listActiveCategories();
    res.json({ categories });
  } catch (err) { next(err); }
}

export async function createCategoryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await createCategory(data);
    res.status(201).json({ category });
  } catch (err) { next(err); }
}

export async function updateCategoryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) { next(new AppError(400, 'ID requis.')); return; }
    const data = updateCategorySchema.parse(req.body);
    const category = await updateCategory(String(id), data);
    res.json({ category });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      next(new AppError(404, 'Catégorie non trouvée.')); return;
    }
    next(err);
  }
}

export async function deactivateCategoryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) { next(new AppError(400, 'ID requis.')); return; }
    const category = await deactivateCategory(String(id));
    res.json({ category });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      next(new AppError(404, 'Catégorie non trouvée.')); return;
    }
    next(err);
  }
}
