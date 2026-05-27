import { Router } from 'express'
import {
  getScheduleItems,
  getScheduleItemById,
  completeScheduleItem,
  uncompleteScheduleItem,
  updateScheduleItem,
  deleteScheduleItem
} from '../controllers/items.controller'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// Todas as rotas requerem autenticação
router.use(authenticate)

// CRUD de itens do cronograma
router.get('/', getScheduleItems)
router.get('/:id', getScheduleItemById)
router.patch('/:id/complete', completeScheduleItem)
router.patch('/:id/uncomplete', uncompleteScheduleItem)
router.patch('/:id', updateScheduleItem)
router.delete('/:id', deleteScheduleItem)

export default router
