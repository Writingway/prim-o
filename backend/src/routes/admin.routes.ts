import { Router } from 'express';
import {
  createOfferController,
  updateOfferController,
  deactivateOfferController,
  uploadOfferImageMiddleware,
  uploadOfferImageController,
  deleteOfferImageController,
} from '../controllers/offer.controller';
import {
  listAllCategoriesController, createCategoryController,
  updateCategoryController, deactivateCategoryController,
} from '../controllers/category.controller';
import { addPromoCodesController, listPromoCodesController, deletePromoCodeController } from '../controllers/promoCode.controller';
import {
  softDeleteCompanyController, 
  restoreCompanyController,
  listUsersController,
  updateUserController,
  softDeleteUserController,
  getStatsController,
  listCompaniesController,
  createCompanyController,
  setCompanyStatusController,
  listAttributionsController,
  listRedemptionsController,
  listPurchasesController
} from '../controllers/admin.controller';

const router = Router();

// Mounted at /api/admin behind requireAuth + requireAdmin (see server.ts), so routes here carry
// no per-route guards.
router.post('/offers', createOfferController);
router.patch('/offers/:id', updateOfferController);
router.delete('/offers/:id', deactivateOfferController);

// Offer photo: multipart upload (field "image") and deletion.
router.patch('/offers/:id/image', uploadOfferImageMiddleware, uploadOfferImageController);
router.delete('/offers/:id/image', deleteOfferImageController);

// Promo codes for an offer: list and batch add.
router.get('/offers/:offerId/promo-codes', listPromoCodesController);
router.post('/offers/:offerId/promo-codes', addPromoCodesController);
// A code can only be deleted while it is still available (not yet handed out).
router.delete('/promo-codes/:id', deletePromoCodeController);

// Soft-delete a company and everything tied to it.
router.delete('/companies/:id', softDeleteCompanyController);
router.post('/companies/:id/restore', restoreCompanyController);
router.patch('/companies/:id/status', setCompanyStatusController);

router.get('/users', listUsersController);
router.patch('/users/:id', updateUserController);
router.delete('/users/:id', softDeleteUserController);

// Global dashboard stats for the admin (not scoped to one company).
router.get('/stats', getStatsController);
router.get('/companies', listCompaniesController);
router.post('/companies', createCompanyController);
router.get('/attributions', listAttributionsController);
router.get('/redemptions', listRedemptionsController);
router.get('/purchases', listPurchasesController);

router.get('/categories', listAllCategoriesController);
router.post('/categories', createCategoryController);
router.patch('/categories/:id', updateCategoryController);
router.delete('/categories/:id', deactivateCategoryController);

export default router;
