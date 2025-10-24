import { defineTable } from 'drizzle-orm/pg-core';
import { json, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const businessCards = defineTable({
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  imagePath: text('image_path').notNull(),
  rawText: text('raw_text'),
  extractedInfo: json('extracted_info'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});