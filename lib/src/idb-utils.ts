import { IImageOptions } from "docx";
import { openDB } from "idb";

const DB_NAME = "m2d-image-cache";
const STORE_NAME = "images";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

export const imageCache = {
  async get(key: string): Promise<IImageOptions | undefined> {
    try {
      const db = await dbPromise;
      return await db.get(STORE_NAME, key);
    } catch (err) {
      console.warn("Image cache get failed", err);
      return undefined;
    }
  },

  async set(key: string, value: IImageOptions): Promise<void> {
    try {
      const db = await dbPromise;
      await db.put(STORE_NAME, value, key);
    } catch (err) {
      console.warn("Image cache set failed", err);
    }
  },

  async clear(): Promise<void> {
    const db = await dbPromise;
    await db.clear(STORE_NAME);
  },
};
