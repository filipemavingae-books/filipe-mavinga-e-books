-- Tabela para logs de telemetria de link preview
CREATE TABLE IF NOT EXISTS link_preview_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'link_preview_shown', 'link_preview_proceed', 'link_preview_cancel'
  target_url TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de preview por tipo de recurso
CREATE TABLE IF NOT EXISTS preview_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL, -- 'site', 'profile', 'publication', 'checkout'
  default_image_url TEXT,
  default_title TEXT,
  default_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_link_preview_logs_user_created ON link_preview_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_link_preview_logs_event_type ON link_preview_logs(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_preview_configs_type ON preview_configs(resource_type);

-- RLS (Row Level Security)
ALTER TABLE link_preview_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para link_preview_logs
CREATE POLICY "Anyone can insert link preview logs" ON link_preview_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own link preview logs" ON link_preview_logs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Políticas RLS para preview_configs
CREATE POLICY "Anyone can view preview configs" ON preview_configs
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage preview configs" ON preview_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Inserir configurações padrão de preview
INSERT INTO preview_configs (resource_type, default_title, default_description, default_image_url) VALUES
('site', 'Filipe Mavinga E-books', 'Transforme leitores em autores. Publique e venda e-books com segurança.', '/placeholder.svg?height=630&width=1200'),
('profile', 'Perfil de Autor - Filipe Mavinga E-books', 'Conheça este autor e suas publicações no marketplace de e-books.', '/placeholder.svg?height=630&width=1200'),
('publication', 'E-book - Filipe Mavinga E-books', 'Descubra este e-book disponível no nosso marketplace.', '/placeholder.svg?height=630&width=1200'),
('checkout', 'Comprar E-book - Filipe Mavinga E-books', 'Finalize sua compra de forma segura via KuEnha Pay.', '/placeholder.svg?height=630&width=1200');
