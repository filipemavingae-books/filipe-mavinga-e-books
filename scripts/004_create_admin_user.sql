-- Criar usuário admin padrão (Filipe Mavinga)
-- Nota: Este script deve ser executado após criar um usuário via interface

-- Atualizar o primeiro usuário para ser admin (ajuste o email conforme necessário)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'filipe@mavinga.com' -- Substitua pelo email do admin
   OR id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1);

-- Inserir configurações padrão de preview
INSERT INTO public.preview_configs (type, image_url, title_template) VALUES
  ('site', '/placeholder.svg?height=630&width=1200', 'Filipe Mavinga E-books - Transforme Leitores em Autores'),
  ('profile', '/placeholder.svg?height=630&width=1200', 'Perfil de {author} - Filipe Mavinga E-books'),
  ('publication', '/placeholder.svg?height=630&width=1200', '{title} por {author} - Filipe Mavinga E-books'),
  ('payment', '/placeholder.svg?height=630&width=1200', 'Comprar E-book - Filipe Mavinga E-books')
ON CONFLICT (type) DO NOTHING;
