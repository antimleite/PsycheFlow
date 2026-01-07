
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

// Credenciais padrão de fallback caso as variáveis de ambiente falhem
const DEFAULT_URL = 'https://phfodgwnbsmmexextrts.supabase.co';
const DEFAULT_KEY = 'sb_publishable_Hc1Bcx7e2eCNwxp21w8FMQ_9J1Z7s21';

const getEnv = (key: string, fallback: string): string => {
  try {
    // Tenta ler de process.env (injetado via Vite ou via Shim no HTML)
    const envSource = (typeof process !== 'undefined' && process.env) ? process.env : (window as any).process?.env;
    const value = envSource ? (envSource as any)[key] : undefined;
    
    // Verifica se o valor é uma string válida e não um placeholder de erro ("undefined", "null", "")
    if (value === undefined || value === null || value === 'undefined' || value === 'null' || value === '') {
      return fallback;
    }
    return String(value).trim();
  } catch (e) {
    return fallback;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', DEFAULT_URL);
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', DEFAULT_KEY);

// Inicialização segura: Garante que a URL comece com http para não quebrar o construtor do Supabase
const finalUrl = (supabaseUrl && supabaseUrl.startsWith('http')) ? supabaseUrl : DEFAULT_URL;
const finalKey = (supabaseAnonKey && supabaseAnonKey.length > 10) ? supabaseAnonKey : DEFAULT_KEY;

export const supabase = createClient(finalUrl, finalKey);

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
