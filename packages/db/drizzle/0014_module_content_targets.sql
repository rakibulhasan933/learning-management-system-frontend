-- Allow quizzes and assignments to belong to a module as well as a section or lecture.
ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "quizzes_exactly_one_target";
ALTER TABLE "quizzes"
  ADD CONSTRAINT "quizzes_exactly_one_target" CHECK (
    ("section_id" IS NOT NULL AND "lecture_id" IS NULL AND "module_id" IS NULL) OR
    ("section_id" IS NULL AND "lecture_id" IS NOT NULL AND "module_id" IS NULL) OR
    ("section_id" IS NULL AND "lecture_id" IS NULL AND "module_id" IS NOT NULL)
  );

ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "assignments_exactly_one_target";
ALTER TABLE "assignments"
  ADD CONSTRAINT "assignments_exactly_one_target" CHECK (
    ("section_id" IS NOT NULL AND "lecture_id" IS NULL AND "module_id" IS NULL) OR
    ("section_id" IS NULL AND "lecture_id" IS NOT NULL AND "module_id" IS NULL) OR
    ("section_id" IS NULL AND "lecture_id" IS NULL AND "module_id" IS NOT NULL)
  );
