import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { listConcursos } from '../controllers/concursos.controller'

const router = Router()

router.use(authenticate)

router.get('/', listConcursos)

export default router
