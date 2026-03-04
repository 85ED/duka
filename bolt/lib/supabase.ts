import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          total_units: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['properties']['Insert']>;
      };
      charges: {
        Row: {
          id: string;
          contract_id: string;
          property_id: string;
          amount: number;
          due_date: string;
          paid_date: string | null;
          status: 'pending' | 'paid' | 'overdue' | 'canceled';
          late_fee: number;
          interest: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['charges']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['charges']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          property_id: string;
          category: string;
          description: string;
          amount: number;
          expense_date: string;
          status: 'pending' | 'paid' | 'canceled';
          payment_method: 'cash' | 'pix' | 'bank_transfer' | 'credit_card' | 'debit_card' | null;
          receipt_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      tenants: {
        Row: {
          id: string;
          owner_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          cpf_cnpj: string | null;
          birth_date: string | null;
          occupation: string | null;
          emergency_contact: string | null;
          emergency_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
    };
  };
};
