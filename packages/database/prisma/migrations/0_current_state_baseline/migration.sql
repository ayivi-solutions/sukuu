-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sukuux";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "system";

-- CreateEnum
CREATE TYPE "sukuux"."AcademicStandingStanding" AS ENUM ('DEANS_LIST', 'GOOD_STANDING', 'PROBATION', 'SUSPENDED', 'WARNING');

-- CreateEnum
CREATE TYPE "sukuux"."AccessLogAccessMethod" AS ENUM ('ADMIN', 'API', 'PORTAL', 'QR_CODE', 'TOKEN');

-- CreateEnum
CREATE TYPE "sukuux"."AccountAccountType" AS ENUM ('ASSET', 'EQUITY', 'EXPENSE', 'INCOME', 'LIABILITY');

-- CreateEnum
CREATE TYPE "sukuux"."ActionStatus" AS ENUM ('COMPLETED', 'IN_PROGRESS', 'PENDING');

-- CreateEnum
CREATE TYPE "sukuux"."AddressAddressType" AS ENUM ('HOSTEL', 'POSTAL', 'RESIDENTIAL');

-- CreateEnum
CREATE TYPE "sukuux"."AllowanceAllowanceType" AS ENUM ('HOUSING', 'MEAL', 'MEDICAL', 'OTHER', 'PHONE', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "sukuux"."ApplicantGender" AS ENUM ('FEMALE', 'MALE', 'OTHER');

-- CreateEnum
CREATE TYPE "sukuux"."ApplicantStatus" AS ENUM ('ENROLLED', 'INTERVIEWED', 'OFFERED', 'PENDING', 'REJECTED', 'UNDER_REVIEW', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "sukuux"."ApplicationReviewDecision" AS ENUM ('HOLD', 'PROGRESS', 'REJECT');

-- CreateEnum
CREATE TYPE "sukuux"."ApplicationStageStatus" AS ENUM ('FAILED', 'IN_PROGRESS', 'PASSED', 'PENDING', 'SKIPPED');

-- CreateEnum
CREATE TYPE "sukuux"."ApprovalApprovalLevel" AS ENUM ('ADMIN', 'HOD', 'PRINCIPAL');

-- CreateEnum
CREATE TYPE "sukuux"."ApprovalDecision" AS ENUM ('APPROVED', 'ESCALATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "sukuux"."ApprovalStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "sukuux"."AssessmentAssessmentType" AS ENUM ('CA', 'CLASS_TEST', 'END_OF_TERM', 'MID_TERM', 'PRACTICAL', 'PROJECT');

-- CreateEnum
CREATE TYPE "sukuux"."AssessmentStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "sukuux"."AssetStatus" AS ENUM ('ACTIVE', 'DAMAGED', 'DISPOSED', 'LOST');

-- CreateEnum
CREATE TYPE "sukuux"."AttendancePolicyAttendanceMethod" AS ENUM ('BIOMETRIC', 'MANUAL', 'QR_CODE');

-- CreateEnum
CREATE TYPE "sukuux"."AttendanceStatus" AS ENUM ('ABSENT', 'HOLIDAY', 'LATE', 'ON_LEAVE', 'PRESENT');

-- CreateEnum
CREATE TYPE "sukuux"."BackupBackupType" AS ENUM ('FULL', 'INCREMENTAL', 'SCHEMA');

-- CreateEnum
CREATE TYPE "sukuux"."BackupStatus" AS ENUM ('COMPLETED', 'FAILED', 'PENDING', 'RUNNING');

-- CreateEnum
CREATE TYPE "sukuux"."BankDetailsAccountType" AS ENUM ('CURRENT', 'SAVINGS');

-- CreateEnum
CREATE TYPE "sukuux"."BatchStatus" AS ENUM ('CLOSED', 'COMPLETE', 'OPEN', 'PROCESSING');

-- CreateEnum
CREATE TYPE "sukuux"."BedStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'OCCUPIED', 'RESERVED');

-- CreateEnum
CREATE TYPE "sukuux"."BehaviorProfileRecordType" AS ENUM ('COMMENDATION', 'COUNSELLING', 'EXPULSION', 'SUSPENSION', 'WARNING');

-- CreateEnum
CREATE TYPE "sukuux"."BonusBonusType" AS ENUM ('END_OF_YEAR', 'HOUSING', 'PERFORMANCE', 'SPECIAL', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "sukuux"."BroadcastAudienceType" AS ENUM ('ALL', 'CLASS', 'PARENTS_ONLY', 'STAFF_ONLY', 'STREAM');

-- CreateEnum
CREATE TYPE "sukuux"."BudgetStatus" AS ENUM ('ACTIVE', 'APPROVED', 'CLOSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "sukuux"."CalendarEventEventType" AS ENUM ('ACTIVITY', 'CLOSURE', 'EXAM', 'HOLIDAY', 'TERM_END', 'TERM_START');

-- CreateEnum
CREATE TYPE "sukuux"."CalendarEventType" AS ENUM ('ACTIVITY', 'EXAM', 'HOLIDAY', 'TERM_END', 'TERM_START');

-- CreateEnum
CREATE TYPE "sukuux"."ChannelChannel" AS ENUM ('EMAIL', 'PUSH', 'SMS');

-- CreateEnum
CREATE TYPE "sukuux"."ComplianceStatus" AS ENUM ('EXPIRED', 'NOT_APPLICABLE', 'PENDING', 'VALID');

-- CreateEnum
CREATE TYPE "sukuux"."ConflictConflictType" AS ENUM ('ROOM_DOUBLE_BOOKED', 'STREAM_OVERLAP', 'TEACHER_DOUBLE_BOOKED');

-- CreateEnum
CREATE TYPE "sukuux"."ContactContactType" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "sukuux"."ContractContractType" AS ENUM ('FIXED_TERM', 'PART_TIME', 'PERMANENT', 'PROBATION');

-- CreateEnum
CREATE TYPE "sukuux"."ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'RENEWED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "sukuux"."ConversationConversationType" AS ENUM ('BROADCAST', 'DIRECT', 'GROUP', 'SYSTEM');

-- CreateEnum
CREATE TYPE "sukuux"."CopyStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'DAMAGED', 'LOST', 'RESERVED');

-- CreateEnum
CREATE TYPE "sukuux"."DeductionDeductionType" AS ENUM ('ABSENCE', 'INCOME_TAX', 'LOAN', 'OTHER', 'SSNIT', 'UNION_DUES');

-- CreateEnum
CREATE TYPE "sukuux"."DeliveryStatus" AS ENUM ('DELIVERED', 'PENDING', 'READ', 'SENT');

-- CreateEnum
CREATE TYPE "sukuux"."DiscountApplicableTo" AS ENUM ('FULL_INVOICE', 'SPECIFIC_COMPONENT', 'TUITION_ONLY');

-- CreateEnum
CREATE TYPE "sukuux"."DiscountDiscountType" AS ENUM ('FLAT_AMOUNT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "sukuux"."EmailLogStatus" AS ENUM ('BOUNCED', 'DELIVERED', 'FAILED', 'OPENED', 'SENT');

-- CreateEnum
CREATE TYPE "sukuux"."EmploymentEmploymentType" AS ENUM ('CONTRACT', 'PART_TIME', 'PERMANENT', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "sukuux"."EnrollmentEnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'TRANSFERRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "sukuux"."EntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "sukuux"."ExamExamType" AS ENUM ('END_OF_TERM', 'ENTRANCE', 'MID_TERM', 'MOCK');

-- CreateEnum
CREATE TYPE "sukuux"."ExamStatus" AS ENUM ('COMPLETED', 'DRAFT', 'IN_PROGRESS', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "sukuux"."ExitRecordExitType" AS ENUM ('DEATH', 'REDUNDANCY', 'RESIGNATION', 'RETIREMENT', 'TERMINATION');

-- CreateEnum
CREATE TYPE "sukuux"."FineStatus" AS ENUM ('PAID', 'PENDING', 'WAIVED');

-- CreateEnum
CREATE TYPE "sukuux"."GpaPolicyCalculationMethod" AS ENUM ('CREDIT_HOUR', 'UNWEIGHTED', 'WEIGHTED');

-- CreateEnum
CREATE TYPE "sukuux"."GraduationRequirementRequirementType" AS ENUM ('ATTENDANCE', 'CLEARANCE', 'MIN_CGPA', 'MIN_CREDITS', 'SUBJECT_PASS');

-- CreateEnum
CREATE TYPE "sukuux"."GraduationStatusStatus" AS ENUM ('DEFERRED', 'ELIGIBLE', 'GRADUATED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "sukuux"."GuardianRelationship" AS ENUM ('FATHER', 'GRANDPARENT', 'GUARDIAN', 'MOTHER', 'OTHER', 'SIBLING');

-- CreateEnum
CREATE TYPE "sukuux"."HolidayHolidayType" AS ENUM ('NATIONAL', 'PUBLIC', 'RELIGIOUS', 'SCHOOL');

-- CreateEnum
CREATE TYPE "sukuux"."HostelGender" AS ENUM ('FEMALE', 'MALE', 'MIXED');

-- CreateEnum
CREATE TYPE "sukuux"."IdentityDocumentDocumentType" AS ENUM ('BIRTH_CERT', 'GHANA_CARD', 'NHIS', 'PASSPORT');

-- CreateEnum
CREATE TYPE "sukuux"."InstanceStatus" AS ENUM ('APPROVED', 'CANCELLED', 'IN_PROGRESS', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "sukuux"."InterviewRecommendation" AS ENUM ('ADMIT', 'REJECT', 'WAITLIST');

-- CreateEnum
CREATE TYPE "sukuux"."InterviewStatus" AS ENUM ('CANCELLED', 'COMPLETED', 'NO_SHOW', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "sukuux"."InvigilatorRole" AS ENUM ('ASSISTANT', 'CHIEF', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "sukuux"."InvoiceStatus" AS ENUM ('CANCELLED', 'DRAFT', 'ISSUED', 'OVERDUE', 'PAID', 'PARTIAL', 'WAIVED');

-- CreateEnum
CREATE TYPE "sukuux"."IssueLogDeliveryMethod" AS ENUM ('COURIER', 'DIGITAL', 'EMAIL', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "sukuux"."JobQueueStatus" AS ENUM ('COMPLETED', 'FAILED', 'PROCESSING', 'QUEUED', 'RETRYING');

-- CreateEnum
CREATE TYPE "sukuux"."JournalJournalType" AS ENUM ('ADJUSTMENT', 'PAYMENT', 'PAYROLL', 'RECEIPT', 'REFUND');

-- CreateEnum
CREATE TYPE "sukuux"."LeaveApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "sukuux"."LeaveBalanceLeaveType" AS ENUM ('ANNUAL', 'OTHER', 'SICK', 'STUDY');

-- CreateEnum
CREATE TYPE "sukuux"."LeaveLeaveType" AS ENUM ('ANNUAL', 'COMPASSIONATE', 'MATERNITY', 'PATERNITY', 'SICK', 'STUDY');

-- CreateEnum
CREATE TYPE "sukuux"."LeaveStatus" AS ENUM ('APPROVED', 'CANCELLED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "sukuux"."LogEventType" AS ENUM ('ACCESS_DENIED', 'CREATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT', 'UPDATE');

-- CreateEnum
CREATE TYPE "sukuux"."MasteryState" AS ENUM ('ADVANCED', 'DEVELOPING', 'EMERGING', 'MASTERED');

-- CreateEnum
CREATE TYPE "sukuux"."MessageMessageType" AS ENUM ('ATTACHMENT', 'SYSTEM', 'TEXT');

-- CreateEnum
CREATE TYPE "sukuux"."MfaMethod" AS ENUM ('EMAIL', 'SMS', 'TOTP');

-- CreateEnum
CREATE TYPE "sukuux"."ModerationModerationType" AS ENUM ('DEDUCTION', 'FLAT_ADDITION', 'INDIVIDUAL', 'SCALE_FACTOR');

-- CreateEnum
CREATE TYPE "sukuux"."ModerationStatus" AS ENUM ('COMPLETE', 'IN_PROGRESS', 'PENDING');

-- CreateEnum
CREATE TYPE "sukuux"."OfferStatus" AS ENUM ('ACCEPTED', 'DECLINED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "sukuux"."ParticipantRole" AS ENUM ('INITIATOR', 'OBSERVER', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "sukuux"."PaymentPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CARD', 'CASH', 'CHEQUE', 'MOMO');

-- CreateEnum
CREATE TYPE "sukuux"."PaymentStatus" AS ENUM ('CONFIRMED', 'FAILED', 'PENDING', 'REVERSED');

-- CreateEnum
CREATE TYPE "sukuux"."PerformanceReviewOverallRating" AS ENUM ('EXCELLENT', 'GOOD', 'NEEDS_IMPROVEMENT', 'SATISFACTORY');

-- CreateEnum
CREATE TYPE "sukuux"."PeriodPeriodType" AS ENUM ('ASSEMBLY', 'BREAK', 'FREE', 'LESSON');

-- CreateEnum
CREATE TYPE "sukuux"."PeriodStatus" AS ENUM ('CLOSED', 'OPEN', 'PROCESSING');

-- CreateEnum
CREATE TYPE "sukuux"."PersonType" AS ENUM ('STAFF', 'STUDENT');

-- CreateEnum
CREATE TYPE "sukuux"."PurchaseOrderStatus" AS ENUM ('APPROVED', 'CANCELLED', 'DRAFT', 'RECEIVED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "sukuux"."PushSubscriptionPlatform" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- CreateEnum
CREATE TYPE "sukuux"."QualificationQualificationType" AS ENUM ('CERTIFICATE', 'DEGREE', 'DIPLOMA', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "sukuux"."QueueStatus" AS ENUM ('FAILED', 'PROCESSING', 'QUEUED', 'SENT');

-- CreateEnum
CREATE TYPE "sukuux"."QuizQuestionQuestionType" AS ENUM ('MCQ', 'SHORT_ANSWER', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "sukuux"."RefundRefundMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'MOMO');

-- CreateEnum
CREATE TYPE "sukuux"."RefundStatus" AS ENUM ('COMPLETED', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "sukuux"."RequestStatus" AS ENUM ('ISSUED', 'PENDING', 'PROCESSING', 'REJECTED');

-- CreateEnum
CREATE TYPE "sukuux"."RequirementRequirementType" AS ENUM ('AGE', 'DOCUMENT', 'EXAM', 'QUALIFICATION');

-- CreateEnum
CREATE TYPE "sukuux"."ResourceResourceType" AS ENUM ('FILE', 'IMAGE', 'LINK', 'VIDEO');

-- CreateEnum
CREATE TYPE "sukuux"."RevisionChangeType" AS ENUM ('ADDITION', 'DELETION', 'PERIOD_CHANGE', 'ROOM_CHANGE', 'TEACHER_CHANGE');

-- CreateEnum
CREATE TYPE "sukuux"."RoleCategory" AS ENUM ('ADMINISTRATIVE', 'MANAGEMENT', 'SUPPORT', 'TEACHING');

-- CreateEnum
CREATE TYPE "sukuux"."RoomRoomType" AS ENUM ('CLASSROOM', 'GYM', 'HALL', 'LABORATORY', 'LIBRARY', 'COMPUTER_LAB', 'STAFF_ROOM');

-- CreateEnum
CREATE TYPE "sukuux"."RunStatus" AS ENUM ('APPROVED', 'DRAFT', 'PAID', 'PENDING_APPROVAL', 'PROCESSING', 'REVERSED');

-- CreateEnum
CREATE TYPE "sukuux"."ScholarshipCoverageType" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "sukuux"."SchoolSchoolType" AS ENUM ('BASIC', 'COMBINED', 'JHS', 'SHS', 'TERTIARY');

-- CreateEnum
CREATE TYPE "sukuux"."ScriptStatus" AS ENUM ('MARKED', 'MODERATED', 'RETURNED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "sukuux"."SeverityLevel" AS ENUM ('CRITICAL', 'HIGH', 'LOW', 'MEDIUM');

-- CreateEnum
CREATE TYPE "sukuux"."StaffEmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "sukuux"."StudentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'SUSPENDED', 'TRANSFERRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "sukuux"."SubjectGroupGroupType" AS ENUM ('COMBINATION', 'CORE_GROUP', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "sukuux"."SubjectSubjectType" AS ENUM ('CORE', 'ELECTIVE', 'EXTRA_CURRICULAR');

-- CreateEnum
CREATE TYPE "sukuux"."SubscriptionBillingCycle" AS ENUM ('ANNUAL', 'MONTHLY');

-- CreateEnum
CREATE TYPE "sukuux"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'GRACE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "sukuux"."SubstitutionStatus" AS ENUM ('CANCELLED', 'COVERED', 'FREE_PERIOD');

-- CreateEnum
CREATE TYPE "sukuux"."TemplateChannel" AS ENUM ('EMAIL', 'IN_APP', 'PUSH', 'SMS');

-- CreateEnum
CREATE TYPE "sukuux"."TimezoneTimeFormat" AS ENUM ('TIME_12H', 'TIME_24H');

-- CreateEnum
CREATE TYPE "sukuux"."TopicDeliveryDeliveryStatus" AS ENUM ('DELIVERED', 'PARTIAL', 'PLANNED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "sukuux"."TrainingTrainingType" AS ENUM ('CONFERENCE', 'EXTERNAL', 'IN_HOUSE', 'ONLINE');

-- CreateEnum
CREATE TYPE "sukuux"."TransferTransferType" AS ENUM ('TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "sukuux"."TripLogTripType" AS ENUM ('AFTERNOON', 'FIELD_TRIP', 'MORNING', 'OTHER');

-- CreateEnum
CREATE TYPE "sukuux"."VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "sukuux"."VehicleVehicleType" AS ENUM ('BUS', 'CAR', 'MINIBUS', 'VAN');

-- CreateEnum
CREATE TYPE "sukuux"."VerificationVerificationMethod" AS ENUM ('API', 'MANUAL', 'QR_CODE', 'TOKEN');

-- CreateEnum
CREATE TYPE "sukuux"."WaitlistStatus" AS ENUM ('EXPIRED', 'OFFERED', 'WAITING', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "sukuux"."UserIdentityType" AS ENUM ('STUDENT', 'STAFF', 'PARENT', 'GUARDIAN', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "sukuux"."AuthLoginStatus" AS ENUM ('SUCCESS', 'FAILED', 'LOCKED');

-- CreateEnum
CREATE TYPE "sukuux"."ServiceRuntimeStatus" AS ENUM ('RUNNING', 'DEGRADED', 'STOPPED');

-- CreateEnum
CREATE TYPE "sukuux"."SchoolOwnershipType" AS ENUM ('PUBLIC', 'PRIVATE', 'MISSION', 'INTERNATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "sukuux"."SalaryComponentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "sukuux"."LoanStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DEFAULTED');

-- CreateTable
CREATE TABLE "system"."system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_log" (
    "id" TEXT NOT NULL,
    "event_type" "sukuux"."LogEventType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "user_id" TEXT,
    "school_id" TEXT,
    "ip_address" TEXT,
    "payload" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "is_verified" BOOLEAN NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "failed_login_count" INTEGER NOT NULL,
    "locked_until" TIMESTAMP(3),
    "must_reset_password" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "system_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL,
    "school_id" TEXT,
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "system_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_permission" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "system_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_role_permission" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL,
    "granted_by" TEXT,

    CONSTRAINT "system_role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_user_role" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "assigned_by" TEXT,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "system_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL,
    "invalidated_at" TIMESTAMP(3),

    CONSTRAINT "system_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_device" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_fingerprint" TEXT NOT NULL,
    "device_name" TEXT,
    "device_type" TEXT,
    "is_trusted" BOOLEAN NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_api_key" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "system_api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_login_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email_attempted" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "ip_address" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_password_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_mfa" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "method" "sukuux"."MfaMethod" NOT NULL,
    "secret" TEXT,
    "is_enabled" BOOLEAN NOT NULL,
    "backup_codes" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "system_mfa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_feature_flag" (
    "id" TEXT NOT NULL,
    "flag_key" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL,
    "school_id" TEXT,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "row_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "system_feature_flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_backup" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "backup_type" "sukuux"."BackupBackupType" NOT NULL,
    "status" "sukuux"."BackupStatus" NOT NULL,
    "file_size_bytes" BIGINT,
    "initiated_by" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "system_backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_job_queue" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" "sukuux"."JobQueueStatus" NOT NULL,
    "school_id" TEXT,
    "triggered_by" TEXT,
    "attempts" INTEGER NOT NULL,
    "max_attempts" INTEGER NOT NULL,
    "queued_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "system_job_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_webhook" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "last_triggered_at" TIMESTAMP(3),

    CONSTRAINT "system_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_audit_event" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "school_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before_state" TEXT,
    "after_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_notification_preference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "in_app" BOOLEAN NOT NULL,
    "sms" BOOLEAN NOT NULL,
    "email" BOOLEAN NOT NULL,
    "push" BOOLEAN NOT NULL,

    CONSTRAINT "system_notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_subscription" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "sukuux"."SubscriptionStatus" NOT NULL,
    "billing_cycle" "sukuux"."SubscriptionBillingCycle" NOT NULL,
    "paystack_subscription_code" TEXT,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "grace_period_end" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "system_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_tenant_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_students" INTEGER,
    "max_staff" INTEGER,
    "max_campuses" INTEGER NOT NULL,
    "monthly_price_ghs" DECIMAL(65,30) NOT NULL,
    "annual_price_ghs" DECIMAL(65,30) NOT NULL,
    "sms_quota" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "system_tenant_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_school" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "code" TEXT NOT NULL,
    "school_type" "sukuux"."SchoolSchoolType" NOT NULL,
    "registration_number" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "ownership_type" "sukuux"."SchoolOwnershipType",
    "founding_date" TEXT,
    "founder_name" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_school_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_campus" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "is_primary" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "school_campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_department" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "head_id" TEXT,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "school_department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_branding" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "motto" TEXT,
    "crest_url" TEXT,
    "banner_url" TEXT,
    "report_header_url" TEXT,
    "signature_url" TEXT,

    CONSTRAINT "school_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_contact" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "contact_type" "sukuux"."ContactContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "is_primary" BOOLEAN NOT NULL,

    CONSTRAINT "school_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_settings" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_subscription" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "status" "sukuux"."SubscriptionStatus" NOT NULL,
    "next_billing_date" TIMESTAMP(3) NOT NULL,
    "amount_ghs" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "school_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_term_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "terms_per_year" INTEGER NOT NULL,
    "term_names" TEXT NOT NULL,
    "min_weeks_per_term" INTEGER,

    CONSTRAINT "school_term_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_grading_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "policy_name" TEXT NOT NULL,
    "pass_mark" DECIMAL(65,30) NOT NULL,
    "ca_weight" DECIMAL(65,30) NOT NULL,
    "exam_weight" DECIMAL(65,30) NOT NULL,
    "uses_gpa" BOOLEAN NOT NULL,
    "gpa_scale" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "school_grading_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_calendar" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_type" "sukuux"."CalendarEventType" NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "is_blackout" BOOLEAN NOT NULL,

    CONSTRAINT "school_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_holiday" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL,
    "holiday_type" "sukuux"."HolidayHolidayType" NOT NULL,

    CONSTRAINT "school_holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_configuration" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "config_group" TEXT NOT NULL,
    "config_data" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_onboarding" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "is_complete" BOOLEAN NOT NULL,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,

    CONSTRAINT "school_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_document" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "issue_date" TEXT,
    "expiry_date" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_fee_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "max_advance_terms" INTEGER NOT NULL,
    "late_payment_penalty_pct" DECIMAL(65,30),
    "grace_days" INTEGER NOT NULL,
    "allow_partial_payment" BOOLEAN NOT NULL,

    CONSTRAINT "school_fee_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_attendance_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "min_attendance_pct" DECIMAL(65,30) NOT NULL,
    "attendance_method" "sukuux"."AttendancePolicyAttendanceMethod" NOT NULL,
    "notify_parent_after_absences" INTEGER NOT NULL,

    CONSTRAINT "school_attendance_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_currency" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL,
    "currency_symbol" TEXT NOT NULL,
    "decimal_places" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,

    CONSTRAINT "school_currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_timezone" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "date_format" TEXT NOT NULL,
    "time_format" "sukuux"."TimezoneTimeFormat" NOT NULL,

    CONSTRAINT "school_timezone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_academic_year" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academics_academic_year_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_term" (
    "id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "term_order" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "academics_term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_class" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "academics_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_stream" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "academics_stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_subject" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "department_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subject_type" "sukuux"."SubjectSubjectType" NOT NULL,
    "credit_hours" INTEGER,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "academics_subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_department" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "head_id" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_subject_assignment" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_subject_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_class_subject" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "is_compulsory" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_class_subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_stream_subject" (
    "id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "is_compulsory" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_stream_subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_subject_group" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group_type" "sukuux"."SubjectGroupGroupType" NOT NULL,
    "max_selections" INTEGER,
    "min_selections" INTEGER,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_subject_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_curriculum" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_curriculum_topic" (
    "id" TEXT NOT NULL,
    "curriculum_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic_order" INTEGER NOT NULL,
    "week_start" INTEGER,
    "week_end" INTEGER,
    "description" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_curriculum_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_curriculum_objective" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "objective_order" INTEGER NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_curriculum_objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_learning_outcome" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "strand" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_learning_outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_promotion_rule" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "from_class_id" TEXT NOT NULL,
    "to_class_id" TEXT NOT NULL,
    "min_gpa" DECIMAL(65,30),
    "min_attendance_pct" DECIMAL(65,30),
    "max_failed_subjects" INTEGER,
    "requires_manual_approval" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_promotion_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."academics_class_teacher_assignment" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "staff_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "academics_class_teacher_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_applicant" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "admission_batch_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "gender" "sukuux"."ApplicantGender" NOT NULL,
    "date_of_birth" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "applying_for_class_id" TEXT NOT NULL,
    "guardian_name" TEXT NOT NULL,
    "guardian_phone" TEXT NOT NULL,
    "status" "sukuux"."ApplicantStatus" NOT NULL,
    "applied_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_interview" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(65,30),
    "max_score" DECIMAL(65,30) NOT NULL,
    "remarks" TEXT,
    "recommendation" "sukuux"."InterviewRecommendation",
    "status" "sukuux"."InterviewStatus" NOT NULL,

    CONSTRAINT "admission_interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_offer" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "academic_year_id" TEXT NOT NULL,
    "status" "sukuux"."OfferStatus" NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "accepted_date" TIMESTAMP(3),

    CONSTRAINT "admission_offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_application_stage" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "status" "sukuux"."ApplicationStageStatus" NOT NULL,
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "admission_application_stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_application_document" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL,
    "verified_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_application_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_application_review" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "reviewed_by" TEXT NOT NULL,
    "review_date" TIMESTAMP(3) NOT NULL,
    "decision" "sukuux"."ApplicationReviewDecision" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "admission_application_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_status_history" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "from_status" TEXT NOT NULL,
    "to_status" TEXT NOT NULL,
    "changed_by" TEXT,
    "change_reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_decision" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "decision" "sukuux"."InterviewRecommendation" NOT NULL,
    "decided_by" TEXT NOT NULL,
    "decision_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "aggregate_score" DECIMAL(65,30),

    CONSTRAINT "admission_decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_batch" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "open_date" TEXT NOT NULL,
    "close_date" TEXT NOT NULL,
    "target_enrolment" INTEGER,
    "status" "sukuux"."BatchStatus" NOT NULL,

    CONSTRAINT "admission_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_waitlist" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL,
    "status" "sukuux"."WaitlistStatus" NOT NULL,

    CONSTRAINT "admission_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."admission_requirement" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "batch_id" TEXT,
    "requirement_type" "sukuux"."RequirementRequirementType" NOT NULL,
    "description" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "admission_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_student" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "gender" "sukuux"."ApplicantGender" NOT NULL,
    "date_of_birth" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "photo_url" TEXT,
    "status" "sukuux"."StudentStatus" NOT NULL,
    "admission_date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_guardian" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "relationship" "sukuux"."GuardianRelationship" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "occupation" TEXT,
    "is_primary" BOOLEAN NOT NULL,
    "is_financial_responsible" BOOLEAN NOT NULL,
    "has_portal_access" BOOLEAN NOT NULL,
    "custody_notes" TEXT,
    "user_id" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "students_guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_enrollment" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "admission_date" TEXT NOT NULL,
    "enrollment_status" "sukuux"."EnrollmentEnrollmentStatus" NOT NULL,
    "roll_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_medical" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "blood_group" TEXT,
    "allergies" TEXT,
    "chronic_conditions" TEXT,
    "current_medications" TEXT,
    "emergency_contact_name" TEXT NOT NULL,
    "emergency_contact_phone" TEXT NOT NULL,
    "emergency_contact_relationship" TEXT NOT NULL,
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_medical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_document" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL,
    "uploaded_by" TEXT NOT NULL,

    CONSTRAINT "students_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_status_history" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_status" TEXT NOT NULL,
    "to_status" TEXT NOT NULL,
    "reason" TEXT,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_transfer" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "transfer_type" "sukuux"."TransferTransferType" NOT NULL,
    "from_school" TEXT,
    "to_school" TEXT,
    "transfer_date" TEXT NOT NULL,
    "reason" TEXT,
    "transfer_letter_url" TEXT,

    CONSTRAINT "students_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_graduation" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "graduation_date" TEXT NOT NULL,
    "final_class_id" TEXT NOT NULL,
    "final_gpa" DECIMAL(65,30),
    "honours" TEXT,
    "certificate_url" TEXT,

    CONSTRAINT "students_graduation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_address" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "address_type" "sukuux"."AddressAddressType" NOT NULL,
    "street" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "digital_address" TEXT,
    "is_primary" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "students_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_contact" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "contact_type" "sukuux"."ContactContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "students_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_identity_document" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "document_type" "sukuux"."IdentityDocumentDocumentType" NOT NULL,
    "document_number" TEXT NOT NULL,
    "issue_date" TEXT,
    "expiry_date" TEXT,
    "verified" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "students_identity_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_health_incident" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "action_taken" TEXT,
    "parent_notified" BOOLEAN NOT NULL,
    "recorded_by" TEXT NOT NULL,

    CONSTRAINT "students_health_incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_behavior_profile" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "record_type" "sukuux"."BehaviorProfileRecordType" NOT NULL,
    "description" TEXT NOT NULL,
    "action_taken" TEXT,
    "recorded_by" TEXT NOT NULL,
    "incident_date" TEXT NOT NULL,
    "parent_notified" BOOLEAN NOT NULL,

    CONSTRAINT "students_behavior_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_attendance_summary" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "total_school_days" INTEGER NOT NULL,
    "days_present" INTEGER NOT NULL,
    "days_absent" INTEGER NOT NULL,
    "days_late" INTEGER NOT NULL,
    "attendance_pct" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "students_attendance_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_fee_profile" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_structure_id" TEXT NOT NULL,
    "scholarship_id" TEXT,
    "discount_id" TEXT,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "students_fee_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_portal_access" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL,
    "enabled_at" TIMESTAMP(3),
    "last_access_at" TIMESTAMP(3),

    CONSTRAINT "students_portal_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_notes" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "category" TEXT,
    "is_confidential" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_tag" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "tagged_by" TEXT NOT NULL,
    "tagged_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "students_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_scholarship" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "scholarship_name" TEXT NOT NULL,
    "sponsor" TEXT,
    "coverage_type" "sukuux"."ScholarshipCoverageType" NOT NULL,
    "coverage_pct" DECIMAL(65,30),
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "students_scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_house" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "house_name" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "is_current" BOOLEAN NOT NULL,

    CONSTRAINT "students_house_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."students_transport_assignment" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "pickup_point" TEXT NOT NULL,
    "dropoff_point" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_transport_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_staff" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "user_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "gender" "sukuux"."ApplicantGender" NOT NULL,
    "date_of_birth" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "photo_url" TEXT,
    "ssnit_id" TEXT,
    "tax_identification_number" TEXT,
    "employment_status" "sukuux"."StaffEmploymentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_employment" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "department_id" TEXT,
    "employment_type" "sukuux"."EmploymentEmploymentType" NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "is_current" BOOLEAN NOT NULL,

    CONSTRAINT "staff_employment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_role" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "sukuux"."RoleCategory" NOT NULL,
    "description" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "staff_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_leave" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "leave_type" "sukuux"."LeaveLeaveType" NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "days_requested" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "sukuux"."LeaveStatus" NOT NULL,

    CONSTRAINT "staff_leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_attendance" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "sukuux"."AttendanceStatus" NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_bank_details" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_type" "sukuux"."BankDetailsAccountType" NOT NULL,
    "mobile_money_number" TEXT,
    "is_primary" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "staff_bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_emergency_contact" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "staff_emergency_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_qualification" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "qualification_type" "sukuux"."QualificationQualificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "year_obtained" INTEGER NOT NULL,
    "is_verified" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "staff_qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_compliance" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "compliance_type" TEXT NOT NULL,
    "status" "sukuux"."ComplianceStatus" NOT NULL,
    "issue_date" TEXT,
    "expiry_date" TEXT,
    "document_url" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "staff_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_subject_assignment" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "staff_subject_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_department_assignment" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "role_in_department" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "is_current" BOOLEAN NOT NULL,

    CONSTRAINT "staff_department_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_contract" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "contract_type" "sukuux"."ContractContractType" NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "salary_agreed" DECIMAL(65,30) NOT NULL,
    "probation_end_date" TEXT,
    "status" "sukuux"."ContractStatus" NOT NULL,

    CONSTRAINT "staff_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_disciplinary_record" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "incident_date" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "recorded_by" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_disciplinary_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_performance_review" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "review_period" TEXT NOT NULL,
    "overall_rating" "sukuux"."PerformanceReviewOverallRating" NOT NULL,
    "comments" TEXT,
    "review_date" TEXT NOT NULL,
    "staff_acknowledged" BOOLEAN NOT NULL,

    CONSTRAINT "staff_performance_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_training" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "training_name" TEXT NOT NULL,
    "provider" TEXT,
    "training_type" "sukuux"."TrainingTrainingType" NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "cost" DECIMAL(65,30),

    CONSTRAINT "staff_training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_leave_balance" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "leave_type" "sukuux"."LeaveBalanceLeaveType" NOT NULL,
    "year" INTEGER NOT NULL,
    "entitlement_days" INTEGER NOT NULL,
    "used_days" INTEGER NOT NULL,
    "remaining_days" INTEGER NOT NULL,

    CONSTRAINT "staff_leave_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_leave_approval" (
    "id" TEXT NOT NULL,
    "leave_id" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "decision" "sukuux"."LeaveApprovalDecision" NOT NULL,
    "decision_date" TIMESTAMP(3) NOT NULL,
    "comments" TEXT,

    CONSTRAINT "staff_leave_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_exit_record" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "exit_type" "sukuux"."ExitRecordExitType" NOT NULL,
    "exit_date" TEXT NOT NULL,
    "notice_given" BOOLEAN NOT NULL,
    "reason" TEXT,
    "clearance_complete" BOOLEAN NOT NULL,

    CONSTRAINT "staff_exit_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_room" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "campus_id" TEXT,
    "building" TEXT,
    "room_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "room_type" "sukuux"."RoomRoomType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "schedule_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_period" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "period_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "period_type" "sukuux"."PeriodPeriodType" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "schedule_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_day" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "day_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_school_day" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "schedule_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_timetable" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "schedule_timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_teacher_schedule" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,

    CONSTRAINT "schedule_teacher_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_room_schedule" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,

    CONSTRAINT "schedule_room_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_calendar_event" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "event_type" "sukuux"."CalendarEventEventType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "is_blackout" BOOLEAN NOT NULL,
    "visible_to_parents" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "schedule_calendar_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_lock" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "locked_by" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL,
    "unlock_reason" TEXT,
    "unlocked_by" TEXT,

    CONSTRAINT "schedule_lock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_conflict" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "conflict_type" "sukuux"."ConflictConflictType" NOT NULL,
    "timetable_entry_1" TEXT NOT NULL,
    "timetable_entry_2" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL,
    "resolved" BOOLEAN NOT NULL,

    CONSTRAINT "schedule_conflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_substitution" (
    "id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "original_teacher_id" TEXT NOT NULL,
    "substitute_teacher_id" TEXT,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "status" "sukuux"."SubstitutionStatus" NOT NULL,

    CONSTRAINT "schedule_substitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_template" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_from_term_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "schedule_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_revision" (
    "id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "change_type" "sukuux"."RevisionChangeType" NOT NULL,
    "before_state" TEXT NOT NULL,
    "after_state" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "change_reason" TEXT,

    CONSTRAINT "schedule_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."schedule_exam_slot" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "invigilator_id" TEXT,
    "exam_date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "schedule_exam_slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_assessment" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "term_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assessment_type" "sukuux"."AssessmentAssessmentType" NOT NULL,
    "max_score" DECIMAL(65,30) NOT NULL,
    "weightage" DECIMAL(65,30) NOT NULL,
    "assessment_date" TEXT,
    "status" "sukuux"."AssessmentStatus" NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "grading_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_score" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "score" DECIMAL(65,30),
    "is_absent" BOOLEAN NOT NULL,
    "is_excused" BOOLEAN NOT NULL,
    "remarks" TEXT,
    "entered_by" TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "grading_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_scale" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "scale_name" TEXT NOT NULL,
    "min_score" DECIMAL(65,30) NOT NULL,
    "max_score" DECIMAL(65,30) NOT NULL,
    "grade" TEXT NOT NULL,
    "grade_point" DECIMAL(65,30),
    "description" TEXT,
    "is_passing" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "grading_scale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_result" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "total_score" DECIMAL(65,30),
    "aggregate_score" INTEGER,
    "gpa" DECIMAL(65,30),
    "cgpa" DECIMAL(65,30),
    "position" INTEGER,
    "stream_position" INTEGER,
    "remarks" TEXT,
    "is_published" BOOLEAN NOT NULL,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "grading_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_component" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "weight_pct" DECIMAL(65,30) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "grading_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "ca_weight_pct" DECIMAL(65,30) NOT NULL,
    "exam_weight_pct" DECIMAL(65,30) NOT NULL,
    "pass_mark" DECIMAL(65,30) NOT NULL,
    "grading_scale_id" TEXT NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "grading_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_remark" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "class_teacher_remark" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "grading_remark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_approval" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "approval_level" "sukuux"."ApprovalApprovalLevel" NOT NULL,
    "status" "sukuux"."ApprovalStatus" NOT NULL,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "grading_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_publication" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "published_by" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "visible_to_students" BOOLEAN NOT NULL,
    "visible_to_parents" BOOLEAN NOT NULL,

    CONSTRAINT "grading_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_rank" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_rank" INTEGER NOT NULL,
    "stream_rank" INTEGER,
    "class_size" INTEGER NOT NULL,
    "aggregate_score" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "grading_rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_moderation" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "moderated_by" TEXT NOT NULL,
    "moderation_type" "sukuux"."ModerationModerationType" NOT NULL,
    "moderation_value" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_moderation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_lock" (
    "id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "locked_by" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_lock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_history" (
    "id" TEXT NOT NULL,
    "score_id" TEXT NOT NULL,
    "previous_score" DECIMAL(65,30),
    "new_score" DECIMAL(65,30),
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_subject_result" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "ca_score" DECIMAL(65,30),
    "exam_score" DECIMAL(65,30),
    "total_score" DECIMAL(65,30),
    "grade" TEXT,
    "grade_point" DECIMAL(65,30),
    "position" INTEGER,
    "class_size" INTEGER,
    "remark" TEXT,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "grading_subject_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."grading_report" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT,
    "class_id" TEXT,
    "term_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" TEXT NOT NULL,

    CONSTRAINT "grading_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_record" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "gpa" DECIMAL(65,30) NOT NULL,
    "cgpa" DECIMAL(65,30) NOT NULL,
    "is_locked" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcript_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_course_record" (
    "id" TEXT NOT NULL,
    "transcript_record_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "grade" TEXT NOT NULL,
    "grade_point" DECIMAL(65,30) NOT NULL,
    "credit_hours" INTEGER NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "transcript_course_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_gpa_summary" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "term_gpa" DECIMAL(65,30) NOT NULL,
    "cumulative_gpa" DECIMAL(65,30) NOT NULL,
    "total_credits_attempted" INTEGER NOT NULL,
    "total_credits_earned" INTEGER NOT NULL,

    CONSTRAINT "transcript_gpa_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_graduation_status" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "status" "sukuux"."GraduationStatusStatus" NOT NULL,
    "graduation_date" TEXT,
    "final_cgpa" DECIMAL(65,30),
    "honours" TEXT,
    "awarded_by" TEXT,

    CONSTRAINT "transcript_graduation_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_request" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "recipient_institution" TEXT,
    "copies_requested" INTEGER NOT NULL,
    "status" "sukuux"."RequestStatus" NOT NULL,
    "fee_paid" BOOLEAN NOT NULL,

    CONSTRAINT "transcript_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_issue_log" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL,
    "delivery_method" "sukuux"."IssueLogDeliveryMethod" NOT NULL,
    "recipient_name" TEXT,
    "tracking_reference" TEXT,

    CONSTRAINT "transcript_issue_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_verification" (
    "id" TEXT NOT NULL,
    "transcript_id" TEXT NOT NULL,
    "verification_method" "sukuux"."VerificationVerificationMethod" NOT NULL,
    "verifying_institution" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3) NOT NULL,
    "is_authentic" BOOLEAN NOT NULL,

    CONSTRAINT "transcript_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_template" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout_config" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "transcript_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_grade_scale" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_score" DECIMAL(65,30) NOT NULL,
    "max_score" DECIMAL(65,30) NOT NULL,
    "grade" TEXT NOT NULL,
    "grade_point" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "transcript_grade_scale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_academic_standing" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "standing" "sukuux"."AcademicStandingStanding" NOT NULL,
    "remarks" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcript_academic_standing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_transfer_credit" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_institution" TEXT NOT NULL,
    "subject_name" TEXT NOT NULL,
    "equivalent_subject_id" TEXT,
    "credit_hours" INTEGER NOT NULL,
    "grade_obtained" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,

    CONSTRAINT "transcript_transfer_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_lock" (
    "id" TEXT NOT NULL,
    "transcript_id" TEXT NOT NULL,
    "locked_by" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "transcript_lock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_signature" (
    "id" TEXT NOT NULL,
    "transcript_id" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signer_position" TEXT NOT NULL,
    "signature_url" TEXT,
    "signed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcript_signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_version" (
    "id" TEXT NOT NULL,
    "transcript_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_notes" TEXT,

    CONSTRAINT "transcript_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_gpa_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calculation_method" "sukuux"."GpaPolicyCalculationMethod" NOT NULL,
    "scale_max" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "transcript_gpa_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_graduation_requirement" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "requirement_type" "sukuux"."GraduationRequirementRequirementType" NOT NULL,
    "description" TEXT NOT NULL,
    "threshold_value" DECIMAL(65,30),

    CONSTRAINT "transcript_graduation_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transcript_access_log" (
    "id" TEXT NOT NULL,
    "transcript_id" TEXT NOT NULL,
    "accessed_by" TEXT,
    "access_method" "sukuux"."AccessLogAccessMethod" NOT NULL,
    "ip_address" TEXT,
    "accessed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcript_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_account" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_type" "sukuux"."AccountAccountType" NOT NULL,
    "parent_account_id" TEXT,
    "current_balance" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "finance_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_transaction" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "transaction_type" "sukuux"."EntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "transaction_date" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "finance_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_invoice" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "amount_paid" DECIMAL(65,30) NOT NULL,
    "balance_due" DECIMAL(65,30) NOT NULL,
    "due_date" TEXT NOT NULL,
    "status" "sukuux"."InvoiceStatus" NOT NULL,

    CONSTRAINT "finance_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_payment" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_method" "sukuux"."PaymentPaymentMethod" NOT NULL,
    "paystack_reference" TEXT,
    "paid_date" TIMESTAMP(3) NOT NULL,
    "received_by" TEXT,
    "status" "sukuux"."PaymentStatus" NOT NULL,

    CONSTRAINT "finance_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_budget" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "department_id" TEXT,
    "financial_year_id" TEXT NOT NULL,
    "budget_name" TEXT NOT NULL,
    "budgeted_amount" DECIMAL(65,30) NOT NULL,
    "spent_amount" DECIMAL(65,30) NOT NULL,
    "remaining_amount" DECIMAL(65,30) NOT NULL,
    "status" "sukuux"."BudgetStatus" NOT NULL,

    CONSTRAINT "finance_budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_fee_structure" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "due_date" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "finance_fee_structure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_fee_component" (
    "id" TEXT NOT NULL,
    "fee_structure_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "is_compulsory" BOOLEAN NOT NULL,
    "account_id" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "finance_fee_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_fee_assignment" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_structure_id" TEXT NOT NULL,
    "override_amount" DECIMAL(65,30),
    "assignment_reason" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "finance_fee_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_invoice_item" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "fee_component_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "is_adjustment" BOOLEAN NOT NULL,

    CONSTRAINT "finance_invoice_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_receipt" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "issued_to" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "pdf_url" TEXT,

    CONSTRAINT "finance_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_refund" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "refund_method" "sukuux"."RefundRefundMethod" NOT NULL,
    "processed_by" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "status" "sukuux"."RefundStatus" NOT NULL,

    CONSTRAINT "finance_refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_discount" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discount_type" "sukuux"."DiscountDiscountType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "applicable_to" "sukuux"."DiscountApplicableTo" NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "finance_discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_scholarship" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sponsor" TEXT,
    "coverage_type" "sukuux"."ScholarshipCoverageType" NOT NULL,
    "coverage_pct" DECIMAL(65,30),
    "max_beneficiaries" INTEGER,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "finance_scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_ledger_entry" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "journal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "entry_type" "sukuux"."EntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "finance_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_journal" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "journal_type" "sukuux"."JournalJournalType" NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "journal_date" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "is_posted" BOOLEAN NOT NULL,

    CONSTRAINT "finance_journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_expense" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "budget_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "expense_date" TEXT NOT NULL,
    "receipt_url" TEXT,
    "approved_by" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "finance_expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_bank_reconciliation" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "period_start" TEXT NOT NULL,
    "period_end" TEXT NOT NULL,
    "statement_balance" DECIMAL(65,30) NOT NULL,
    "book_balance" DECIMAL(65,30) NOT NULL,
    "difference" DECIMAL(65,30) NOT NULL,
    "is_reconciled" BOOLEAN NOT NULL,
    "reconciled_by" TEXT,

    CONSTRAINT "finance_bank_reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_financial_year" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "is_closed" BOOLEAN NOT NULL,

    CONSTRAINT "finance_financial_year_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."finance_audit" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "finance_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_salary" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "structure_id" TEXT,
    "base_salary" DECIMAL(65,30) NOT NULL,
    "effective_from" TEXT NOT NULL,
    "effective_to" TEXT,
    "is_current" BOOLEAN NOT NULL,
    "approved_by" TEXT,

    CONSTRAINT "payroll_salary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_run" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "status" "sukuux"."RunStatus" NOT NULL,
    "total_gross" DECIMAL(65,30) NOT NULL,
    "total_deductions" DECIMAL(65,30) NOT NULL,
    "total_net" DECIMAL(65,30) NOT NULL,
    "staff_count" INTEGER NOT NULL,
    "run_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "run_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_payslip" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "gross_salary" DECIMAL(65,30) NOT NULL,
    "total_allowances" DECIMAL(65,30) NOT NULL,
    "total_deductions" DECIMAL(65,30) NOT NULL,
    "net_salary" DECIMAL(65,30) NOT NULL,
    "ssnit_employee" DECIMAL(65,30) NOT NULL,
    "ssnit_employer" DECIMAL(65,30) NOT NULL,
    "income_tax" DECIMAL(65,30) NOT NULL,
    "pdf_url" TEXT,
    "is_paid" BOOLEAN NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payroll_payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_deduction" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "deduction_type" "sukuux"."DeductionDeductionType" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(65,30),
    "percentage" DECIMAL(65,30),
    "is_recurring" BOOLEAN NOT NULL,
    "effective_from" TEXT NOT NULL,
    "effective_to" TEXT,

    CONSTRAINT "payroll_deduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_bonus" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "bonus_type" "sukuux"."BonusBonusType" NOT NULL,
    "reason" TEXT,
    "date_awarded" TEXT NOT NULL,
    "included_in_run_id" TEXT,
    "approved_by" TEXT NOT NULL,

    CONSTRAINT "payroll_bonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_history" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "payslip_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "gross_salary" DECIMAL(65,30) NOT NULL,
    "net_salary" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_tax_rule" (
    "id" TEXT NOT NULL,
    "effective_year" INTEGER NOT NULL,
    "band_label" TEXT NOT NULL,
    "income_from" DECIMAL(65,30) NOT NULL,
    "income_to" DECIMAL(65,30),
    "rate_pct" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "payroll_tax_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_ssnit_rule" (
    "id" TEXT NOT NULL,
    "effective_from" TEXT NOT NULL,
    "employee_rate_pct" DECIMAL(65,30) NOT NULL,
    "employer_rate_pct" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "payroll_ssnit_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_allowance" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "allowance_type" "sukuux"."AllowanceAllowanceType" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "is_taxable" BOOLEAN NOT NULL,
    "effective_from" TEXT NOT NULL,
    "effective_to" TEXT,

    CONSTRAINT "payroll_allowance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_period" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "status" "sukuux"."PeriodStatus" NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "payroll_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "is_read" BOOLEAN NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_template" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "event_type" TEXT NOT NULL,
    "channel" "sukuux"."TemplateChannel" NOT NULL,
    "subject" TEXT,
    "body_template" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_delivery" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "channel" "sukuux"."TemplateChannel" NOT NULL,
    "status" "sukuux"."DeliveryStatus" NOT NULL,
    "provider_reference" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_channel" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "channel" "sukuux"."ChannelChannel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL,
    "config" TEXT,

    CONSTRAINT "notification_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_preference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "in_app" BOOLEAN NOT NULL,
    "sms" BOOLEAN NOT NULL,
    "email" BOOLEAN NOT NULL,
    "push" BOOLEAN NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_queue" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "sukuux"."QueueStatus" NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_retry" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL,
    "error_message" TEXT,
    "next_retry_at" TIMESTAMP(3),

    CONSTRAINT "notification_retry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_push_subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_token" TEXT NOT NULL,
    "platform" "sukuux"."PushSubscriptionPlatform" NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "subscribed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_push_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_sms_log" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "recipient_phone" TEXT NOT NULL,
    "message_body" TEXT NOT NULL,
    "twilio_sid" TEXT,
    "twilio_status" TEXT,
    "segments" INTEGER,
    "sent_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_sms_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."notification_email_log" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "resend_id" TEXT,
    "status" "sukuux"."EmailLogStatus" NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "opened_at" TIMESTAMP(3),

    CONSTRAINT "notification_email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."communication_message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message_type" "sukuux"."MessageMessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "is_edited" BOOLEAN NOT NULL,
    "edited_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."communication_conversation" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject" TEXT,
    "conversation_type" "sukuux"."ConversationConversationType" NOT NULL,
    "created_by" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."communication_attachment" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."communication_read" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_read_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."communication_participant" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "sukuux"."ParticipantRole" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "muted" BOOLEAN NOT NULL,

    CONSTRAINT "communication_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."communication_broadcast" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience_type" "sukuux"."BroadcastAudienceType" NOT NULL,
    "class_id" TEXT,
    "sent_by" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "delivery_count" INTEGER NOT NULL,

    CONSTRAINT "communication_broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."communication_delivery" (
    "id" TEXT NOT NULL,
    "broadcast_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "status" "sukuux"."DeliveryStatus" NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),

    CONSTRAINT "communication_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."attendance_session" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "session_date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "attendance_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."attendance_student" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by" TEXT NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "attendance_student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."attendance_staff" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "attendance_date" TEXT NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."attendance_device" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "ip_address" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."attendance_event" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "person_type" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "event_type" TEXT NOT NULL,

    CONSTRAINT "attendance_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."attendance_exception" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exception_type" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "attendance_exception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."attendance_summary" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "total_sessions" INTEGER NOT NULL,
    "present_count" INTEGER NOT NULL,
    "absent_count" INTEGER NOT NULL,
    "late_count" INTEGER NOT NULL,
    "attendance_percentage" DECIMAL(65,30) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."attendance_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "policy_name" TEXT NOT NULL,
    "minimum_attendance_percentage" DECIMAL(65,30) NOT NULL,
    "late_threshold_minutes" INTEGER NOT NULL,
    "auto_absent_threshold" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "attendance_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_exam" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exam_type" "sukuux"."ExamExamType" NOT NULL,
    "term_id" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "status" "sukuux"."ExamStatus" NOT NULL,

    CONSTRAINT "exam_exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_subject_paper" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "paper_code" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "total_marks" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "exam_subject_paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_schedule" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,

    CONSTRAINT "exam_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_room" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "location" TEXT,

    CONSTRAINT "exam_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_seating_plan" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "seat_number" TEXT NOT NULL,
    "row_position" INTEGER NOT NULL,
    "column_position" INTEGER NOT NULL,

    CONSTRAINT "exam_seating_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_invigilator" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "role" "sukuux"."InvigilatorRole" NOT NULL,

    CONSTRAINT "exam_invigilator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_script" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "script_code" TEXT NOT NULL,
    "status" "sukuux"."ScriptStatus" NOT NULL,

    CONSTRAINT "exam_script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_moderation" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "moderator_id" TEXT NOT NULL,
    "status" "sukuux"."ModerationStatus" NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "exam_moderation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."exam_malpractice" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "decision" TEXT NOT NULL,

    CONSTRAINT "exam_malpractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_course" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "academic_year_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "learn_course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_lesson_plan" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "objectives" TEXT,
    "lesson_date" TEXT NOT NULL,
    "duration_minutes" INTEGER,
    "notes" TEXT,

    CONSTRAINT "learn_lesson_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_topic_delivery" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "lesson_plan_id" TEXT NOT NULL,
    "curriculum_topic_id" TEXT NOT NULL,
    "delivery_status" "sukuux"."TopicDeliveryDeliveryStatus" NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "teacher_notes" TEXT,

    CONSTRAINT "learn_topic_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_assignment" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "due_date" TEXT NOT NULL,
    "max_score" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "learn_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_homework_return" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "returned" BOOLEAN NOT NULL,
    "return_date" TEXT,
    "teacher_comment" TEXT,
    "marked_by" TEXT NOT NULL,
    "marked_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learn_homework_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_submission" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "submission_file" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(65,30),
    "feedback" TEXT,

    CONSTRAINT "learn_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_student_mastery" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "curriculum_topic_id" TEXT NOT NULL,
    "mastery_state" "sukuux"."MasteryState" NOT NULL,
    "last_assessment_score" DECIMAL(65,30),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "flagged_for_sukuu_kids" BOOLEAN NOT NULL,

    CONSTRAINT "learn_student_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_quiz" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "time_limit" INTEGER,
    "attempt_limit" INTEGER NOT NULL,

    CONSTRAINT "learn_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_quiz_question" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" "sukuux"."QuizQuestionQuestionType" NOT NULL,
    "marks" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "learn_quiz_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_quiz_attempt" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "score" DECIMAL(65,30),
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "learn_quiz_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_classroom_observation" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "lesson_plan_id" TEXT NOT NULL,
    "observer_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "observation_date" TEXT NOT NULL,
    "rating" "sukuux"."PerformanceReviewOverallRating" NOT NULL,
    "strengths" TEXT,
    "areas_for_improvement" TEXT,
    "feedback_shared" BOOLEAN NOT NULL,

    CONSTRAINT "learn_classroom_observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_reading_record" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "reading_level" TEXT NOT NULL,
    "book_title" TEXT,
    "completed" BOOLEAN NOT NULL,
    "assessment_notes" TEXT,
    "recorded_date" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,

    CONSTRAINT "learn_reading_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."learn_resource" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resource_type" "sukuux"."ResourceResourceType" NOT NULL,
    "file_url" TEXT,
    "external_url" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learn_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."discipline_incident" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "reported_by" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "severity" "sukuux"."SeverityLevel" NOT NULL,
    "description" TEXT NOT NULL,
    "incident_date" TEXT NOT NULL,

    CONSTRAINT "discipline_incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."discipline_action" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "status" "sukuux"."ActionStatus" NOT NULL,

    CONSTRAINT "discipline_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."discipline_suspension" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "parent_notified" BOOLEAN NOT NULL,

    CONSTRAINT "discipline_suspension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."discipline_commendation" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "commendation_type" TEXT NOT NULL,
    "awarded_by" TEXT NOT NULL,
    "award_date" TEXT NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "discipline_commendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."discipline_behavior_score" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "risk_level" "sukuux"."SeverityLevel" NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discipline_behavior_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."hostel_hostel" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "sukuux"."HostelGender" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "hostel_hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."hostel_dormitory" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "hostel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "hostel_dormitory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."hostel_bed" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "dormitory_id" TEXT NOT NULL,
    "bed_number" TEXT NOT NULL,
    "status" "sukuux"."BedStatus" NOT NULL,

    CONSTRAINT "hostel_bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."hostel_assignment" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "bed_id" TEXT NOT NULL,
    "assigned_date" TEXT NOT NULL,
    "vacated_date" TEXT,

    CONSTRAINT "hostel_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."hostel_staff_assignment" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "hostel_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "hostel_staff_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."hostel_incident" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "hostel_id" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "incident_date" TEXT NOT NULL,
    "reported_by" TEXT NOT NULL,

    CONSTRAINT "hostel_incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."library_book" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "publication_year" INTEGER,
    "subject_area" TEXT,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "library_book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."library_author" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "name" TEXT NOT NULL,
    "bio" TEXT,

    CONSTRAINT "library_author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."library_book_copy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "status" "sukuux"."CopyStatus" NOT NULL,

    CONSTRAINT "library_book_copy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."library_borrow" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "copy_id" TEXT NOT NULL,
    "borrower_type" "sukuux"."PersonType" NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "borrow_date" TEXT NOT NULL,
    "due_date" TEXT NOT NULL,
    "returned_date" TEXT,

    CONSTRAINT "library_borrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."library_fine" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "borrow_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "sukuux"."FineStatus" NOT NULL,

    CONSTRAINT "library_fine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."inventory_item" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "reorder_level" INTEGER NOT NULL,

    CONSTRAINT "inventory_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."inventory_stock_entry" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(65,30) NOT NULL,
    "supplier_id" TEXT,
    "entry_date" TEXT NOT NULL,

    CONSTRAINT "inventory_stock_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."inventory_stock_issue" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "issued_to" TEXT NOT NULL,
    "issue_date" TEXT NOT NULL,

    CONSTRAINT "inventory_stock_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."inventory_supplier" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,

    CONSTRAINT "inventory_supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."inventory_purchase_order" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "order_date" TEXT NOT NULL,
    "status" "sukuux"."PurchaseOrderStatus" NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "inventory_purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."inventory_asset" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "asset_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchase_date" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "assigned_to" TEXT,
    "status" "sukuux"."AssetStatus" NOT NULL,

    CONSTRAINT "inventory_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transport_vehicle" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "vehicle_type" "sukuux"."VehicleVehicleType" NOT NULL,
    "status" "sukuux"."VehicleStatus" NOT NULL,

    CONSTRAINT "transport_vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transport_driver" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "license_expiry" TEXT NOT NULL,

    CONSTRAINT "transport_driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transport_route" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_point" TEXT NOT NULL,
    "end_point" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "transport_route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transport_stop" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "stop_name" TEXT NOT NULL,
    "pickup_time" TEXT NOT NULL,
    "stop_order" INTEGER NOT NULL,

    CONSTRAINT "transport_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transport_assignment" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "transport_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."transport_trip_log" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "trip_date" TEXT NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "arrival_time" TIMESTAMP(3),
    "trip_type" "sukuux"."TripLogTripType" NOT NULL,

    CONSTRAINT "transport_trip_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."clinic_visit" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "complaint" TEXT NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "attended_by" TEXT,

    CONSTRAINT "clinic_visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."clinic_medication" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "stock_quantity" INTEGER NOT NULL,
    "reorder_level" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "clinic_medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."clinic_prescription" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "instructions" TEXT,

    CONSTRAINT "clinic_prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."clinic_referral" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "hospital_name" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "referral_date" TEXT NOT NULL,
    "referral_letter_url" TEXT,
    "parent_notified" BOOLEAN NOT NULL,

    CONSTRAINT "clinic_referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."clinic_immunization" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "vaccine_name" TEXT NOT NULL,
    "date_administered" TEXT NOT NULL,
    "administered_by" TEXT,
    "next_due_date" TEXT,

    CONSTRAINT "clinic_immunization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."workflow_definition" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "workflow_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."workflow_step" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "approver_role" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL,

    CONSTRAINT "workflow_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."workflow_instance" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "status" "sukuux"."InstanceStatus" NOT NULL,
    "initiated_by" TEXT NOT NULL,
    "initiated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "workflow_instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."workflow_approval" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "decision" "sukuux"."ApprovalDecision" NOT NULL,
    "decision_date" TIMESTAMP(3) NOT NULL,
    "comments" TEXT,

    CONSTRAINT "workflow_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."analytics_kpi" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" DECIMAL(65,30) NOT NULL,
    "snapshot_date" TEXT NOT NULL,
    "dimension" TEXT,
    "dimension_value" TEXT,

    CONSTRAINT "analytics_kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."analytics_student_risk" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "risk_score" DECIMAL(65,30) NOT NULL,
    "risk_category" "sukuux"."SeverityLevel" NOT NULL,
    "contributing_factors" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "term_id" TEXT NOT NULL,

    CONSTRAINT "analytics_student_risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."analytics_report" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "parameters" TEXT,
    "generated_by" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "file_url" TEXT,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "analytics_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."analytics_event" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "properties" TEXT,
    "event_timestamp" TIMESTAMP(3) NOT NULL,
    "academic_year_id" TEXT,
    "term_id" TEXT,

    CONSTRAINT "analytics_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_user_identity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "identity_type" "sukuux"."UserIdentityType" NOT NULL,
    "identity_id" TEXT NOT NULL,

    CONSTRAINT "system_user_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_authentication_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "login_status" "sukuux"."AuthLoginStatus" NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_authentication_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_password_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "min_length" INTEGER NOT NULL,
    "require_uppercase" BOOLEAN NOT NULL,
    "require_lowercase" BOOLEAN NOT NULL,
    "require_numbers" BOOLEAN NOT NULL,
    "require_symbols" BOOLEAN NOT NULL,
    "password_expiry_days" INTEGER NOT NULL,

    CONSTRAINT "system_password_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_security_policy" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "policy_name" TEXT NOT NULL,
    "policy_value" TEXT NOT NULL,

    CONSTRAINT "system_security_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_configuration" (
    "id" TEXT NOT NULL,
    "config_key" TEXT NOT NULL,
    "config_value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_environment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "system_environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "system_department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_backup_log" (
    "id" TEXT NOT NULL,
    "backup_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_backup_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_job_execution" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "result" TEXT,

    CONSTRAINT "system_job_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_health_check" (
    "id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_rate_limit" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "max_requests" INTEGER NOT NULL,
    "time_window_seconds" INTEGER NOT NULL,

    CONSTRAINT "system_rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_data_retention" (
    "id" TEXT NOT NULL,
    "policy_name" TEXT NOT NULL,
    "retention_years" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "system_data_retention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_error_log" (
    "id" TEXT NOT NULL,
    "error_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "module_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_error_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_service" (
    "id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "service_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_service_status" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "status" "sukuux"."ServiceRuntimeStatus" NOT NULL,
    "last_check" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_service_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_accreditation" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "accreditation_number" TEXT NOT NULL,
    "issue_date" TEXT NOT NULL,
    "expiry_date" TEXT NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "school_accreditation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."school_audit_log" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."staff_documents" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT,

    CONSTRAINT "staff_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_salary_structure" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "structure_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "payroll_salary_structure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_salary_component" (
    "id" TEXT NOT NULL,
    "structure_id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "component_type" "sukuux"."SalaryComponentType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "payroll_salary_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_statutory_deduction" (
    "id" TEXT NOT NULL,
    "deduction_name" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "payroll_statutory_deduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_payslip_item" (
    "id" TEXT NOT NULL,
    "payslip_id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "payroll_payslip_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_payment" (
    "id" TEXT NOT NULL,
    "payslip_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_method" "sukuux"."PaymentPaymentMethod" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reference_number" TEXT,

    CONSTRAINT "payroll_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_payment_batch" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "batch_name" TEXT NOT NULL,
    "payment_date" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "payroll_payment_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_loan" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "loan_amount" DECIMAL(65,30) NOT NULL,
    "interest_rate" DECIMAL(65,30) NOT NULL,
    "loan_date" TEXT NOT NULL,
    "outstanding_balance" DECIMAL(65,30) NOT NULL,
    "status" "sukuux"."LoanStatus" NOT NULL,

    CONSTRAINT "payroll_loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_loan_repayment" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "repayment_amount" DECIMAL(65,30) NOT NULL,
    "repayment_date" TEXT NOT NULL,
    "payslip_id" TEXT,

    CONSTRAINT "payroll_loan_repayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_reimbursement" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "expense_type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "status" "sukuux"."ApprovalStatus" NOT NULL,

    CONSTRAINT "payroll_reimbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sukuux"."payroll_audit_log" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "payroll_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_domain_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "producer" TEXT NOT NULL DEFAULT 'sukuu-api',
    "correlation_id" TEXT NOT NULL,
    "causation_id" TEXT,
    "tenant_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "published_at" TIMESTAMPTZ(6),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "system_domain_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."system_command_log" (
    "operation_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "actor_id" TEXT,
    "command_type" TEXT NOT NULL,
    "aggregate_id" TEXT,
    "request_hash" TEXT,
    "result_status" INTEGER,
    "result_body" JSONB,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "system_command_log_pkey" PRIMARY KEY ("operation_id")
);

-- CreateIndex

-- CreateIndex

-- CreateIndex
CREATE UNIQUE INDEX "schedule_timetable_class_id_stream_id_day_id_period_id_key" ON "sukuux"."schedule_timetable"("class_id", "stream_id", "day_id", "period_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_teacher_schedule_teacher_id_day_id_period_id_key" ON "sukuux"."schedule_teacher_schedule"("teacher_id", "day_id", "period_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_room_schedule_room_id_day_id_period_id_key" ON "sukuux"."schedule_room_schedule"("room_id", "day_id", "period_id");

-- CreateIndex
CREATE UNIQUE INDEX "grading_score_enrollment_id_assessment_id_key" ON "sukuux"."grading_score"("enrollment_id", "assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "grading_result_enrollment_id_term_id_key" ON "sukuux"."grading_result"("enrollment_id", "term_id");

-- CreateIndex
CREATE UNIQUE INDEX "grading_remark_enrollment_id_subject_id_term_id_key" ON "sukuux"."grading_remark"("enrollment_id", "subject_id", "term_id");

-- CreateIndex
CREATE UNIQUE INDEX "grading_subject_result_enrollment_id_subject_id_term_id_key" ON "sukuux"."grading_subject_result"("enrollment_id", "subject_id", "term_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_session_class_id_stream_id_day_id_period_id_sess_key" ON "sukuux"."attendance_session"("class_id", "stream_id", "day_id", "period_id", "session_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_student_session_id_student_id_key" ON "sukuux"."attendance_student"("session_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_system_domain_event_aggregate" ON "system"."system_domain_event"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "idx_system_domain_event_tenant" ON "system"."system_domain_event"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_system_command_log_tenant" ON "system"."system_command_log"("tenant_id");

-- Exact live UNIQUE constraints not represented as standalone indexes.
ALTER TABLE "sukuux"."staff_staff"
  ADD CONSTRAINT "uq_staff_staff_user_id" UNIQUE ("user_id");

ALTER TABLE "system"."system_user_role"
  ADD CONSTRAINT "uq_system_user_role_user_role_school" UNIQUE ("user_id", "role_id", "school_id");

-- ============================================================================
-- SUKUU CURRENT-STATE NATIVE POSTGRESQL CONTROLS
-- Baseline supplement captured from the live DB on 2026-08-23.
-- v0.2: Prisma-supported ordinary indexes are now declared in schema.prisma
-- and therefore are NOT duplicated here. This overlay keeps only controls
-- Prisma 5.14 cannot faithfully represent/replay, plus RLS policies.
--
-- This file intentionally excludes runtime-role creation, passwords, GRANTs and
-- default privileges. Those remain deployment/operations concerns.
-- ============================================================================

-- Native CHECK constraints not represented in Prisma Schema Language 5.14.
ALTER TABLE system.system_user
  ADD CONSTRAINT system_user_status_check
  CHECK (status IN ('INVITED','PENDING_VERIFICATION','ACTIVE','LOCKED','SUSPENDED','CLOSED'));

ALTER TABLE system.system_domain_event
  ADD CONSTRAINT system_domain_event_status_check
  CHECK (status IN ('PENDING','PUBLISHED','FAILED'));

-- Native partial index not represented by Prisma 5.14.
CREATE INDEX idx_system_domain_event_status
  ON system.system_domain_event (status) WHERE status = 'PENDING';

-- ─── Enable + FORCE row level security on all 39 SystemX tables ────────────
do $$
declare
  tbl text;
  tables text[] := array[
    'system_settings','system_log','system_user','system_role','system_permission',
    'system_role_permission','system_user_role','system_session','system_device',
    'system_api_key','system_login_history','system_password_history','system_mfa',
    'system_feature_flag','system_backup','system_job_queue','system_webhook',
    'system_audit_event','system_notification_preference','system_subscription',
    'system_tenant_plan','system_user_identity','system_authentication_log',
    'system_password_policy','system_security_policy','system_configuration',
    'system_environment','system_department','system_integration','system_backup_log',
    'system_job_execution','system_health_check','system_rate_limit',
    'system_data_retention','system_error_log','system_service','system_service_status',
    'system_domain_event','system_command_log'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table system.%I enable row level security', tbl);
    execute format('alter table system.%I force row level security', tbl);
  end loop;
end $$;

-- ─── Category A — direct school_id (tenant match) ──────────────────────────
do $$
declare
  tbl text;
  tables text[] := array[
    'system_log','system_user_role','system_api_key',
    'system_backup','system_job_queue','system_webhook','system_audit_event',
    'system_subscription','system_password_policy','system_security_policy'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists tenant_match on system.%I', tbl);
    execute format($f$
      create policy tenant_match on system.%I
      using (
        school_id = nullif(current_setting('app.current_school_id', true), '')
        or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
      )
      with check (
        school_id = nullif(current_setting('app.current_school_id', true), '')
        or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
      )
    $f$, tbl);
  end loop;
end $$;

-- system_role: system/global roles remain readable.
drop policy if exists role_access on system.system_role;
create policy role_access on system.system_role
using (
  is_system = true
  or school_id = nullif(current_setting('app.current_school_id', true), '')
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
)
with check (
  school_id = nullif(current_setting('app.current_school_id', true), '')
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
);

-- system_feature_flag: tenant flags plus global flags.
drop policy if exists feature_flag_read on system.system_feature_flag;
create policy feature_flag_read on system.system_feature_flag for select using (
  school_id = nullif(current_setting('app.current_school_id', true), '')
  or school_id is null
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
);
drop policy if exists feature_flag_write_tenant on system.system_feature_flag;
create policy feature_flag_write_tenant on system.system_feature_flag for insert with check (
  school_id = nullif(current_setting('app.current_school_id', true), '')
  or (school_id is null and nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster'))
);
drop policy if exists feature_flag_update on system.system_feature_flag;
create policy feature_flag_update on system.system_feature_flag for update using (
  school_id = nullif(current_setting('app.current_school_id', true), '')
  or (school_id is null and nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster'))
);

-- ─── Category B — user_id present, no school_id ────────────────────────────
do $$
declare
  tbl text;
  tables text[] := array[
    'system_session','system_device','system_login_history','system_password_history',
    'system_mfa','system_notification_preference','system_user_identity',
    'system_authentication_log'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists own_or_colleague on system.%I', tbl);
    execute format($f$
      create policy own_or_colleague on system.%I
      using (
        user_id = nullif(current_setting('app.current_user_id', true), '')
        or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
        or user_id in (
          select target_role.user_id
          from system.system_user_role as viewer_role
          join system.system_user_role as target_role
            on viewer_role.school_id = target_role.school_id
          where viewer_role.user_id = nullif(current_setting('app.current_user_id', true), '')
        )
      )
      with check (
        user_id = nullif(current_setting('app.current_user_id', true), '')
        or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
      )
    $f$, tbl);
  end loop;
end $$;

-- SystemUser itself.
drop policy if exists system_user_access on system.system_user;
create policy system_user_access on system.system_user
using (
  id = nullif(current_setting('app.current_user_id', true), '')
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
  or id in (
    select target_role.user_id
    from system.system_user_role as viewer_role
    join system.system_user_role as target_role
      on viewer_role.school_id = target_role.school_id
    where viewer_role.user_id = nullif(current_setting('app.current_user_id', true), '')
  )
)
with check (
  id = nullif(current_setting('app.current_user_id', true), '')
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
);

-- ─── Platform-global SystemX tables ────────────────────────────────────────
do $$
declare
  tbl text;
  tables text[] := array[
    'system_settings','system_permission','system_tenant_plan','system_configuration',
    'system_environment','system_department','system_integration','system_backup_log',
    'system_job_execution','system_health_check','system_rate_limit',
    'system_data_retention','system_error_log','system_service','system_service_status'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists platform_admin_only on system.%I', tbl);
    execute format($f$
      create policy platform_admin_only on system.%I
      using (nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster'))
      with check (nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster'))
    $f$, tbl);
  end loop;
end $$;

-- system_permission split read/write treatment.
drop policy if exists platform_admin_only on system.system_permission;
drop policy if exists permission_read_all on system.system_permission;
create policy permission_read_all on system.system_permission for select using (true);
drop policy if exists permission_write_admin_only on system.system_permission;
create policy permission_write_admin_only on system.system_permission for insert with check (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);
drop policy if exists permission_update_admin_only on system.system_permission;
create policy permission_update_admin_only on system.system_permission for update using (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);
drop policy if exists permission_delete_admin_only on system.system_permission;
create policy permission_delete_admin_only on system.system_permission for delete using (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);

-- system_role_permission split read/write treatment.
drop policy if exists role_permission_read_all on system.system_role_permission;
create policy role_permission_read_all on system.system_role_permission for select using (true);
drop policy if exists role_permission_write_admin_only on system.system_role_permission;
create policy role_permission_write_admin_only on system.system_role_permission for insert with check (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);
drop policy if exists role_permission_delete_admin_only on system.system_role_permission;
create policy role_permission_delete_admin_only on system.system_role_permission for delete using (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);

-- Internal plumbing. Preserved exactly as current-state behaviour; this is a
-- known security remediation item after baselining because the policy name
-- "service_only" is stronger than its current USING(true)/WITH CHECK(true).
drop policy if exists service_only on system.system_domain_event;
create policy service_only on system.system_domain_event using (true) with check (true);
drop policy if exists service_only on system.system_command_log;
create policy service_only on system.system_command_log using (true) with check (true);
