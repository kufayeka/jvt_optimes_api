ALTER TABLE "Job_Offset_Printer_Taiyo"
ADD COLUMN "scheduled_date" TIMESTAMP(3),
ADD COLUMN "run_date" TIMESTAMP(3),
ADD COLUMN "suspend_date" TIMESTAMP(3),
ADD COLUMN "complete_date" TIMESTAMP(3),
ADD COLUMN "cancel_date" TIMESTAMP(3),
ADD COLUMN "close_date" TIMESTAMP(3);

UPDATE "Job_Offset_Printer_Taiyo"
SET "scheduled_date" = COALESCE("scheduled_date", "planned_start_time")
WHERE "scheduled_date" IS NULL;

INSERT INTO "Lookup" ("lookup_type", "code", "label", "sort_order", "is_active")
SELECT 'JOB_LIFECYCLE_STATE', 'CANCELLED', 'Cancelled', 6, true
WHERE NOT EXISTS (
    SELECT 1
    FROM "Lookup"
    WHERE "lookup_type" = 'JOB_LIFECYCLE_STATE'
      AND "code" = 'CANCELLED'
);
