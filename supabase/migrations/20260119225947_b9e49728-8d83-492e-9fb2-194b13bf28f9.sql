-- Criar trigger para criar profile automaticamente quando um novo usuário é criado
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Criar trigger para créditos
CREATE OR REPLACE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_credits();

-- Inserir profiles para usuários que já existem mas não têm profile
INSERT INTO public.profiles (id, email, full_name, status, auth_provider)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email),
  'pending',
  COALESCE(u.raw_app_meta_data->>'provider', 'email')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Inserir user_roles para usuários que não têm
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'free'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id);

-- Inserir créditos iniciais para usuários que não têm
INSERT INTO public.user_credits (user_id, balance)
SELECT u.id, 50
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_credits c WHERE c.user_id = u.id);