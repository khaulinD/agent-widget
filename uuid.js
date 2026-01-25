// uuid.js
import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

export function generateUUID() {
  return uuidv4();
}
