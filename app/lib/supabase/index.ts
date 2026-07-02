// Cliente singleton de Supabase para uso en Client Components.
// Este archivo arregla el build: 17+ archivos hacen `import { supabase } from "./supabase"`
// apuntando a esta carpeta, pero faltaba este index.ts.
import { createClient } from "./client";

export const supabase = createClient();
