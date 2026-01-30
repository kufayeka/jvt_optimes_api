-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(100),
    "email" VARCHAR(100),
    "attribute" JSONB,
    "account_lifecycle" UUID NOT NULL,
    "account_type" UUID NOT NULL,
    "account_role" UUID,
    "account_expiry_date" TIMESTAMP(3),
    "password_last_changed" TIMESTAMP(3),
    "password_expiry_time" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "last_login_time" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_account_lifecycle_fkey" FOREIGN KEY ("account_lifecycle") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_account_type_fkey" FOREIGN KEY ("account_type") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_account_role_fkey" FOREIGN KEY ("account_role") REFERENCES "Lookup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
