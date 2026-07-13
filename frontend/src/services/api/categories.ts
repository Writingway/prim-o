import { authRequest } from './client';
import type { Category } from '@/types/types';

// Public endpoint: active categories with >=1 active offer.
// Mounted under offerRouter (/api/offers) on the backend, hence the /offers/categories path.
export const listCategories = () =>
  authRequest<{ categories: Category[] }>('GET', '/offers/categories');

// Admin: all categories, including inactive ones.
export const listAdminCategories = () =>
  authRequest<{ categories: Category[] }>('GET', '/admin/categories');

export const createCategory = (payload: Omit<Category, 'id' | 'isActive' | 'sortOrder'> & { sortOrder?: number; slug: string }) =>
  authRequest<{ category: Category }>('POST', '/admin/categories', payload);

export const updateCategory = (id: string, payload: Partial<Omit<Category, 'id'>>) =>
  authRequest<{ category: Category }>('PATCH', `/admin/categories/${id}`, payload);

export const deactivateCategory = (id: string) =>
  authRequest<{ category: Category }>('DELETE', `/admin/categories/${id}`);
