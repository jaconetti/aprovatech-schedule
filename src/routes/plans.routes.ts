import { Router } from 'express'
import {
  createStudyPlan,
  getStudyPlans,
  getStudyPlanById,
  updateStudyPlan,
  deleteStudyPlan
} from '../controllers/plans.controller'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// Todas as rotas requerem autenticação
router.use(authenticate)

// CRUD de planos de estudo
router.post('/', createStudyPlan)
router.get('/', getStudyPlans)
router.get('/:id', getStudyPlanById)
router.patch('/:id', updateStudyPlan)
router.delete('/:id', deleteStudyPlan)

export default router
