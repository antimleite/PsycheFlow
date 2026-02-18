
-- 1. Cria a tabela de permissões se ela não existir
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role text NOT NULL,
  modules text[] DEFAULT '{}'::text[],
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role)
);

-- 2. Habilita a segurança (RLS)
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Cria políticas de acesso (Policies)
-- Remove políticas antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Permitir leitura para todos autenticados" ON public.role_permissions;
DROP POLICY IF EXISTS "Permitir atualização para autenticados" ON public.role_permissions;

-- Permite que qualquer usuário logado LEIA as configurações
CREATE POLICY "Permitir leitura para todos autenticados" 
ON public.role_permissions FOR SELECT 
TO authenticated 
USING (true);

-- Permite que usuários logados ATUALIZEM as configurações
CREATE POLICY "Permitir atualização para autenticados" 
ON public.role_permissions FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 4. Insere os dados iniciais (Padrões)
INSERT INTO public.role_permissions (role, modules) VALUES
('Administrador(a)', ARRAY['dashboard', 'patients', 'scheduling', 'consultations', 'payments', 'packages', 'reports', 'consultationHistory', 'financialReport', 'profissionais', 'users', 'menuSettings']),
('Psicólogo(a)', ARRAY['dashboard', 'patients', 'scheduling', 'consultations', 'packages', 'reports', 'consultationHistory']),
('Secretário(a)', ARRAY['dashboard', 'patients', 'scheduling', 'payments']),
('Teste', ARRAY['dashboard'])
ON CONFLICT (role) DO NOTHING;

-- 5. Atualizações na tabela de sessões para suportar Atendimentos
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS modality text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS medical_record text;
