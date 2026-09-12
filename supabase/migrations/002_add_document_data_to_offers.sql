-- 002_add_document_data_to_offers.sql
ALTER TABLE public.offers ADD COLUMN "documentData" JSONB NOT NULL DEFAULT '{}'::jsonb;
