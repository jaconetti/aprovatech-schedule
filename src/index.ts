// IMPORTANTE: Carregar config PRIMEIRO
import './config/env'
import { config } from './config/env'

import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import plansRoutes from './routes/plans.routes'
import itemsRoutes from './routes/items.routes'
import { errorHandler } from './middleware/errorHandler'

const app: Application = express()
const PORT = config.port

// Middlewares
app.use(helmet())
app.use(express.json())
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'schedule', timestamp: new Date().toISOString() })
})

// Routes
app.use('/plans', plansRoutes)
app.use('/items', itemsRoutes)

// Error handler (deve ser o último middleware)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`📅 Schedule Service running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
})

