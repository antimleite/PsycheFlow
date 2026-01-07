
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

/**
 * Utilitário para obter variáveis de ambiente de forma resiliente.
 * Prioriza o padrão do Vite (import.meta.env) usado pela Vercel.
 */
const getEnvVar = (key: string): string => {
  // 1. Tenta o padrão Vite (Build time)
  const meta = import.meta as any;
  if (meta && meta.env && meta.env[key]) {
    return meta.env[key];
  }
  
  // 2. Tenta o shim global (Runtime fallback definido no index.html ou injetado pelo Vite)
  const globalEnv = (window as any).process?.env;
  if (globalEnv && globalEnv[key]) {
    return globalEnv[key];
  }

  return '';
};

// Credenciais atualizadas conforme solicitação
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://phfodgwnbsmmexextrts.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_Hc1Bcx7e2eCNwxp21w8FMQ_9J1Z7s21';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Teste de conexão silencioso para depuração no console
(async () => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        console.warn('Conectado ao Supabase, mas a tabela "profiles" ainda não existe.');
      } else {
        console.warn('Aviso de conexão Supabase:', error.message);
      }
    } else {
      console.log('Conexão com Supabase (PsycheFlow) estabelecida com sucesso.');
    }
  } catch (e) {
    console.error('Falha crítica ao testar conexão Supabase:', e);
  }
})();

// Helper para mapear nomes de colunas (snake_case) para o modelo de dados (camelCase)
export const mapToCamelCase = (data: any) => {
  if (!data) return null;
  if (Array.isArray(data)) return data.map(item => mapToCamelCase(item));
  
  const newObj: { [key: string]: any } = {};
  for (const key in data) {
    const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    newObj[camelKey] = data[key];
  }
  return newObj;
};

// Helper para mapear modelo de dados (camelCase) para nomes de colunas (snake_case)
export const mapToSnakeCase = (data: any) => {
  if (!data) return null;
  const newObj: { [key: string]: any } = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = data[key];
    }
  }
  return newObj;
};

// Função específica para buscar o perfil do usuário
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    if (!supabase || !supabase.from) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { 
        console.error('Erro ao buscar perfil no Supabase:', error.message);
      }
      return null;
    }
    
    return mapToCamelCase(data) as User;
  } catch (err: any) {
    console.error('Falha na comunicação com o servidor:', err.message);
    return null;
  }
};
