import { initDataSync } from '@paysurity/datasync';

export const posDB = initDataSync({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  tables: ['cart', 'orders', 'menu_items']
});