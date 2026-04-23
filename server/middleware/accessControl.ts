import { Request, Response, NextFunction } from 'express';

const MAX_GENERATIONS_PER_USER = 3;
const generationCounts = new Map<string, number>();
export function rateLimitGenerations(req: Request, res: Response, next: NextFunction) {
  const userId = req.body.userId || req.headers['x-user-id'] as string;

  if (!userId) {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  const currentCount = generationCounts.get(userId) || 0;

  if (currentCount >= MAX_GENERATIONS_PER_USER) {
    res.status(429).json({ 
      error: 'Generation limit reached',
      message: `You have reached the maximum of ${MAX_GENERATIONS_PER_USER} generations. This limit helps preserve API credits for all judges.`
    });
    return;
  }

  generationCounts.set(userId, currentCount + 1);
  next();
}

export function resetUserGenerations(userId: string) {
  generationCounts.delete(userId);
}

export function getUserGenerationCount(userId: string): number {
  return generationCounts.get(userId) || 0;
}
