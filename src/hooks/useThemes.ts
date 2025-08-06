import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

export interface Theme {
  id: string
  name: string
}

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([])
  useEffect(() => {
    async function fetchThemes() {
      const { data, error } = await supabase
        .from("themes")
        .select<Theme>("id, name")
        .order("name", { ascending: true })
      if (!error && data) {
        setThemes(data)
      }
    }
    fetchThemes()
  }, [])
  return themes
}
