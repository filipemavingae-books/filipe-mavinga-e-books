-- Tabela para ganhos de afiliados
CREATE TABLE IF NOT EXISTS affiliate_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para saques de afiliados
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  bank_details JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de marca d'água
CREATE TABLE IF NOT EXISTS watermark_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  watermark_data JSONB NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  ip_address INET,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  identifier TEXT,
  ip_address INET,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para bans de usuários
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  ban_type TEXT DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de ações administrativas
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para calcular estatísticas de afiliados
CREATE OR REPLACE FUNCTION get_affiliate_stats(user_uuid UUID)
RETURNS TABLE (
  total_earnings DECIMAL,
  pending_earnings DECIMAL,
  total_referrals BIGINT,
  conversion_rate DECIMAL,
  clicks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN ae.status = 'paid' THEN ae.amount ELSE 0 END), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN ae.status = 'pending' THEN ae.amount ELSE 0 END), 0) as pending_earnings,
    COUNT(DISTINCT ae.order_id) as total_referrals,
    CASE 
      WHEN COUNT(DISTINCT al.id) > 0 THEN 
        (COUNT(DISTINCT ae.order_id)::DECIMAL / COUNT(DISTINCT al.id) * 100)
      ELSE 0 
    END as conversion_rate,
    COUNT(DISTINCT al.id) as clicks
  FROM user_profiles up
  LEFT JOIN affiliate_earnings ae ON ae.affiliate_id = user_uuid
  LEFT JOIN affiliate_links al ON al.affiliate_code = up.affiliate_code
  WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_affiliate_status ON affiliate_earnings(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_status ON affiliate_withdrawals(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_watermark_logs_user_order ON watermark_logs(user_id, order_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier_timestamp ON rate_limit_logs(identifier, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type_created ON security_logs(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_bans_user_active ON user_bans(user_id, is_active);

-- RLS (Row Level Security)
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE watermark_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own affiliate earnings" ON affiliate_earnings
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "Users can view their own withdrawals" ON affiliate_withdrawals
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "Users can create withdrawal requests" ON affiliate_withdrawals
  FOR INSERT WITH CHECK (auth.uid() = affiliate_id);

CREATE POLICY "Users can view their own watermark logs" ON watermark_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all security data" ON affiliate_earnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage bans" ON user_bans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Trigger para criar ganhos de afiliado automaticamente
CREATE OR REPLACE FUNCTION create_affiliate_earning()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_code_param TEXT;
  affiliate_user_id UUID;
  commission_amount DECIMAL;
BEGIN
  -- Verificar se o pedido tem código de afiliado
  IF NEW.affiliate_code IS NOT NULL THEN
    -- Buscar o usuário afiliado
    SELECT user_id INTO affiliate_user_id
    FROM user_profiles
    WHERE affiliate_code = NEW.affiliate_code;
    
    IF affiliate_user_id IS NOT NULL THEN
      -- Calcular comissão (10% do total)
      commission_amount := NEW.total * 0.10;
      
      -- Criar registro de ganho
      INSERT INTO affiliate_earnings (
        affiliate_id,
        order_id,
        amount,
        commission_rate,
        status
      ) VALUES (
        affiliate_user_id,
        NEW.id,
        commission_amount,
        10.00,
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_affiliate_earning
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION create_affiliate_earning();
