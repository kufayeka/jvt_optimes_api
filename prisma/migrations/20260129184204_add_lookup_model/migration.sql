-- CreateTable
CREATE TABLE "Lookup" (
    "id" UUID NOT NULL,
    "lookup_type" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "attribute" JSONB,

    CONSTRAINT "Lookup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lookup_lookup_type_idx" ON "Lookup"("lookup_type");

-- CreateIndex
CREATE UNIQUE INDEX "Lookup_lookup_type_code_key" ON "Lookup"("lookup_type", "code");
