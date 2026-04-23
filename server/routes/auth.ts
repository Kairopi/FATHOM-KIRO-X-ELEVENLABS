import { Router } from 'express';
import { nanoid } from 'nanoid';
import { createUser } from '../db/queries.js';

const router = Router();

router.post('/guest', (req, res) => {
  const { displayName } = req.body;

  if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
    res.status(400).json({ error: 'Display name is required and cannot be empty or whitespace-only.' });
    return;
  }

  const id = nanoid();
  const user = createUser(id, displayName.trim());

  res.json({ user: { id: user!.id, displayName: user!.display_name } });
});

export default router;
