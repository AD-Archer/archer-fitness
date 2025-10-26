-- CreateEnum
CREATE TYPE "ProgressionNodeStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'COMPLETED');

-- CreateTable
CREATE TABLE "progression_node_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "status" "ProgressionNodeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "completion_count" INTEGER NOT NULL DEFAULT 0,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "last_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "progression_node_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "progression_node_progress_user_id_node_id_key" ON "progression_node_progress"("user_id", "node_id");
CREATE INDEX "progression_node_progress_node_id_idx" ON "progression_node_progress"("node_id");

-- AddForeignKey
ALTER TABLE "progression_node_progress" ADD CONSTRAINT "progression_node_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
