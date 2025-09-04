-- Criar buckets de storage para e-books
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('ebooks', 'ebooks', true, 52428800, ARRAY['application/pdf', 'application/epub+zip', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para o bucket ebooks
CREATE POLICY "Usuários podem fazer upload de arquivos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ebooks' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem ver seus próprios arquivos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ebooks' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Arquivos aprovados são públicos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ebooks' AND 
    EXISTS (
      SELECT 1 FROM public.publications 
      WHERE (cover_url LIKE '%' || name || '%' OR file_url LIKE '%' || name || '%')
      AND status = 'approved'
    )
  );

CREATE POLICY "Usuários podem atualizar seus arquivos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'ebooks' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem deletar seus arquivos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ebooks' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
