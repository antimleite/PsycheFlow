
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

-- Permite que usuários logados (Admin via AppContext) ATUALIZEM as configurações
CREATE POLICY "Permitir atualização para autenticados" 
ON public.role_permissions FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 4. Insere os dados iniciais (Padrões) para popular a tabela
INSERT INTO public.role_permissions (role, modules) VALUES
('Administrador(a)', ARRAY['dashboard', 'patients', 'scheduling', 'consultations', 'payments', 'packages', 'reports', 'consultationHistory', 'financialReport', 'profissionais', 'users', 'menuSettings']),
('Psicólogo(a)', ARRAY['dashboard', 'patients', 'scheduling', 'consultations', 'packages', 'reports', 'consultationHistory']),
('Secretário(a)', ARRAY['dashboard', 'patients', 'scheduling', 'payments']),
('Teste', ARRAY['dashboard'])
ON CONFLICT (role) DO NOTHING;

-- 5. MELHORIAS NA TABELA DE SESSÕES (SESSIONS)
-- Garante que todas as colunas necessárias para o módulo de Atendimentos existam
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS modality text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS medical_record text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS duration integer;
-- Nova coluna para armazenar o JSON da avaliação estruturada (checklist, humor, riscos, etc)
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS structured_assessment text;

-- 6. OTIMIZAÇÃO (ÍNDICES)
-- Adiciona índices para melhorar a performance das consultas frequentes
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_profissional_id ON public.sessions(profissional_id);
CREATE INDEX IF NOT EXISTS idx_patients_profissional_id ON public.patients(profissional_id);
