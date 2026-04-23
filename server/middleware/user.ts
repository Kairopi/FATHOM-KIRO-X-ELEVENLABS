import { Request, Response, NextFunction } from 'express';
import { getUserById } from '../db/queries.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; display_name: string; created_at: string };
    }
  }
}

export function userMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    res.status(401).json({ error: 'Missing X-User-Id header' });
    return;
  }

  const user = getUserById(userId);

  if (!user) {
    res.status(401).json({ error: 'Invalid user' });
    return;
  }

  req.user = user;
  next();
}
