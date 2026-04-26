DROP POLICY IF EXISTS "Form owners can manage public forms" ON public_forms;
DROP POLICY IF EXISTS "Form owners can create public forms" ON public_forms;
DROP POLICY IF EXISTS "Form owners can update public forms" ON public_forms;
DROP POLICY IF EXISTS "Form owners can delete public forms" ON public_forms;

CREATE POLICY "Form owners can create public forms" ON public_forms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM forms
      WHERE forms.id = public_forms.form_id
        AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Form owners can update public forms" ON public_forms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM forms
      WHERE forms.id = public_forms.form_id
        AND forms.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM forms
      WHERE forms.id = public_forms.form_id
        AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Form owners can delete public forms" ON public_forms
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM forms
      WHERE forms.id = public_forms.form_id
        AND forms.user_id = auth.uid()
    )
  );
