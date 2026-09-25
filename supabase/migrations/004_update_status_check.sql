-- Migrate existing rows to new statuses
UPDATE candidates
SET status = 'screening'
WHERE status = 'review';

UPDATE candidates
SET status = 'interview'
WHERE status IN ('interview_1', 'interview_2');

UPDATE candidates
SET status = 'selected'
WHERE status = 'approved';

UPDATE candidates
SET status = 'offer_sent'
WHERE status = 'offer';

-- Drop the old constraint
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;

-- Add the new constraint
ALTER TABLE candidates ADD CONSTRAINT candidates_status_check CHECK (
  status IN (
    'new', 'awaiting_details', 'follow_up', 'screening', 'awaiting_resume_portfolio', 
    'shortlisted', 'task_sent', 'task_received', 'interview', 'final_discussion', 
    'selected', 'hold', 'rejected', 'joining_confirmed', 'offer_sent', 'offer_accepted', 
    'offer_rejected', 'onboarding_requested', 'onboarding_review', 'onboarding_verified', 
    'onboarding_rejected', 'hired'
  )
);
