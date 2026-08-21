-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'CUSTOMER', 'SUPPLIER', 'SALES', 'LOGISTICS', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('BUYER', 'SUPPLIER', 'SALES', 'LOGISTICS', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('ACTIVE', 'PENDING_APPROVAL', 'REVOKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_PHONE_VERIFICATION', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('PHONE_REGISTRATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('SUPPLIER', 'LOGISTICS');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REVERSED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('INITIATED', 'HELD', 'RELEASED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "FreightMode" AS ENUM ('AIR', 'SEA');

-- CreateEnum
CREATE TYPE "SourcingStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'QUOTED', 'ACCEPTED', 'FULFILLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('IMPORTED', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "UserRoleStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('CUSTOMER_BUSINESS', 'SUPPLIER', 'LOGISTICS_COMPANY', 'LUMO_INTERNAL');

-- CreateEnum
CREATE TYPE "MembershipPosition" AS ENUM ('OWNER', 'MANAGER', 'SALES_OFFICER', 'DISPATCHER', 'DRIVER', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ConversationVisibility" AS ENUM ('CUSTOMER_VISIBLE', 'ASSIGNED_PARTICIPANTS', 'LUMO_INTERNAL', 'ADMIN_SECURITY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SECURITY', 'TRANSACTIONAL', 'SERVICE', 'MARKETING');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('DEMO', 'CSV_IMPORT', 'EXCEL_IMPORT', 'MANUAL', 'LUMO_AGENT', 'LUMO_SUPPLIER', 'MANUFACTURER', 'WHOLESALER', 'MARKETPLACE_REFERENCE');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('PENDING', 'IMPORTED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'QUOTED', 'AWARDED', 'CLOSED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVISED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SmsCampaignType" AS ENUM ('TRANSACTIONAL', 'SERVICE', 'MARKETING', 'SECURITY');

-- CreateEnum
CREATE TYPE "SmsCampaignStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'QUEUED', 'SENDING', 'COMPLETED', 'PARTIALLY_FAILED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('SALES', 'AGENT', 'SUPPLIER', 'INSPECTOR', 'LOGISTICS');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('UNASSIGNED', 'OFFERED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXPIRED', 'REASSIGNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "phone" TEXT,
    "companyName" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "phoneVerifiedAt" TIMESTAMP(3),
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING_PHONE_VERIFICATION',
    "authenticationHoldUntil" TIMESTAMP(3),
    "lastSuccessfulLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "securityReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_applications" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "applicationType" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "draftData" JSONB,
    "submissionDate" TIMESTAMP(3),
    "assignedReviewerId" TEXT,
    "decisionDate" TIMESTAMP(3),
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_profiles" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registeredName" TEXT NOT NULL,
    "tradingName" TEXT,
    "registrationNumber" TEXT NOT NULL,
    "tinNumber" TEXT NOT NULL,
    "countryOfRegistration" TEXT NOT NULL DEFAULT 'Tanzania',
    "businessAddress" TEXT NOT NULL,
    "website" TEXT,
    "marketplaceProfile" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactPosition" TEXT NOT NULL,
    "yearEstablished" INTEGER,
    "employeeCount" TEXT,
    "supplierType" TEXT NOT NULL,
    "mainCategories" TEXT[],
    "productDescription" TEXT NOT NULL,
    "brandsSupplied" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "manufacturingStatus" TEXT,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "monthlyCapacity" TEXT,
    "countriesServed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shippingOrigin" TEXT,
    "warehouseLocation" TEXT,
    "inventoryAvailability" TEXT,
    "orderProcessingTime" TEXT,
    "supportedShippingMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "returnPolicy" TEXT,
    "warrantyArrangements" TEXT,
    "qualityControlProcess" TEXT,
    "inspectionAvailable" BOOLEAN NOT NULL DEFAULT false,
    "incoterms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportedCurrencies" TEXT[] DEFAULT ARRAY['TZS', 'USD']::TEXT[],
    "partnerStatus" "PartnerStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_profiles" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradingName" TEXT,
    "registrationNumber" TEXT NOT NULL,
    "tinNumber" TEXT NOT NULL,
    "countryOfRegistration" TEXT NOT NULL DEFAULT 'Tanzania',
    "officeAddress" TEXT NOT NULL,
    "website" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactPosition" TEXT NOT NULL,
    "yearsInOperation" INTEGER,
    "employeeCount" TEXT,
    "servicesOffered" TEXT[],
    "countriesOfOperation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portsServed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "airportsServed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tanzaniaRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "warehouseLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fleetSize" INTEGER,
    "vehicleTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shipmentCapacity" TEXT,
    "avgDeliveryTimes" TEXT,
    "trackingCapabilities" TEXT,
    "podCapabilities" TEXT,
    "apiIntegration" BOOLEAN NOT NULL DEFAULT false,
    "supportedCargoTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "restrictedCargo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateStructure" TEXT,
    "minShipmentReq" TEXT,
    "paymentTerms" TEXT,
    "insuranceCoverage" TEXT,
    "claimsProcedure" TEXT,
    "slas" TEXT,
    "supportedCurrencies" TEXT[] DEFAULT ARRAY['TZS', 'USD']::TEXT[],
    "supportAvailability" TEXT,
    "escalationContacts" TEXT,
    "operatingHours" TEXT,
    "partnerStatus" "PartnerStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentCategory" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileHash" TEXT,
    "verifiedStatus" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_review_notes" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "noteText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_review_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_messages" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" "Role" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "previousStatus" "ApplicationStatus" NOT NULL,
    "newStatus" "ApplicationStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_checks" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "consentType" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL DEFAULT '1.0',
    "privacyVersion" TEXT NOT NULL DEFAULT '1.0',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "activeRole" "Role",
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "hashedCode" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN_OR_REGISTER',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resendAvailableAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phoneTargetHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "resendAvailableAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_authorizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'PASSWORD_RESET',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_security_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "accountTargetHash" TEXT,
    "ipHash" TEXT,
    "deviceHash" TEXT,
    "endpoint" TEXT NOT NULL,
    "purpose" TEXT,
    "action" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "correlationId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "signCount" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT,
    "backupEligible" BOOLEAN NOT NULL DEFAULT false,
    "backupState" BOOLEAN NOT NULL DEFAULT false,
    "deviceLabel" TEXT,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webauthn_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Dar es Salaam',
    "region" TEXT NOT NULL DEFAULT 'Dar es Salaam',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "selectedVariant" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "hubLocation" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'IMPORTED',
    "priceTZS" DECIMAL(14,2) NOT NULL,
    "priceUSD" DECIMAL(12,2) NOT NULL,
    "costPriceUSD" DECIMAL(12,2),
    "compareAtPrice" DECIMAL(14,2),
    "sourceType" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "sourcePlatform" TEXT,
    "sourceProductId" TEXT,
    "sourceUrl" TEXT,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "material" TEXT,
    "countryOfOrigin" TEXT,
    "sourceHub" TEXT NOT NULL DEFAULT 'LUMO Direct',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specs" JSONB,
    "variants" JSONB,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "agentId" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price_tiers" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "originalUrl" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "priceTZS" DECIMAL(14,2),
    "priceUSD" DECIMAL(12,2),
    "costPrice" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_imports" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'csv',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "columnMapping" JSONB,
    "templateName" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_import_rows" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "errors" JSONB,
    "warnings" JSONB,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_audit_logs" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "action" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "subtotalTZS" DECIMAL(14,2) NOT NULL,
    "shippingFeeTZS" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmountTZS" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountTZS" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmountTZS" DECIMAL(14,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentMethod" TEXT NOT NULL DEFAULT 'AzamPay Escrow',
    "shippingAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceTZS" DECIMAL(14,2) NOT NULL,
    "totalPriceTZS" DECIMAL(14,2) NOT NULL,
    "selectedVariant" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'AzamPay',
    "transactionRef" TEXT NOT NULL,
    "amountTZS" DECIMAL(14,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "channel" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_ledger" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "supplierId" TEXT,
    "amountTZS" DECIMAL(14,2) NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'INITIATED',
    "holdingPartner" TEXT NOT NULL DEFAULT 'AzamPay Escrow Partner',
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL DEFAULT 'Dar es Salaam Port',
    "mode" "FreightMode" NOT NULL DEFAULT 'SEA',
    "status" TEXT NOT NULL DEFAULT 'In Transit',
    "estimatedDelivery" TIMESTAMP(3),
    "milestones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_requests" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "description" TEXT,
    "targetQuantity" INTEGER NOT NULL DEFAULT 10,
    "targetPriceTZS" DECIMAL(14,2),
    "status" "SourcingStatus" NOT NULL DEFAULT 'SUBMITTED',
    "quoteDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourcing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_assignments" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantityNeeded" INTEGER NOT NULL,
    "targetBudgetUSD" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "assignedBy" TEXT NOT NULL DEFAULT 'LUMO HQ',
    "selectedSupplier" JSONB,
    "packageSpecs" JSONB,
    "shippingMethod" TEXT,
    "carrierName" TEXT,
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_records" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "photos" JSONB NOT NULL,
    "videoUrl" TEXT,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "customerApproval" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "targetResource" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_audit_logs" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "gpsLocation" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,
    "targetDeliveryDate" TIMESTAMP(3),
    "destinationCity" TEXT NOT NULL DEFAULT 'Dar es Salaam',
    "destinationPort" TEXT NOT NULL DEFAULT 'Dar es Salaam Port',
    "incotermPreference" TEXT NOT NULL DEFAULT 'FOB',
    "maxBudgetTZS" DECIMAL(18,4),
    "status" "RfqStatus" NOT NULL DEFAULT 'SUBMITTED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_items" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "specifications" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "targetUnitPriceTZS" DECIMAL(18,4),

    CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_requirements" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rfq_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_attachments" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_invitations" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_quotations" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "QuotationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "subtotalAmount" DECIMAL(18,4) NOT NULL,
    "freightAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "incoterm" TEXT NOT NULL DEFAULT 'FOB',
    "estimatedLeadDays" INTEGER NOT NULL DEFAULT 14,
    "sampleAvailable" BOOLEAN NOT NULL DEFAULT false,
    "originCountry" TEXT NOT NULL DEFAULT 'China',
    "inspectionTerms" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "subtotal" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_charges" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "chargeName" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quotation_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_versions" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_messages" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "Role" NOT NULL,
    "messageText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_status_history" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "previousStatus" "QuotationStatus" NOT NULL,
    "newStatus" "QuotationStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL DEFAULT 'TZS',
    "rate" DECIMAL(18,6) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'BOT_OFFICIAL',
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_codes" (
    "id" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tariff_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_duty_rates" (
    "id" TEXT NOT NULL,
    "tariffCodeId" TEXT NOT NULL,
    "importDutyPercent" DECIMAL(6,2) NOT NULL,
    "vatPercent" DECIMAL(6,2) NOT NULL DEFAULT 18.00,
    "railwayLevyPercent" DECIMAL(6,2) NOT NULL DEFAULT 1.50,
    "whidLevyPercent" DECIMAL(6,2) NOT NULL DEFAULT 0.60,
    "excisePercent" DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "tariff_duty_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freight_rate_cards" (
    "id" TEXT NOT NULL,
    "originCountry" TEXT NOT NULL,
    "destinationPort" TEXT NOT NULL DEFAULT 'Dar es Salaam Port',
    "transportMode" TEXT NOT NULL DEFAULT 'AIR',
    "minWeightKg" DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    "pricePerKgUSD" DECIMAL(10,2) NOT NULL,
    "baseHandlingFeeUSD" DECIMAL(10,2) NOT NULL DEFAULT 20.00,
    "estimatedDaysMin" INTEGER NOT NULL DEFAULT 5,
    "estimatedDaysMax" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freight_rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electronic_waybills" (
    "id" TEXT NOT NULL,
    "ewbNumber" TEXT NOT NULL,
    "orderId" TEXT,
    "shipmentType" TEXT NOT NULL DEFAULT 'AIR_CARGO',
    "originPort" TEXT NOT NULL DEFAULT 'Guangzhou Baiyun Intl Airport',
    "destinationPort" TEXT NOT NULL DEFAULT 'Dar es Salaam Port (JNIA)',
    "carrierName" TEXT NOT NULL DEFAULT 'Ethiopian Airlines Cargo',
    "vesselOrFlightNo" TEXT,
    "containerNo" TEXT,
    "billOfLadingNo" TEXT,
    "departureDate" TIMESTAMP(3),
    "estimatedArrival" TIMESTAMP(3) NOT NULL,
    "actualArrival" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "qrCodeData" TEXT,
    "digitalSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "electronic_waybills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "waybillId" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "statusDescription" TEXT NOT NULL,
    "eventTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByRole" TEXT NOT NULL DEFAULT 'LOGISTICS_AGENT',

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_of_deliveries" (
    "id" TEXT NOT NULL,
    "waybillId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientIdType" TEXT,
    "signaturePhotoUrl" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proof_of_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_templates" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" "SmsCampaignType" NOT NULL DEFAULT 'TRANSACTIONAL',
    "language" TEXT NOT NULL DEFAULT 'en',
    "templateTextEn" TEXT NOT NULL,
    "templateTextSw" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_campaigns" (
    "id" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "campaignType" "SmsCampaignType" NOT NULL DEFAULT 'MARKETING',
    "senderId" TEXT NOT NULL DEFAULT 'LUMO',
    "language" TEXT NOT NULL DEFAULT 'sw',
    "templateKey" TEXT,
    "messageContent" TEXT NOT NULL,
    "audienceFilter" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "excludedCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedSegments" INTEGER NOT NULL DEFAULT 1,
    "estimatedCostTzs" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "actualCostTzs" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" "SmsCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "scheduledTime" TIMESTAMP(3),
    "startedTime" TIMESTAMP(3),
    "completedTime" TIMESTAMP(3),
    "providerBatchIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failureReason" TEXT,
    "auditMetadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "phoneE164" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "sms_campaign_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_batches" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "campaignId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'meseji',
    "senderId" TEXT NOT NULL DEFAULT 'LUMO',
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "successfulCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "lastPolledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_message_attempts" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "recipientE164" TEXT NOT NULL,
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attemptsCount" INTEGER NOT NULL DEFAULT 1,
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_message_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_outbox" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "payloadJson" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "providerBatchId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT,

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionalSmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingSmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderStatusSmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "securitySmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "optedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_provider_account_snapshots" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'meseji',
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "successfulDeliveries" INTEGER NOT NULL DEFAULT 0,
    "failedDeliveries" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "balanceTzs" DECIMAL(12,2),
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_provider_account_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_assignments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sourcingRequestId" TEXT,
    "assignmentRole" "AssignmentRole" NOT NULL DEFAULT 'SALES',
    "assigneeId" TEXT,
    "assigneeOrganizationId" TEXT,
    "assignedById" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "reason" TEXT,
    "instructions" TEXT,
    "offeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "slaDueAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "unassignedAt" TIMESTAMP(3),
    "reassignmentReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserRoleStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "status" "RoleStatus" NOT NULL DEFAULT 'ACTIVE',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "registrationNumber" TEXT,
    "tinNumber" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" "MembershipPosition" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_events" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "sourcingRequestId" TEXT,
    "supportTicketId" TEXT,
    "disputeId" TEXT,
    "visibility" "ConversationVisibility" NOT NULL DEFAULT 'CUSTOMER_VISIBLE',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_app_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "activeHub" TEXT NOT NULL DEFAULT 'China',
    "allowedHubs" TEXT[] DEFAULT ARRAY['China', 'Dubai', 'Turkey', 'India']::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "gpsLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_leads" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "orderId" TEXT,
    "companyName" TEXT NOT NULL,
    "storeName" TEXT,
    "marketplaceUrl" TEXT,
    "country" TEXT NOT NULL DEFAULT 'China',
    "city" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'Unverified',
    "riskRating" TEXT NOT NULL DEFAULT 'Low',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unitPriceUSD" DECIMAL(12,2),
    "moq" INTEGER NOT NULL DEFAULT 1,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "sampleCostUSD" DECIMAL(12,2),
    "domesticTransportUSD" DECIMAL(12,2),
    "packagingCostUSD" DECIMAL(12,2),
    "inspectionCostUSD" DECIMAL(12,2),
    "internationalFreightUSD" DECIMAL(12,2),
    "dutyEstimateUSD" DECIMAL(12,2),
    "landedCostUSD" DECIMAL(12,2),
    "sizeVariants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "colorVariants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materialVariants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modelVariants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "documents" JSONB,
    "images" JSONB,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_records" (
    "id" TEXT NOT NULL,
    "collectionRef" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "agentId" TEXT,
    "hub" TEXT NOT NULL DEFAULT 'China',
    "supplierName" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehiclePlate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "packageCount" INTEGER NOT NULL DEFAULT 0,
    "grossWeightKg" DOUBLE PRECISION,
    "volumeCbm" DOUBLE PRECISION,
    "photos" JSONB,
    "notes" TEXT,
    "proofOtp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_inspections" (
    "id" TEXT NOT NULL,
    "inspectionRef" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "collectionId" TEXT,
    "supplierId" TEXT,
    "agentId" TEXT,
    "hub" TEXT NOT NULL DEFAULT 'China',
    "inspectionType" TEXT NOT NULL DEFAULT 'Pre-shipment',
    "lotSize" INTEGER NOT NULL DEFAULT 100,
    "orderedQty" INTEGER NOT NULL DEFAULT 100,
    "receivedQty" INTEGER NOT NULL DEFAULT 100,
    "sampleSize" INTEGER NOT NULL DEFAULT 80,
    "inspectedQty" INTEGER NOT NULL DEFAULT 80,
    "passedQty" INTEGER NOT NULL DEFAULT 80,
    "failedQty" INTEGER NOT NULL DEFAULT 0,
    "missingQty" INTEGER NOT NULL DEFAULT 0,
    "damagedQty" INTEGER NOT NULL DEFAULT 0,
    "inspectionLevel" TEXT NOT NULL DEFAULT 'Level II',
    "aqlConfig" JSONB,
    "criticalDefects" INTEGER NOT NULL DEFAULT 0,
    "majorDefects" INTEGER NOT NULL DEFAULT 0,
    "minorDefects" INTEGER NOT NULL DEFAULT 0,
    "checklist" JSONB,
    "specsSnapshot" JSONB,
    "evidencePhotos" JSONB,
    "evidenceVideos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "result" TEXT NOT NULL DEFAULT 'Pending',
    "hqDecision" TEXT,
    "hqReviewNotes" TEXT,
    "hqReviewerId" TEXT,
    "hqReviewedAt" TIMESTAMP(3),
    "reinspectionRef" TEXT,
    "parentInspectionId" TEXT,
    "reportPdfUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_defects" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "defectRef" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "severity" TEXT NOT NULL DEFAULT 'Major',
    "description" TEXT NOT NULL,
    "quantityAffected" INTEGER NOT NULL DEFAULT 1,
    "supplierResponsibility" BOOLEAN NOT NULL DEFAULT true,
    "recommendedAction" TEXT NOT NULL DEFAULT 'Rework',
    "status" TEXT NOT NULL DEFAULT 'Recorded',
    "photoUrl" TEXT,
    "videoUrl" TEXT,
    "checklistKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_defects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_evidences" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "slotLabel" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "width" INTEGER,
    "height" INTEGER,
    "caption" TEXT,
    "annotations" JSONB,
    "uploaderId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_corrective_actions" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "actionRef" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "defectSummary" TEXT NOT NULL,
    "requiredAction" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "supplierResponse" TEXT,
    "replacementQty" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_corrective_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_audit_logs" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_packages" (
    "id" TEXT NOT NULL,
    "packageRef" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "collectionId" TEXT,
    "hub" TEXT NOT NULL DEFAULT 'China',
    "locationRack" TEXT NOT NULL DEFAULT 'A-01-01',
    "packageCount" INTEGER NOT NULL DEFAULT 1,
    "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "dimensions" TEXT NOT NULL DEFAULT '40x30x30 cm',
    "packagingType" TEXT NOT NULL DEFAULT 'Standard Carton',
    "repackCostUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Received',
    "inboundPhotos" JSONB,
    "labelsPrinted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_records" (
    "id" TEXT NOT NULL,
    "shipmentRef" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "packageId" TEXT,
    "hub" TEXT NOT NULL DEFAULT 'China',
    "mode" TEXT NOT NULL DEFAULT 'AIR',
    "logisticsProvider" TEXT NOT NULL DEFAULT 'LUMO Express Logistics',
    "trackingNumber" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'Guangzhou / Shenzhen',
    "destination" TEXT NOT NULL DEFAULT 'Dar es Salaam Port',
    "incoterm" TEXT NOT NULL DEFAULT 'FOB',
    "chargeableWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "freightCostUSD" DECIMAL(12,2) NOT NULL DEFAULT 150.00,
    "insuranceCostUSD" DECIMAL(12,2) NOT NULL DEFAULT 15.00,
    "estimatedDeparture" TIMESTAMP(3),
    "estimatedArrival" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Booked',
    "milestones" JSONB,
    "documents" JSONB,
    "podUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_profiles_applicationId_key" ON "supplier_profiles"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_profiles_userId_key" ON "supplier_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "logistics_profiles_applicationId_key" ON "logistics_profiles"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "logistics_profiles_userId_key" ON "logistics_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "otp_codes_identifier_idx" ON "otp_codes"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_hashedToken_key" ON "password_reset_tokens"("hashedToken");

-- CreateIndex
CREATE INDEX "otp_challenges_phoneTargetHash_purpose_idx" ON "otp_challenges"("phoneTargetHash", "purpose");

-- CreateIndex
CREATE INDEX "otp_challenges_userId_purpose_idx" ON "otp_challenges"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_authorizations_tokenHash_key" ON "password_reset_authorizations"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_authorizations_tokenHash_idx" ON "password_reset_authorizations"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_authorizations_userId_idx" ON "password_reset_authorizations"("userId");

-- CreateIndex
CREATE INDEX "auth_security_events_accountTargetHash_createdAt_idx" ON "auth_security_events"("accountTargetHash", "createdAt");

-- CreateIndex
CREATE INDEX "auth_security_events_ipHash_createdAt_idx" ON "auth_security_events"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "auth_security_events_eventType_createdAt_idx" ON "auth_security_events"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "webauthn_credentials_credentialId_key" ON "webauthn_credentials"("credentialId");

-- CreateIndex
CREATE INDEX "webauthn_credentials_userId_idx" ON "webauthn_credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "webauthn_challenges_challenge_key" ON "webauthn_challenges"("challenge");

-- CreateIndex
CREATE INDEX "webauthn_challenges_userId_idx" ON "webauthn_challenges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_productId_key" ON "wishlist_items"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_userId_productId_selectedVariant_key" ON "cart_items"("userId", "productId", "selectedVariant");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_userId_key" ON "suppliers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "product_price_tiers_productId_isActive_idx" ON "product_price_tiers"("productId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "product_price_tiers_productId_minQuantity_currency_key" ON "product_price_tiers"("productId", "minQuantity", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payment_records_transactionRef_key" ON "payment_records"("transactionRef");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_ledger_orderId_key" ON "escrow_ledger"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_trackingNumber_key" ON "shipments"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_ticketNumber_key" ON "disputes"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "agent_assignments_orderNumber_key" ON "agent_assignments"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rfqs_rfqNumber_key" ON "rfqs"("rfqNumber");

-- CreateIndex
CREATE INDEX "rfqs_buyerId_status_idx" ON "rfqs"("buyerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_quotations_quotationNumber_key" ON "supplier_quotations"("quotationNumber");

-- CreateIndex
CREATE INDEX "supplier_quotations_rfqId_supplierId_status_idx" ON "supplier_quotations"("rfqId", "supplierId", "status");

-- CreateIndex
CREATE INDEX "exchange_rates_baseCurrency_targetCurrency_effectiveAt_idx" ON "exchange_rates"("baseCurrency", "targetCurrency", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_codes_hsCode_key" ON "tariff_codes"("hsCode");

-- CreateIndex
CREATE INDEX "freight_rate_cards_originCountry_transportMode_isActive_idx" ON "freight_rate_cards"("originCountry", "transportMode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "electronic_waybills_ewbNumber_key" ON "electronic_waybills"("ewbNumber");

-- CreateIndex
CREATE INDEX "electronic_waybills_orderId_status_idx" ON "electronic_waybills"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "proof_of_deliveries_waybillId_key" ON "proof_of_deliveries"("waybillId");

-- CreateIndex
CREATE UNIQUE INDEX "sms_templates_templateKey_key" ON "sms_templates"("templateKey");

-- CreateIndex
CREATE INDEX "sms_campaigns_status_scheduledTime_idx" ON "sms_campaigns"("status", "scheduledTime");

-- CreateIndex
CREATE INDEX "sms_campaign_recipients_campaignId_phoneE164_idx" ON "sms_campaign_recipients"("campaignId", "phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "sms_batches_batchId_key" ON "sms_batches"("batchId");

-- CreateIndex
CREATE INDEX "sms_batches_batchId_idx" ON "sms_batches"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_outbox_idempotencyKey_key" ON "notification_outbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notification_outbox_status_nextAttemptAt_idx" ON "notification_outbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_outbox_eventType_aggregateId_recipientId_templ_key" ON "notification_outbox"("eventType", "aggregateId", "recipientId", "templateVersion");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "order_assignments_orderId_assignmentRole_status_idx" ON "order_assignments"("orderId", "assignmentRole", "status");

-- CreateIndex
CREATE INDEX "order_assignments_assigneeId_status_idx" ON "order_assignments"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "order_assignments_assigneeOrganizationId_status_idx" ON "order_assignments"("assigneeOrganizationId", "status");

-- CreateIndex
CREATE INDEX "user_roles_userId_status_idx" ON "user_roles"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE INDEX "user_role_assignments_userId_status_idx" ON "user_role_assignments"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_userId_role_key" ON "user_role_assignments"("userId", "role");

-- CreateIndex
CREATE INDEX "organization_members_userId_isActive_idx" ON "organization_members"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "assignment_events_assignmentId_createdAt_idx" ON "assignment_events"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "conversations_orderId_idx" ON "conversations"("orderId");

-- CreateIndex
CREATE INDEX "conversations_sourcingRequestId_idx" ON "conversations"("sourcingRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "in_app_notifications_userId_isRead_createdAt_idx" ON "in_app_notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "agent_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_agentCode_key" ON "agent_profiles"("agentCode");

-- CreateIndex
CREATE INDEX "supplier_leads_orderId_idx" ON "supplier_leads"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "collection_records_collectionRef_key" ON "collection_records"("collectionRef");

-- CreateIndex
CREATE INDEX "collection_records_orderId_idx" ON "collection_records"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "quality_inspections_inspectionRef_key" ON "quality_inspections"("inspectionRef");

-- CreateIndex
CREATE INDEX "quality_inspections_orderId_idx" ON "quality_inspections"("orderId");

-- CreateIndex
CREATE INDEX "quality_inspections_agentId_idx" ON "quality_inspections"("agentId");

-- CreateIndex
CREATE INDEX "quality_inspections_hub_idx" ON "quality_inspections"("hub");

-- CreateIndex
CREATE INDEX "inspection_defects_inspectionId_idx" ON "inspection_defects"("inspectionId");

-- CreateIndex
CREATE INDEX "inspection_evidences_inspectionId_slotId_idx" ON "inspection_evidences"("inspectionId", "slotId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_corrective_actions_actionRef_key" ON "inspection_corrective_actions"("actionRef");

-- CreateIndex
CREATE INDEX "inspection_corrective_actions_inspectionId_idx" ON "inspection_corrective_actions"("inspectionId");

-- CreateIndex
CREATE INDEX "inspection_audit_logs_inspectionId_idx" ON "inspection_audit_logs"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_packages_packageRef_key" ON "warehouse_packages"("packageRef");

-- CreateIndex
CREATE INDEX "warehouse_packages_orderId_idx" ON "warehouse_packages"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_records_shipmentRef_key" ON "shipment_records"("shipmentRef");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_records_trackingNumber_key" ON "shipment_records"("trackingNumber");

-- CreateIndex
CREATE INDEX "shipment_records_orderId_idx" ON "shipment_records"("orderId");

-- AddForeignKey
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_assignedReviewerId_fkey" FOREIGN KEY ("assignedReviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_profiles" ADD CONSTRAINT "supplier_profiles_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_profiles" ADD CONSTRAINT "logistics_profiles_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_review_notes" ADD CONSTRAINT "application_review_notes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_messages" ADD CONSTRAINT "application_messages_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_checks" ADD CONSTRAINT "verification_checks_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "partner_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_authorizations" ADD CONSTRAINT "password_reset_authorizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_security_events" ADD CONSTRAINT "auth_security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_tiers" ADD CONSTRAINT "product_price_tiers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_imports" ADD CONSTRAINT "product_imports_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_import_rows" ADD CONSTRAINT "product_import_rows_importId_fkey" FOREIGN KEY ("importId") REFERENCES "product_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_import_rows" ADD CONSTRAINT "product_import_rows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_audit_logs" ADD CONSTRAINT "catalog_audit_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_requests" ADD CONSTRAINT "sourcing_requests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_records" ADD CONSTRAINT "inspection_records_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "agent_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requirements" ADD CONSTRAINT "rfq_requirements_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_attachments" ADD CONSTRAINT "rfq_attachments_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_invitations" ADD CONSTRAINT "rfq_invitations_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "supplier_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_charges" ADD CONSTRAINT "quotation_charges_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "supplier_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_versions" ADD CONSTRAINT "quotation_versions_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "supplier_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_messages" ADD CONSTRAINT "quotation_messages_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "supplier_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_status_history" ADD CONSTRAINT "quotation_status_history_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "supplier_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_duty_rates" ADD CONSTRAINT "tariff_duty_rates_tariffCodeId_fkey" FOREIGN KEY ("tariffCodeId") REFERENCES "tariff_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electronic_waybills" ADD CONSTRAINT "electronic_waybills_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_waybillId_fkey" FOREIGN KEY ("waybillId") REFERENCES "electronic_waybills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_of_deliveries" ADD CONSTRAINT "proof_of_deliveries_waybillId_fkey" FOREIGN KEY ("waybillId") REFERENCES "electronic_waybills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_campaign_recipients" ADD CONSTRAINT "sms_campaign_recipients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "sms_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_batches" ADD CONSTRAINT "sms_batches_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "sms_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_message_attempts" ADD CONSTRAINT "sms_message_attempts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "sms_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_assignments" ADD CONSTRAINT "order_assignments_assigneeOrganizationId_fkey" FOREIGN KEY ("assigneeOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_events" ADD CONSTRAINT "assignment_events_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "order_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_events" ADD CONSTRAINT "assignment_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_defects" ADD CONSTRAINT "inspection_defects_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "quality_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_evidences" ADD CONSTRAINT "inspection_evidences_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "quality_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_corrective_actions" ADD CONSTRAINT "inspection_corrective_actions_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "quality_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_audit_logs" ADD CONSTRAINT "inspection_audit_logs_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "quality_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
