import { DB } from '../utils/db';

declare global {
  interface Window {
    chronicleSync: {
      db: DB;
    };
  }
}