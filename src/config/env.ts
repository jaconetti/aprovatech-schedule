import dotenv from 'dotenv'
import { join } from 'path'

// Carregar .env.local ANTES de qualquer outra coisa
dotenv.config({ path: join(process.cwd(), '.env.local') })

console.log('✅ Variáveis de ambiente carregadas')
console.log('📍 SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...')
console.log('📍 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Presente' : '❌ Ausente')
console.log('📍 FIREBASE_ADMIN_PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID)

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  firebase: {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
  },
  port: process.env.PORT || 5002,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000']
  }
}
