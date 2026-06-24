import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schemas';

export const listAllCategories = async () => {
  return prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
};

// Public: only active categories that have at least 1 active offer
export const listActiveCategories = async () => {
  return prisma.category.findMany({
    where: {
      isActive: true,
      offers: { some: { isActive: true } },
    },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, label: true, icon: true, color: true, sortOrder: true },
  });
};

export const createCategory = async (data: CreateCategoryInput) => {
  return prisma.category.create({ data: { ...data, sortOrder: data.sortOrder ?? 0 } });
};

export const updateCategory = async (id: string, data: UpdateCategoryInput) => {
  return prisma.category.update({ where: { id }, data: data as Prisma.CategoryUpdateInput });
};

// Soft-delete: never hard-delete (referential integrity)
export const deactivateCategory = async (id: string) => {
  return prisma.category.update({ where: { id }, data: { isActive: false } });
};
