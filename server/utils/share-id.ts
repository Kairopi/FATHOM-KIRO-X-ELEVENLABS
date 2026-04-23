import { nanoid } from 'nanoid';

export function generateShareId(): string {
  return nanoid(12);
}
