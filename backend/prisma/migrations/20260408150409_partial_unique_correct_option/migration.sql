-- Create a partial unique index ensuring only one correct option per question
CREATE UNIQUE INDEX one_correct_option_per_question ON "Option"(question_id) WHERE is_correct = TRUE;