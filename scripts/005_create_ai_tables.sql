-- Tabela para logs de chat da IA
CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context TEXT,
  success BOOLEAN DEFAULT false,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de geração de conteúdo
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL, -- 'description', 'summary', 'tags'
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  success BOOLEAN DEFAULT false,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de moderação
CREATE TABLE IF NOT EXISTS ai_moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text_analyzed TEXT NOT NULL,
  moderation_result TEXT NOT NULL,
  content_type TEXT,
  success BOOLEAN DEFAULT false,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user_created ON ai_chat_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user_type ON ai_generation_logs(user_id, generation_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_user ON ai_moderation_logs(user_id, created_at);

-- RLS (Row Level Security)
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own AI chat logs" ON ai_chat_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI generation logs" ON ai_generation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI moderation logs" ON ai_moderation_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all AI logs" ON ai_chat_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all AI generation logs" ON ai_generation_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all AI moderation logs" ON ai_moderation_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );
