# Schedule Service - Guia de Testes de API

## 🔐 Como obter o Bearer Token

### Método 1: Via Console do Navegador (mais fácil)

1. Faça login no sistema pelo navegador (`http://localhost:5000/login`)
2. Abra o DevTools (F12)
3. Cole no console:

```javascript
// Obter token do Firebase
firebase.auth().currentUser.getIdToken().then(token => {
  console.log('Bearer Token:');
  console.log(token);
  // Copiar automaticamente para clipboard
  navigator.clipboard.writeText(token);
  console.log('✅ Token copiado para o clipboard!');
});
```

### Método 2: Via localStorage

No console do navegador após login:

```javascript
// Alternativa via localStorage (se você salvou o token lá)
const token = localStorage.getItem('firebase_token');
console.log('Bearer Token:', token);
navigator.clipboard.writeText(token);
```

### Método 3: Script Node.js

Execute este script na pasta `/schedule`:

```bash
node scripts/get-token.js
```

---

## 📋 Endpoints do Schedule Service

**Base URL**: `http://localhost:5002`

**Autenticação**: Todas as rotas requerem header `Authorization: Bearer <token>`

---

## 1. Plans (Planos de Estudo)

### 1.1 Criar Plano de Estudo

**Endpoint**: `POST /plans`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <seu_token_aqui>
```

**Body**:
```json
{
  "concurso_id": "uuid-do-concurso-opcional",
  "name": "Plano de Estudos - INSS 2026",
  "daily_hours": 4,
  "start_date": "2026-05-21",
  "end_date": "2026-08-20",
  "disciplines": [
    "Direito Administrativo",
    "Direito Constitucional",
    "Português",
    "Raciocínio Lógico"
  ]
}
```

**Resposta Sucesso (201)**:
```json
{
  "plan": {
    "id": "uuid-do-plano",
    "user_id": "uuid-do-usuario",
    "concurso_id": "uuid-do-concurso",
    "name": "Plano de Estudos - INSS 2026",
    "daily_hours": 4,
    "start_date": "2026-05-21",
    "end_date": "2026-08-20",
    "status": "active",
    "created_at": "2026-05-20T16:30:00.000Z"
  },
  "scheduleItemsCount": 240
}
```

---

### 1.2 Listar Planos do Usuário

**Endpoint**: `GET /plans`

**Headers**:
```
Authorization: Bearer <seu_token_aqui>
```

**Resposta Sucesso (200)**:
```json
{
  "plans": [
    {
      "id": "uuid-do-plano",
      "name": "Plano de Estudos - INSS 2026",
      "daily_hours": 4,
      "start_date": "2026-05-21",
      "end_date": "2026-08-20",
      "status": "active",
      "created_at": "2026-05-20T16:30:00.000Z",
      "concursos": {
        "id": "uuid-concurso",
        "name": "INSS - Técnico do Seguro Social",
        "organizer": "CEBRASPE",
        "exam_date": "2026-09-15",
        "status": "open"
      }
    }
  ]
}
```

---

### 1.3 Obter Plano Específico

**Endpoint**: `GET /plans/:id`

**Headers**:
```
Authorization: Bearer <seu_token_aqui>
```

**Exemplo**:
```
GET http://localhost:5002/plans/550e8400-e29b-41d4-a716-446655440000
```

**Resposta Sucesso (200)**:
```json
{
  "plan": {
    "id": "uuid-do-plano",
    "name": "Plano de Estudos - INSS 2026",
    "daily_hours": 4,
    "start_date": "2026-05-21",
    "end_date": "2026-08-20",
    "status": "active",
    "created_at": "2026-05-20T16:30:00.000Z",
    "concursos": {
      "id": "uuid-concurso",
      "name": "INSS - Técnico do Seguro Social",
      "organizer": "CEBRASPE",
      "exam_date": "2026-09-15",
      "status": "open",
      "disciplines": ["Direito Administrativo", "Português", "Raciocínio Lógico"]
    }
  }
}
```

---

### 1.4 Atualizar Plano

**Endpoint**: `PATCH /plans/:id`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <seu_token_aqui>
```

**Body** (todos os campos são opcionais):
```json
{
  "name": "Plano de Estudos INSS - Revisado",
  "daily_hours": 5,
  "status": "active"
}
```

**Resposta Sucesso (200)**:
```json
{
  "plan": {
    "id": "uuid-do-plano",
    "name": "Plano de Estudos INSS - Revisado",
    "daily_hours": 5,
    "status": "active",
    "updated_at": "2026-05-20T17:00:00.000Z"
  }
}
```

---

### 1.5 Deletar Plano

**Endpoint**: `DELETE /plans/:id`

**Headers**:
```
Authorization: Bearer <seu_token_aqui>
```

**Resposta Sucesso (204)**:
```
No Content
```

---

## 2. Items (Itens do Cronograma)

### 2.1 Listar Itens do Cronograma

**Endpoint**: `GET /items?plan_id=<uuid>&date=<YYYY-MM-DD>`

**Query Parameters**:
- `plan_id` (obrigatório): UUID do plano
- `date` (opcional): Data específica no formato YYYY-MM-DD

**Headers**:
```
Authorization: Bearer <seu_token_aqui>
```

**Exemplos**:
```
GET http://localhost:5002/items?plan_id=550e8400-e29b-41d4-a716-446655440000
GET http://localhost:5002/items?plan_id=550e8400-e29b-41d4-a716-446655440000&date=2026-05-21
```

**Resposta Sucesso (200)**:
```json
{
  "items": [
    {
      "id": "uuid-do-item",
      "plan_id": "uuid-do-plano",
      "discipline": "Direito Administrativo",
      "topic": "Bloco 1",
      "scheduled_date": "2026-05-21",
      "duration_minutes": 25,
      "completed": false,
      "completed_at": null,
      "created_at": "2026-05-20T16:30:00.000Z"
    },
    {
      "id": "uuid-do-item-2",
      "plan_id": "uuid-do-plano",
      "discipline": "Português",
      "topic": "Bloco 1",
      "scheduled_date": "2026-05-21",
      "duration_minutes": 25,
      "completed": true,
      "completed_at": "2026-05-21T09:30:00.000Z",
      "created_at": "2026-05-20T16:30:00.000Z"
    }
  ]
}
```

---

### 2.2 Obter Item Específico

**Endpoint**: `GET /items/:id`

**Headers**:
```
Authorization: Bearer <seu_token_aqui>
```

**Resposta Sucesso (200)**:
```json
{
  "item": {
    "id": "uuid-do-item",
    "plan_id": "uuid-do-plano",
    "discipline": "Direito Administrativo",
    "topic": "Bloco 1",
    "scheduled_date": "2026-05-21",
    "duration_minutes": 25,
    "completed": false,
    "completed_at": null
  }
}
```

---

### 2.3 Marcar Item como Concluído

**Endpoint**: `PATCH /items/:id/complete`

**Headers**:
```
Authorization: Bearer <seu_token_aqui>
```

**Body**: Não é necessário

**Resposta Sucesso (200)**:
```json
{
  "item": {
    "id": "uuid-do-item",
    "completed": true,
    "completed_at": "2026-05-20T18:00:00.000Z"
  }
}
```

---

### 2.4 Desmarcar Item como Concluído

**Endpoint**: `PATCH /items/:id/uncomplete`

**Headers**:
```
Authorization: Bearer <seu_token_aqui>
```

**Body**: Não é necessário

**Resposta Sucesso (200)**:
```json
{
  "item": {
    "id": "uuid-do-item",
    "completed": false,
    "completed_at": null
  }
}
```

---

### 2.5 Atualizar Item

**Endpoint**: `PATCH /items/:id`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <seu_token_aqui>
```

**Body** (todos os campos são opcionais):
```json
{
  "discipline": "Direito Constitucional",
  "topic": "Direitos Fundamentais - Capítulo 2",
  "duration_minutes": 50,
  "scheduled_date": "2026-05-22"
}
```

**Resposta Sucesso (200)**:
```json
{
  "item": {
    "id": "uuid-do-item",
    "discipline": "Direito Constitucional",
    "topic": "Direitos Fundamentais - Capítulo 2",
    "duration_minutes": 50,
    "scheduled_date": "2026-05-22"
  }
}
```

---

### 2.6 Deletar Item

**Endpoint**: `DELETE /items/:id`

**Headers**:
```
Authorization: Bearer <seu_token_aqui>
```

**Resposta Sucesso (204)**:
```
No Content
```

---

## 3. Health Check

### 3.1 Verificar Status do Serviço

**Endpoint**: `GET /health`

**Headers**: Não requer autenticação

**Resposta Sucesso (200)**:
```json
{
  "status": "ok",
  "service": "schedule",
  "timestamp": "2026-05-20T16:30:00.000Z"
}
```

---

## 🧪 Exemplos de Testes com cURL

### Criar Plano
```bash
curl -X POST http://localhost:5002/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "Plano INSS 2026",
    "daily_hours": 4,
    "start_date": "2026-05-21",
    "end_date": "2026-08-20",
    "disciplines": ["Direito Administrativo", "Português", "Raciocínio Lógico"]
  }'
```

### Listar Planos
```bash
curl http://localhost:5002/plans \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Listar Itens de um Plano
```bash
curl "http://localhost:5002/items?plan_id=UUID_DO_PLANO" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Marcar Item como Concluído
```bash
curl -X PATCH http://localhost:5002/items/UUID_DO_ITEM/complete \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🧪 Exemplos para Thunder Client / Postman

### 1. Criar Collection

Importe este JSON no Thunder Client:

```json
{
  "client": "Thunder Client",
  "collectionName": "Schedule Service",
  "dateExported": "2026-05-20",
  "version": "1.0",
  "folders": [
    {
      "name": "Plans",
      "requests": []
    },
    {
      "name": "Items",
      "requests": []
    }
  ],
  "requests": []
}
```

### 2. Configurar Variável de Ambiente

Crie um Environment com:
```json
{
  "base_url": "http://localhost:5002",
  "bearer_token": "cole_seu_token_aqui"
}
```

Depois use `{{base_url}}` e `{{bearer_token}}` nas requisições.

---

## ❌ Códigos de Erro

### 401 Unauthorized
```json
{
  "error": "Unauthorized: Missing Bearer token"
}
```
ou
```json
{
  "error": "Unauthorized: Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Acesso negado a este plano"
}
```

### 404 Not Found
```json
{
  "error": "Plano não encontrado"
}
```
ou
```json
{
  "error": "Item não encontrado"
}
```

### 400 Bad Request
```json
{
  "error": "Campos obrigatórios faltando"
}
```
ou
```json
{
  "error": "plan_id é obrigatório"
}
```

### 500 Internal Server Error
```json
{
  "error": "Erro interno do servidor",
  "message": "Descrição do erro (apenas em development)"
}
```

---

## 🔍 Dicas de Teste

1. **Sempre teste o Health Check primeiro** para garantir que o serviço está rodando
2. **Faça login no frontend** antes de extrair o token
3. **O token expira após 1 hora** - se receber 401, gere um novo token
4. **Use o concurso_id do seed**: verifique os UUIDs no banco Supabase
5. **Datas devem estar no formato YYYY-MM-DD**
6. **daily_hours deve estar entre 0.5 e 12**
7. **O algoritmo pula fins de semana automaticamente**

---

## 📊 Fluxo de Teste Recomendado

1. ✅ `GET /health` - Verificar se serviço está rodando
2. ✅ Obter Bearer Token via console do navegador
3. ✅ `POST /plans` - Criar um plano de teste
4. ✅ `GET /plans` - Listar e verificar que plano foi criado
5. ✅ `GET /items?plan_id=<uuid>` - Ver cronograma gerado
6. ✅ `PATCH /items/:id/complete` - Marcar alguns itens como concluídos
7. ✅ `GET /items?plan_id=<uuid>&date=2026-05-21` - Filtrar por data
8. ✅ `PATCH /plans/:id` - Atualizar nome do plano
9. ✅ `DELETE /items/:id` - Deletar um item
10. ✅ `DELETE /plans/:id` - Deletar plano completo
