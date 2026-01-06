
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

// Credenciais atualizadas conforme solicitado pelo usuário
const supabaseUrl = 'https://phfodgwnbsmmexextrts.supabase.co';
const supabaseAnonKey = 'sb_publishable_Hc1Bcx7e2eCNwxp21w8FMQ_9J1Z7s21';

// Proteção para garantir que as chaves existem antes de criar o cliente
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase keys are missing. Auth will not work.");
}

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
    // Apenas mapeia se o valor não for undefined
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
      console.error('Error fetching user profile:', error.message || error);
      return null;
    }
    
    return mapToCamelCase(data) as User;
  } catch (err: any) {
    console.error('Supabase connection error:', err.message || err);
    return null;
  }
};
