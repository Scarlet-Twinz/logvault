/*
  Warnings:

  - A unique constraint covering the columns `[service,timestamp]` on the table `Metric` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Metric" ALTER COLUMN "timestamp" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Metric_service_timestamp_key" ON "Metric"("service", "timestamp");
