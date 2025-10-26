-- CreateTable
CREATE TABLE "progression_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "crowns" INTEGER NOT NULL DEFAULT 0,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "progression_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "progression_profiles_user_id_key" ON "progression_profiles"("user_id");
CREATE UNIQUE INDEX "progression_profiles_alias_key" ON "progression_profiles"("alias");

-- AddForeignKey
ALTER TABLE "progression_profiles" ADD CONSTRAINT "progression_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
