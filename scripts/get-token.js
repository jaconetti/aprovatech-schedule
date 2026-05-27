/**
 * Script para obter Bearer Token do Firebase para testes
 * 
 * IMPORTANTE: Este script é apenas para desenvolvimento!
 * Nunca use em produção.
 * 
 * Como usar:
 * 1. Faça login no sistema pelo navegador
 * 2. Execute: node scripts/get-token.js
 * 3. Cole suas credenciais quando solicitado
 */

const readline = require('readline')
const https = require('https')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const FIREBASE_API_KEY = 'AIzaSyB-RTyt2qFdAOpzVo2ooUuiahBf11-igfQ'

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function getTokenWithEmailPassword(email, password) {
  const data = JSON.stringify({
    email,
    password,
    returnSecureToken: true
  })

  const options = {
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(body)
          resolve(response.idToken)
        } else {
          reject(new Error(`Erro na autenticação: ${body}`))
        }
      })
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function main() {
  console.log('🔐 Gerador de Bearer Token para Testes\n')
  console.log('⚠️  ATENÇÃO: Use apenas em desenvolvimento!\n')

  try {
    const email = await question('Email: ')
    const password = await question('Senha: ')

    console.log('\n⏳ Autenticando...\n')

    const token = await getTokenWithEmailPassword(email, password)

    console.log('✅ Token gerado com sucesso!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Bearer Token:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(token)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📋 Use este token no header Authorization:\n')
    console.log(`Authorization: Bearer ${token}\n`)

    console.log('🧪 Exemplo de teste com cURL:\n')
    console.log(`curl http://localhost:5002/plans \\`)
    console.log(`  -H "Authorization: Bearer ${token}"\n`)

    console.log('⏰ O token expira em 1 hora\n')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
