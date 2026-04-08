-- CreateIndex
CREATE INDEX "Answer_attempt_id_idx" ON "Answer"("attempt_id");

-- CreateIndex
CREATE INDEX "Option_question_id_idx" ON "Option"("question_id");

-- CreateIndex
CREATE INDEX "Question_subject_id_idx" ON "Question"("subject_id");
