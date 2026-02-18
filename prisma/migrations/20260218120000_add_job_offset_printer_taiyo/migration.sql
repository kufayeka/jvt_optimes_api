-- CreateTable
CREATE TABLE "Job_Offset_Printer_Taiyo" (
    "id" UUID NOT NULL,
    "work_order" VARCHAR(100) NOT NULL,
    "sales_order" VARCHAR(100) NOT NULL,
    "quantity_order" INTEGER NOT NULL DEFAULT 1,
    "quantity_unit" INTEGER NOT NULL,
    "work_center" INTEGER NOT NULL,
    "planned_start_time" TIMESTAMP(3) NOT NULL,
    "release_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "job_priority" INTEGER NOT NULL,
    "job_lifecycle_state" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '-',
    "attribute" JSONB,

    CONSTRAINT "Job_Offset_Printer_Taiyo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_Offset_Printer_Taiyo_work_order_key" ON "Job_Offset_Printer_Taiyo"("work_order");

-- CreateIndex
CREATE INDEX "Job_Offset_Printer_Taiyo_work_center_planned_start_time_idx" ON "Job_Offset_Printer_Taiyo"("work_center", "planned_start_time");

-- AddForeignKey
ALTER TABLE "Job_Offset_Printer_Taiyo" ADD CONSTRAINT "Job_Offset_Printer_Taiyo_quantity_unit_fkey" FOREIGN KEY ("quantity_unit") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job_Offset_Printer_Taiyo" ADD CONSTRAINT "Job_Offset_Printer_Taiyo_work_center_fkey" FOREIGN KEY ("work_center") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job_Offset_Printer_Taiyo" ADD CONSTRAINT "Job_Offset_Printer_Taiyo_job_priority_fkey" FOREIGN KEY ("job_priority") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job_Offset_Printer_Taiyo" ADD CONSTRAINT "Job_Offset_Printer_Taiyo_job_lifecycle_state_fkey" FOREIGN KEY ("job_lifecycle_state") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
