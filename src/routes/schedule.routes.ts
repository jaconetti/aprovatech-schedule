import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import {
  getPlans,
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
  getScheduleItems,
} from '../controllers/schedule.controller'

const router = Router()

// Todas as rotas requerem autenticação
router.use(authenticate)

// Study Plans
router.get('/plans', getPlans)
router.post('/plans', createPlan)
router.get('/plans/:id', getPlanById)
router.put('/plans/:id', updatePlan)
router.delete('/plans/:id', deletePlan)

// Schedule Items
router.get('/items', getScheduleItems)

export { router as scheduleRoutes }
