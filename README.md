# Schedule Service — AprovaTech

Microserviço responsável por planos de estudo, cronograma e geração automática de rotinas.

**Porta:** 5002

## 🚀 Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js + TypeScript
- **Auth:** Firebase Admin SDK
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## 📡 Endpoints

### `GET /plans`
Lista planos de estudo do usuário autenticado.

### `POST /plans`
Cria novo plano de estudo com geração automática de cronograma.

### `GET /plans/:id`
Retorna detalhes de um plano específico.

### `PUT /plans/:id`
Atualiza plano de estudo.

### `DELETE /plans/:id`
Remove plano de estudo.

### `GET /items`
Lista itens do cronograma do usuário.

### `PUT /items/:id`
Marca item do cronograma como concluído.

## 🔐 Segurança

- Todas as rotas exigem Bearer Token validado
- RLS ativo no Supabase

## 🛠️ Desenvolvimento

```bash
npm install
cp .env.example .env
npm run dev
```
