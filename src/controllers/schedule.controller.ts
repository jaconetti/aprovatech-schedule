import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'
import { generateSchedule } from '../utils/schedule-algorithm'

// ── Validation Schemas ──────────────────────────────────────────────────────

const createPlanSchema = z.object({
  concurso_id: z.string().uuid(),
  target_date: z.string().datetime(),
  weekly_hours: z.number().min(1).max(80),
  study_method: z.enum(['pomodoro', 'traditional', 'active_recall', 'spaced_repetition']),
  subjects: z.array(
    z.object({
      name: z.string().min(1),
      weight: z.number().min(1).max(10),
    })
  ).min(1),
})

const updatePlanSchema = z.object({
  target_date: z.string().datetime().optional(),
  weekly_hours: z.number().min(1).max(80).optional(),
  study_method: z.enum(['pomodoro', 'traditional', 'active_recall', 'spaced_repetition']).optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
})

// ── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /plans
 * Lista todos os planos de estudo do usuário autenticado
 */
export async function getPlans(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { data, error } = await supabase
      .from('study_plans')
      .select(`
        *,
        concursos (
          name,
          institution,
          exam_date
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar planos:', error)
      res.status(500).json({ error: 'Erro ao buscar planos de estudo' })
      return
    }

    res.json({ data })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /plans
 * Cria novo plano de estudo e gera cronograma automaticamente
 */
export async function createPlan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Validar dados
    const validation = createPlanSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(400).json({ error: 'Dados inválidos', details: validation.error })
      return
    }

    const { concurso_id, target_date, weekly_hours, study_method, subjects } = validation.data

    // Criar plano de estudo
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id: userId,
        concurso_id,
        target_date,
        weekly_hours,
        study_method,
        subjects,
        status: 'active',
      })
      .select()
      .single()

    if (planError || !plan) {
      console.error('Erro ao criar plano:', planError)
      res.status(500).json({ error: 'Erro ao criar plano de estudo' })
      return
    }

    // Gerar cronograma automático
    const scheduleItems = generateSchedule({
      planId: plan.id,
      subjects,
      weeklyHours: weekly_hours,
      targetDate: new Date(target_date),
      startDate: new Date(),
    })

    // Inserir itens do cronograma
    const { error: itemsError } = await supabase
      .from('schedule_items')
      .insert(scheduleItems)

    if (itemsError) {
      console.error('Erro ao criar itens do cronograma:', itemsError)
      // Rollback: deletar plano criado
      await supabase.from('study_plans').delete().eq('id', plan.id)
      res.status(500).json({ error: 'Erro ao gerar cronograma' })
      return
    }

    res.status(201).json({
      message: 'Plano de estudo criado com sucesso',
      data: plan,
      scheduleItemsCount: scheduleItems.length,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /plans/:id
 * Busca detalhes de um plano específico
 */
export async function getPlanById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { data, error } = await supabase
      .from('study_plans')
      .select(`
        *,
        concursos (
          name,
          institution,
          exam_date,
          syllabus
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Plano não encontrado' })
      return
    }

    res.json({ data })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /plans/:id
 * Atualiza plano de estudo
 */
export async function updatePlan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const validation = updatePlanSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(400).json({ error: 'Dados inválidos', details: validation.error })
      return
    }

    const { data, error } = await supabase
      .from('study_plans')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Plano não encontrado' })
      return
    }

    res.json({ message: 'Plano atualizado com sucesso', data })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /plans/:id
 * Remove plano de estudo
 */
export async function deletePlan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Soft delete: apenas marca como cancelled
    const { error } = await supabase
      .from('study_plans')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      res.status(404).json({ error: 'Plano não encontrado' })
      return
    }

    res.json({ message: 'Plano removido com sucesso' })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /items
 * Lista itens do cronograma (com filtros opcionais)
 */
export async function getScheduleItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid
    const { plan_id, date_from, date_to } = req.query

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    let query = supabase
      .from('schedule_items')
      .select(`
        *,
        study_plans!inner (
          id,
          user_id,
          concursos (name)
        )
      `)
      .eq('study_plans.user_id', userId)

    if (plan_id) {
      query = query.eq('plan_id', plan_id)
    }

    if (date_from) {
      query = query.gte('scheduled_date', date_from)
    }

    if (date_to) {
      query = query.lte('scheduled_date', date_to)
    }

    query = query.order('scheduled_date', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar itens do cronograma:', error)
      res.status(500).json({ error: 'Erro ao buscar cronograma' })
      return
    }

    res.json({ data })
  } catch (error) {
    next(error)
  }
}
