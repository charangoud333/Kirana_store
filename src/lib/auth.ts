import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  role: 'owner' | 'cashier' | 'helper';
  full_name: string;
  phone: string | null;
  status: 'active' | 'inactive';
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  role: 'owner' | 'cashier' | 'helper' = 'cashier',
  phone: string | null = null
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await (supabase.from('users') as any).insert({
      id: data.user.id,
      full_name: fullName,
      role,
      phone,
      status: 'active',
    });

    if (profileError) throw profileError;
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = (await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()) as { data: {
      role: 'owner' | 'cashier' | 'helper';
      full_name: string;
      phone: string | null;
      status: 'active' | 'inactive';
    } | null };

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email!,
    role: profile.role,
    full_name: profile.full_name,
    phone: profile.phone,
    status: profile.status,
  };
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
};
