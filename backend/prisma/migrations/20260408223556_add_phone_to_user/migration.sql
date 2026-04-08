/*
  Warnings:

  - A unique constraint covering the columns `[registration_id]` on the table `TestAttempt` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registration_id` to the `TestAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('STARTED', 'SUBMITTED');

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
ADD COLUMN     "start_time" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN     "registration_id" TEXT NOT NULL,
ADD COLUMN     "status" "AttemptStatus" NOT NULL DEFAULT 'STARTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "ExamRegistration" (
    "registration_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "test_id" INTEGER NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamRegistration_pkey" PRIMARY KEY ("registration_id")
);

-- CreateTable
CREATE TABLE "OTPVerification" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "otp_code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EMAIL',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTPVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamRegistration_user_id_test_id_key" ON "ExamRegistration"("user_id", "test_id");

-- CreateIndex
CREATE UNIQUE INDEX "TestAttempt_registration_id_key" ON "TestAttempt"("registration_id");

-- CreateIndex
CREATE INDEX "TestAttempt_user_id_idx" ON "TestAttempt"("user_id");

-- CreateIndex
CREATE INDEX "TestAttempt_test_id_idx" ON "TestAttempt"("test_id");

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "ExamRegistration"("registration_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRegistration" ADD CONSTRAINT "ExamRegistration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRegistration" ADD CONSTRAINT "ExamRegistration_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Test"("test_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTPVerification" ADD CONSTRAINT "OTPVerification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
