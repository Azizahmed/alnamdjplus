DROP POLICY IF EXISTS "Anyone can submit responses" ON form_responses;
DROP POLICY IF EXISTS "Anyone can submit answers" ON response_answers;
DROP POLICY IF EXISTS "Anyone can create uploads" ON form_uploads;
DROP POLICY IF EXISTS "Anyone can track analytics events" ON form_analytics_events;

CREATE POLICY "Anyone can submit responses" ON form_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public_forms
      WHERE public_forms.form_id = form_responses.form_id
    )
  );

CREATE POLICY "Anyone can submit answers" ON response_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM form_responses
      JOIN public_forms ON public_forms.form_id = form_responses.form_id
      JOIN form_questions ON form_questions.form_id = form_responses.form_id
      WHERE form_responses.id = response_answers.response_id
        AND form_questions.id = response_answers.question_id
    )
  );

CREATE POLICY "Anyone can create uploads" ON form_uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM form_responses
      JOIN public_forms ON public_forms.form_id = form_responses.form_id
      JOIN form_questions ON form_questions.form_id = form_responses.form_id
      WHERE form_responses.id = form_uploads.response_id
        AND form_questions.id = form_uploads.question_id
    )
  );

CREATE POLICY "Anyone can track analytics events" ON form_analytics_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public_forms
      WHERE public_forms.form_id = form_analytics_events.form_id
    )
  );
