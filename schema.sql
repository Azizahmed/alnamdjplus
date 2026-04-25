CREATE TABLE form_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT false,
  "order" INTEGER NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conditional_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
  target_question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
  condition JSONB NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('show', 'hide')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE form_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  ip_hash TEXT,
  geo JSONB DEFAULT '{}',
  utm JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE response_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
  value JSONB
);

CREATE TABLE form_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL UNIQUE REFERENCES forms(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  og_image_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE form_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  schema_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE form_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'start', 'complete', 'abandon')),
  timestamp TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE webhook_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_form_questions_form_id ON form_questions(form_id);
CREATE INDEX idx_form_questions_order ON form_questions(form_id, "order");
CREATE INDEX idx_conditional_rules_question_id ON conditional_rules(question_id);
CREATE INDEX idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX idx_response_answers_response_id ON response_answers(response_id);
CREATE INDEX idx_response_answers_question_id ON response_answers(question_id);
CREATE INDEX idx_form_uploads_response_id ON form_uploads(response_id);
CREATE INDEX idx_public_forms_token ON public_forms(token);
CREATE INDEX idx_public_forms_form_id ON public_forms(form_id);
CREATE INDEX idx_chat_messages_form_id ON chat_messages(form_id);
CREATE INDEX idx_form_versions_form_id ON form_versions(form_id);
CREATE INDEX idx_form_analytics_events_form_id ON form_analytics_events(form_id);
CREATE INDEX idx_form_analytics_events_timestamp ON form_analytics_events(form_id, timestamp);
CREATE INDEX idx_webhook_configs_form_id ON webhook_configs(form_id);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditional_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms
CREATE POLICY "Users can view their own forms" ON forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON forms
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for form_questions
CREATE POLICY "Users can view questions of their forms" ON form_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_questions.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions for their forms" ON form_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_questions.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions of their forms" ON form_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_questions.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions of their forms" ON form_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_questions.form_id AND forms.user_id = auth.uid()
    )
  );

-- RLS Policies for conditional_rules
CREATE POLICY "Users can view rules of their forms" ON conditional_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM form_questions
      JOIN forms ON forms.id = form_questions.form_id
      WHERE form_questions.id = conditional_rules.question_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rules for their forms" ON conditional_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM form_questions
      JOIN forms ON forms.id = form_questions.form_id
      WHERE form_questions.id = conditional_rules.question_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rules of their forms" ON conditional_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM form_questions
      JOIN forms ON forms.id = form_questions.form_id
      WHERE form_questions.id = conditional_rules.question_id AND forms.user_id = auth.uid()
    )
  );

-- RLS Policies for form_responses (public read for form owners, public insert for submissions)
CREATE POLICY "Form owners can view responses" ON form_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_responses.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit responses" ON form_responses
  FOR INSERT WITH CHECK (true);

-- RLS Policies for response_answers
CREATE POLICY "Form owners can view answers" ON response_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM form_responses
      JOIN forms ON forms.id = form_responses.form_id
      WHERE form_responses.id = response_answers.response_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit answers" ON response_answers
  FOR INSERT WITH CHECK (true);

-- RLS Policies for form_uploads
CREATE POLICY "Form owners can view uploads" ON form_uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM form_responses
      JOIN forms ON forms.id = form_responses.form_id
      WHERE form_responses.id = form_uploads.response_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create uploads" ON form_uploads
  FOR INSERT WITH CHECK (true);

-- RLS Policies for public_forms
CREATE POLICY "Anyone can view public forms" ON public_forms
  FOR SELECT USING (true);

CREATE POLICY "Form owners can manage public forms" ON public_forms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = public_forms.form_id AND forms.user_id = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for form_versions
CREATE POLICY "Users can view versions of their forms" ON form_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_versions.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their forms" ON form_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_versions.form_id AND forms.user_id = auth.uid()
    )
  );

-- RLS Policies for form_analytics_events
CREATE POLICY "Form owners can view analytics" ON form_analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_analytics_events.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can track analytics events" ON form_analytics_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for webhook_configs
CREATE POLICY "Form owners can view webhooks" ON webhook_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = webhook_configs.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Form owners can manage webhooks" ON webhook_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = webhook_configs.form_id AND forms.user_id = auth.uid()
    )
  );
