-- Adicionar políticas de INSERT admin que faltam para tabelas com RLS

-- credit_usage precisa de política de INSERT para admin
CREATE POLICY "Admin pode inserir credit_usage" ON public.credit_usage
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- blog_page_views precisa de políticas para admin
CREATE POLICY "Admin pode ver blog_page_views" ON public.blog_page_views
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode inserir blog_page_views" ON public.blog_page_views
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles precisa de política de INSERT para admin (migração de usuários)
CREATE POLICY "Admin pode inserir profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));