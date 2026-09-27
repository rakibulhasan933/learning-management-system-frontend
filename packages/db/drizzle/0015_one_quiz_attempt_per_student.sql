-- A student may submit each quiz only once.
-- Keep the latest historical submission before enforcing the constraint. This
-- makes the migration safe for databases that contain duplicate attempts from
-- before the single-attempt rule existed.
WITH ranked_attempts AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY quiz_id, user_id
      ORDER BY completed_at DESC, id DESC
    ) AS attempt_rank
  FROM "quiz_attempts"
)
DELETE FROM "quiz_attempts" AS attempts
USING ranked_attempts
WHERE attempts.id = ranked_attempts.id
  AND ranked_attempts.attempt_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "quiz_attempts_quiz_user_unique"
  ON "quiz_attempts" ("quiz_id", "user_id");
