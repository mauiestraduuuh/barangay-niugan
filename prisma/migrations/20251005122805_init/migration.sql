-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "resident_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "address" TEXT,
    "contact_no" TEXT,
    "senior_mode" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("resident_id")
);

-- CreateTable
CREATE TABLE "CertificateRequest" (
    "request_id" SERIAL NOT NULL,
    "resident_id" INTEGER NOT NULL,
    "certificate_type" TEXT NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL,
    "approved_by" INTEGER,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "file_path" TEXT,

    CONSTRAINT "CertificateRequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "DigitalID" (
    "digital_id" SERIAL NOT NULL,
    "resident_id" INTEGER NOT NULL,
    "id_number" TEXT NOT NULL,
    "qr_code" TEXT,
    "issued_by" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalID_pkey" PRIMARY KEY ("digital_id")
);

-- CreateTable
CREATE TABLE "DemographicTag" (
    "tag_id" SERIAL NOT NULL,
    "resident_id" INTEGER NOT NULL,
    "tag_type" TEXT NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemographicTag_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "announcement_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "posted_by" INTEGER NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_public" BOOLEAN NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("announcement_id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "feedback_id" SERIAL NOT NULL,
    "resident_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "response" TEXT,
    "responded_by" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalID_id_number_key" ON "DigitalID"("id_number");

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateRequest" ADD CONSTRAINT "CertificateRequest_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "Resident"("resident_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateRequest" ADD CONSTRAINT "CertificateRequest_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalID" ADD CONSTRAINT "DigitalID_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "Resident"("resident_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalID" ADD CONSTRAINT "DigitalID_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemographicTag" ADD CONSTRAINT "DemographicTag_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "Resident"("resident_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemographicTag" ADD CONSTRAINT "DemographicTag_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "Resident"("resident_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
