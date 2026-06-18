import { Router } from 'express';
import {
  createOfferController,
  updateOfferController,
  deactivateOfferController,
} from '../controllers/offer.controller';
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
  listAttributionsController,
  listRedemptionsController
} from '../controllers/admin.controller';

const router = Router();

// Mutations réservées à l'admin.
router.post('/offers', createOfferController);
router.patch('/offers/:id', updateOfferController);
router.delete('/offers/:id', deactivateOfferController);

// Codes promo d'une offre : liste (lecture) + ajout en lot.
router.get('/offers/:offerId/promo-codes', listPromoCodesController);
router.post('/offers/:offerId/promo-codes', addPromoCodesController);
// Suppression d'un code (uniquement s'il est encore disponible).
router.delete('/promo-codes/:id', deletePromoCodeController);

// Soft-delete a company and everything tied to it.
router.delete('/companies/:id', softDeleteCompanyController);
router.post('/companies/:id/restore', restoreCompanyController);

router.get('/users', listUsersController);
router.patch('/users/:id', updateUserController);
router.delete('/users/:id', softDeleteUserController);

// Global dashboard stats for the admin (not scoped to one company).
router.get('/stats', getStatsController);
router.get('/companies', listCompaniesController);
router.post('/companies', createCompanyController);
router.get('/attributions', listAttributionsController);
router.get('/redemptions', listRedemptionsController);

export default router;
