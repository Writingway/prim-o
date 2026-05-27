import jwt from 'jsonwebtoken';

/**
 * Middleware de vérification JWT.
 * Attache req.user = { id, type } si le token est valide.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

/**
 * Middleware : réserve la route aux employeurs uniquement.
 */
export const requireEmployer = (req, res, next) => {
  if (req.user?.type !== 'employer') {
    return res.status(403).json({ error: 'Accès réservé aux employeurs.' });
  }
  next();
};

/**
 * Middleware : réserve la route aux employés uniquement.
 */
export const requireEmployee = (req, res, next) => {
  if (req.user?.type !== 'employee') {
    return res.status(403).json({ error: 'Accès réservé aux employés.' });
  }
  next();
};
