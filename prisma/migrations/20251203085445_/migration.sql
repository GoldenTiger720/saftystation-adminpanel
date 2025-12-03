-- CreateTable
CREATE TABLE "news_newsitem" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "priority" VARCHAR(10) NOT NULL,
    "is_published" BOOLEAN NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "author" VARCHAR(100) NOT NULL,

    CONSTRAINT "news_newsitem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_video" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "video_type" VARCHAR(20) NOT NULL,
    "thumbnail" VARCHAR(100),
    "video_url" VARCHAR(200) NOT NULL,
    "video_file" VARCHAR(100),
    "duration" interval,
    "is_featured" BOOLEAN NOT NULL,
    "view_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "uploaded_by" VARCHAR(100) NOT NULL,

    CONSTRAINT "news_video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_dashboarddata" (
    "id" BIGSERIAL NOT NULL,
    "date" DATE NOT NULL,
    "spotlights_ytd" INTEGER NOT NULL,
    "spotlights_mtd" INTEGER NOT NULL,
    "safety_tour_ytd" DECIMAL(5,2) NOT NULL,
    "safety_tour_mtd" DECIMAL(5,2) NOT NULL,
    "possession_average" INTEGER NOT NULL,
    "average_work_per_hour" DECIMAL(8,2) NOT NULL,
    "in_process_critical" INTEGER NOT NULL,
    "in_process_warning" INTEGER NOT NULL,
    "possession_active" INTEGER NOT NULL,
    "possession_inactive" INTEGER NOT NULL,
    "preparation_status" INTEGER NOT NULL,
    "breakdown_status" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "performance_dashboarddata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_performancemetric" (
    "id" BIGSERIAL NOT NULL,
    "metric_type" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "target_value" DECIMAL(10,2),
    "unit" VARCHAR(20) NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" VARCHAR(100) NOT NULL,

    CONSTRAINT "performance_performancemetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rhomberg_videos" (
    "id" BIGSERIAL NOT NULL,
    "video_id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnail_url" VARCHAR(200) NOT NULL,
    "video_url" VARCHAR(200) NOT NULL,
    "duration" VARCHAR(20) NOT NULL,
    "published_at" TIMESTAMPTZ(6) NOT NULL,
    "view_count" INTEGER NOT NULL,
    "like_count" INTEGER NOT NULL,
    "channel_title" VARCHAR(100) NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "rhomberg_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_checkinrecord" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "check_in_time" TIMESTAMPTZ(6),
    "check_out_time" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "company" VARCHAR(100) NOT NULL,
    "reason" VARCHAR(100) NOT NULL,

    CONSTRAINT "staff_checkinrecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" BIGSERIAL NOT NULL,
    "key_name" VARCHAR(50) NOT NULL,
    "key_value" VARCHAR(255) NOT NULL,
    "channel_id" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "image_data" TEXT,
    "avatar_data" TEXT,
    "news_link" VARCHAR(500),
    "poster_name" VARCHAR(100),
    "poster_title" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_alerts" (
    "id" BIGSERIAL NOT NULL,
    "week_number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "thumbnail_data" TEXT,
    "pdf_data" TEXT,
    "pdf_filename" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "performance_dashboarddata_date_key" ON "performance_dashboarddata"("date");

-- CreateIndex
CREATE UNIQUE INDEX "performance_performancem_metric_type_name_date_94b308a4_uniq" ON "performance_performancemetric"("metric_type", "name", "date");

-- CreateIndex
CREATE UNIQUE INDEX "rhomberg_videos_video_id_key" ON "rhomberg_videos"("video_id");

-- CreateIndex
CREATE INDEX "rhomberg_videos_video_id_f52befc1_like" ON "rhomberg_videos"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_name_key" ON "api_keys"("key_name");

-- CreateIndex
CREATE UNIQUE INDEX "safety_alerts_week_number_year_key" ON "safety_alerts"("week_number", "year");
