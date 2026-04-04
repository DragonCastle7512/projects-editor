import { Request, Response, NextFunction } from 'express';

const ACCESS_PASSWORD = process.env.EDITOR_PASSWORD || 'admin123';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for login and static files
  if (req.path === '/api/login' || !req.path.startsWith('/api')) {
    return next();
  }

  // Check for password in httpOnly cookie
  const password = req.cookies['editor_password'];
  
  if (password === ACCESS_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
