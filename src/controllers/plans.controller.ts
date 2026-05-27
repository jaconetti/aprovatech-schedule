import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'
import { AuthRequest } from '../types'
import { generateSchedule } from '../utils/schedule-algorithm'

/**
 * Criar novo plano de estudo
 * POST /plans
 */
export async function createStudyPlan(
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

    const {
      concurso_id,
      name,
      daily_hours,
      start_date,
      end_date,
      disciplines
    } = req.body

    // Validações
    if (!name || !daily_hours || !start_date || !end_date || !disciplines) {
      res.status(400).json({ error: 'Campos obrigatórios faltando' })
      return
    }

    if (daily_hours < 0.5 || daily_hours > 12) {
      res.status(400).json({ error: 'Horas diárias deve estar entre 0.5 e 12' })
      return
    }

    // Buscar user_id do Supabase pelo firebase_uid
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', userId)
      .single()

    if (userError || !user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    // Criar plano de estudo
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        concurso_id: concurso_id || null,
        name,
        daily_hours,
        start_date,
        end_date,
        status: 'active'
      })
      .select()
      .single()

    if (planError) {
      console.error('Erro ao criar plano:', planError)
      res.status(500).json({ error: planError.message })
      return
    }

    // Gerar cronograma automaticamente
    const scheduleItems = generateSchedule({
      planId: plan.id,
      disciplines,
      dailyHours: daily_hours,
      startDate: new Date(start_date),
      endDate: new Date(end_date)
    })

    // Inserir itens do cronograma
    const { error: itemsError } = await supabase
      .from('schedule_items')
      .insert(scheduleItems)

    if (itemsError) {
      console.error('Erro ao criar itens do cronograma:', itemsError)
      // Não retornar erro aqui - plano foi criado com sucesso
    }

    res.status(201).json({ plan, scheduleItemsCount: scheduleItems.length })
  } catch (error) {
    next(error)
  }
}

/**
 * Listar planos de estudo do usuário
 * GET /plans
 */
export async function getStudyPlans(
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

    // Buscar user_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', userId)
      .single()

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    const { data: plans, error } = await supabase
      .from('study_plans')
      .select(`
        *,
        concursos (
          id,
          name,
          organizer,
          exam_date,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ plans })
  } catch (error) {
    next(error)
  }
}

/**
 * Obter plano de estudo específico
 * GET /plans/:id
 */
export async function getStudyPlanById(
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

    // Buscar user_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', userId)
      .single()

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    const { data: plan, error } = await supabase
      .from('study_plans')
      .select(`
        *,
        concursos (
          id,
          name,
          organizer,
          exam_date,
          status,
          disciplines
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !plan) {
      res.status(404).json({ error: 'Plano não encontrado' })
      return
    }

    res.json({ plan })
  } catch (error) {
    next(error)
  }
}

/**
 * Atualizar plano de estudo
 * PATCH /plans/:id
 */
export async function updateStudyPlan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid
    const { id } = req.params
    const { name, daily_hours, status } = req.body

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Buscar user_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', userId)
      .single()

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (daily_hours) updateData.daily_hours = daily_hours
    if (status) updateData.status = status

    const { data: plan, error } = await supabase
      .from('study_plans')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !plan) {
      res.status(404).json({ error: 'Plano não encontrado' })
      return
    }

    res.json({ plan })
  } catch (error) {
    next(error)
  }
}

/**
 * Deletar plano de estudo
 * DELETE /plans/:id
 */
export async function deleteStudyPlan(
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

    // Buscar user_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', userId)
      .single()

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      res.status(404).json({ error: 'Plano não encontrado' })
      return
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
