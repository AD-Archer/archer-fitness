-- CreateEnum
CREATE TYPE "RecoveryFeeling" AS ENUM ('GOOD', 'TIGHT', 'SORE', 'INJURED');

-- CreateTable
CREATE TABLE "recovery_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body_part" TEXT NOT NULL,
    "feeling" "RecoveryFeeling" NOT NULL DEFAULT 'GOOD',
    "intensity" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recovery_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recovery_feedback_user_id_idx" ON "recovery_feedback"("user_id");
CREATE INDEX "recovery_feedback_body_part_idx" ON "recovery_feedback"("body_part");

-- AddForeignKey
ALTER TABLE "recovery_feedback" ADD CONSTRAINT "recovery_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
