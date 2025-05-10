import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

interface Transaction {
  subtotal: number;
  tax: number;
  total: number;
  state: string;
  user_id: string;
}

export const posDB = {
  async saveTransaction(data: Transaction) {
    const { error } = await supabase
      .from('transactions')
      .insert(data);
    
    if (error) throw error;
  },

  async getTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getExpiringProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('expiry_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .gte('expiry_date', new Date())
      .order('expiry_date');

    if (error) throw error;
    return data;
  }
};