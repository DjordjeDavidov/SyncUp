DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meetup_feedback_disposition') THEN
    CREATE TYPE "meetup_feedback_disposition" AS ENUM (
      'MET_OK',
      'NO_SHOW',
      'DIDNT_REALLY_MEET',
      'PREFER_NOT_TO_RATE'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meetup_feedback_moderation_status') THEN
    CREATE TYPE "meetup_feedback_moderation_status" AS ENUM (
      'PENDING',
      'FLAGGED',
      'REVIEWED',
      'DISMISSED'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_caution_status') THEN
    CREATE TYPE "profile_caution_status" AS ENUM ('NONE', 'CAUTION');
  END IF;
END $$;

ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'MEETUP_FEEDBACK_REQUEST';

ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "caution_status" "profile_caution_status" NOT NULL DEFAULT 'NONE';

ALTER TABLE "notifications"
ADD COLUMN IF NOT EXISTS "related_feedback_id" UUID;

CREATE TABLE IF NOT EXISTS "meetup_feedback" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "activity_id" UUID NOT NULL,
  "rater_user_id" UUID NOT NULL,
  "rated_user_id" UUID NOT NULL,
  "eligibility_verified" BOOLEAN NOT NULL DEFAULT true,
  "attendance_verified" BOOLEAN NOT NULL DEFAULT true,
  "quick_disposition" "meetup_feedback_disposition" NOT NULL,
  "respectful_score" INTEGER,
  "friendly_score" INTEGER,
  "profile_accuracy_score" INTEGER,
  "safety_score" INTEGER,
  "reliability_score" INTEGER,
  "admin_only_comment" TEXT,
  "moderator_note" TEXT,
  "moderation_status" "meetup_feedback_moderation_status" NOT NULL DEFAULT 'PENDING',
  "internal_risk_score" INTEGER NOT NULL DEFAULT 0,
  "public_caution_candidate" BOOLEAN NOT NULL DEFAULT false,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meetup_feedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meetup_feedback_unique_submission" UNIQUE ("activity_id", "rater_user_id", "rated_user_id"),
  CONSTRAINT "meetup_feedback_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "meetup_feedback_rater_user_id_fkey" FOREIGN KEY ("rater_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "meetup_feedback_rated_user_id_fkey" FOREIGN KEY ("rated_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "meetup_feedback_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "idx_meetup_feedback_activity_id" ON "meetup_feedback"("activity_id");
CREATE INDEX IF NOT EXISTS "idx_meetup_feedback_rated_user_id" ON "meetup_feedback"("rated_user_id");
CREATE INDEX IF NOT EXISTS "idx_meetup_feedback_rater_user_id" ON "meetup_feedback"("rater_user_id");
CREATE INDEX IF NOT EXISTS "idx_meetup_feedback_moderation_status" ON "meetup_feedback"("moderation_status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_related_feedback_id_fkey'
      AND table_name = 'notifications'
  ) THEN
    ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_related_feedback_id_fkey"
    FOREIGN KEY ("related_feedback_id") REFERENCES "meetup_feedback"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;
  END IF;
END $$;
