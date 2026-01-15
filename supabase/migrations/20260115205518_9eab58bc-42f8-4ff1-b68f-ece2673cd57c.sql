-- Remover planos antigos e inserir os corretos para corresponder ao painel original
DELETE FROM plan_permissions;

-- Inserir planos mensais
INSERT INTO plan_permissions (plan_name, price_amount, is_annual, monthly_credits, storage_limit_gb, imagefx_monthly_limit, permissions) VALUES
('FREE', 0, false, 50, 1, 10, '{"basic": true}'::jsonb),
('START CREATOR', 79.90, false, 500, 5, null, '{"basic": true, "premium": true}'::jsonb),
('TURBO MAKER', 99.90, false, 1000, 10, null, '{"basic": true, "premium": true, "advanced": true}'::jsonb),
('MASTER PRO', 149.90, false, 2000, 20, null, '{"basic": true, "premium": true, "advanced": true, "master": true}'::jsonb);

-- Inserir planos anuais (sem FREE anual)
INSERT INTO plan_permissions (plan_name, price_amount, is_annual, monthly_credits, storage_limit_gb, imagefx_monthly_limit, permissions) VALUES
('START CREATOR', 699.00, true, 500, 5, null, '{"basic": true, "premium": true}'::jsonb),
('TURBO MAKER', 999.00, true, 1000, 10, null, '{"basic": true, "premium": true, "advanced": true}'::jsonb),
('MASTER PRO', 1499.00, true, 2000, 20, null, '{"basic": true, "premium": true, "advanced": true, "master": true}'::jsonb);