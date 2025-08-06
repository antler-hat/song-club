import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Theme {
  id: string
  name: string
}

async function fetchThemes(): Promise<Theme[]> {
  const { data, error } = await supabase
    .from('themes')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as Theme[]
}

export function useThemes(): Theme[] {
  const query = useQuery<Theme[], Error>({
    queryKey: ['themes'],
    queryFn: fetchThemes,
    staleTime: Infinity,
  })
  return query.data ?? []
}
