-- Migration to add WeightEntry table for proper weight tracking

-- Add WeightEntry table
CREATE TABLE IF NOT EXISTS "weight_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_entries_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS "weight_entries_user_id_date_idx" ON "weight_entries"("user_id", "date" DESC);
CREATE INDEX IF NOT EXISTS "weight_entries_user_id_created_at_idx" ON "weight_entries"("user_id", "created_at" DESC);

-- Optional: Add unique constraint to prevent duplicate entries on the same day (if desired)
-- CREATE UNIQUE INDEX IF NOT EXISTS "weight_entries_user_id_date_unique" ON "weight_entries"("user_id", DATE("date"));