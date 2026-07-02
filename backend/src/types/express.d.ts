// Global augmentation: req.user is populated by requireAuth/optionalAuth (auth.middleware).
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string | null; companyId?: string };
    }
  }
}
export {};
