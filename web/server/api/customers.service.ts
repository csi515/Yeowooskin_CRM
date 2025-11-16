import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getCustomers() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.from('customers').select('*')
  if (error) throw new Error(error.message)
  return data || []
}


