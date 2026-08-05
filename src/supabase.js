import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// sessionStorage en vez de localStorage: la sesión desaparece al cerrar el
// navegador del todo, para no dejar cuentas de Dirección logueadas de forma
// indefinida en equipos compartidos (p. ej. el ordenador de recepción).
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { storage: window.sessionStorage },
})