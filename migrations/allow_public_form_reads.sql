DROP POLICY IF EXISTS "Anyone can view published forms" ON forms;
DROP POLICY IF EXISTS "Anyone can view questions of published forms" ON form_questions;
DROP POLICY IF EXISTS "Anyone can view rules of published forms" ON conditional_rules;

CREATE POLICY "Anyone can view published forms" ON forms
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public_forms
      WHERE public_forms.form_id = forms.id
    )
  );

CREATE POLICY "Anyone can view questions of published forms" ON form_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public_forms
      WHERE public_forms.form_id = form_questions.form_id
    )
  );

CREATE POLICY "Anyone can view rules of published forms" ON conditional_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM form_questions
      JOIN public_forms ON public_forms.form_id = form_questions.form_id
      WHERE form_questions.id = conditional_rules.question_id
    )
  );
