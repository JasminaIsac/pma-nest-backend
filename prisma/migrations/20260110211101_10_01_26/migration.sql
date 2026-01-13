/*
  Warnings:

  - You are about to drop the column `conversationId` on the `conversation_participants` table. All the data in the column will be lost.
  - You are about to drop the column `joinedAt` on the `conversation_participants` table. All the data in the column will be lost.
  - You are about to drop the column `lastReadAt` on the `conversation_participants` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `conversation_participants` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `conversationId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `messages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[conversation_id,user_id]` on the table `conversation_participants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `conversation_id` to the `conversation_participants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `conversation_participants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conversation_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_userId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropIndex
DROP INDEX "conversation_participants_conversationId_userId_key";

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "conversation_participants" DROP COLUMN "conversationId",
DROP COLUMN "joinedAt",
DROP COLUMN "lastReadAt",
DROP COLUMN "userId",
ADD COLUMN     "conversation_id" INTEGER NOT NULL,
ADD COLUMN     "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "last_read_at" TIMESTAMP(3),
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "conversationId",
DROP COLUMN "createdAt",
DROP COLUMN "senderId",
ADD COLUMN     "conversation_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sender_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "cover_url" TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT;

-- AlterTable
ALTER TABLE "users_to_projects" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
