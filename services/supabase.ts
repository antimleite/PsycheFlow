
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

// Credenciais fornecidas pelo usuário
const DEFAULT_URL = 'https://phfodgwnbsmmexextrts.supabase.co';
const DEFAULT_KEY = 'sb_publishable_Hc1Bcx7e2eCNwxp21w8FMQ_9J1Z7s21';

// O Vite injeta variáveis em process.env via config. 
const supabaseUrl = (process.env.VITE_SUPABASE_URL || DEFAULT_URL).trim();
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY).trim();

// Inicialização do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { 
        console.error('Erro Supabase ao buscar perfil:', error.message);
      }
      return null;
    }
    
    return mapToCamelCase(data) as User;
  } catch (err: any) {
    console.error('Erro de conexão ao buscar perfil:', err.message);
    return null;
  }
};
