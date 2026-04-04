import { Router, Request, Response } from 'express';

const router = Router();
const ACCESS_PASSWORD = process.env.EDITOR_PASSWORD || 'admin123';

router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ACCESS_PASSWORD) {
    // Set httpOnly cookie for better security (XSS protection)
    // In production, also set 'secure: true' for HTTPS
    res.cookie('editor_password', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('editor_password');
  res.json({ success: true });
});

export default router;
