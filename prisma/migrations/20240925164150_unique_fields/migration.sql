/*
  Warnings:

  - A unique constraint covering the columns `[employerId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pg_orderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Job_employerId_key` ON `Job`(`employerId`);

-- CreateIndex
CREATE UNIQUE INDEX `Order_pg_orderId_key` ON `Order`(`pg_orderId`);
