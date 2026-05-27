import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'
import { AuthRequest } from '../types'

/**
 * Listar itens do cronograma por plano
 * GET /items?plan_id=<uuid>&date=<YYYY-MM-DD>
 */
export async function getScheduleItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid
    const { plan_id, date } = req.query

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!plan_id) {
      res.status(400).json({ error: 'plan_id é obrigatório' })
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

    // Verificar se o plano pertence ao usuário
    const { data: plan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', plan_id as string)
      .eq('user_id', user.id)
      .single()

    if (!plan) {
      res.status(403).json({ error: 'Acesso negado a este plano' })
      return
    }

    // Query builder
    let query = supabase
      .from('schedule_items')
      .select('*')
      .eq('plan_id', plan_id as string)
      .order('scheduled_date', { ascending: true })

    // Filtrar por data se fornecido
    if (date) {
      query = query.eq('scheduled_date', date as string)
    }

    const { data: items, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ items })
  } catch (error) {
    next(error)
  }
}

/**
 * Obter item específico do cronograma
 * GET /items/:id
 */
export async function getScheduleItemById(
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

    const { data: item, error } = await supabase
      .from('schedule_items')
      .select(`
        *,
        study_plans!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('study_plans.user_id', user.id)
      .single()

    if (error || !item) {
      res.status(404).json({ error: 'Item não encontrado' })
      return
    }

    res.json({ item })
  } catch (error) {
    next(error)
  }
}

/**
 * Marcar item como concluído
 * PATCH /items/:id/complete
 */
export async function completeScheduleItem(
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

    // Verificar se item pertence ao usuário
    const { data: item } = await supabase
      .from('schedule_items')
      .select(`
        *,
        study_plans!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('study_plans.user_id', user.id)
      .single()

    if (!item) {
      res.status(404).json({ error: 'Item não encontrado' })
      return
    }

    // Marcar como concluído
    const { data: updatedItem, error } = await supabase
      .from('schedule_items')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ item: updatedItem })
  } catch (error) {
    next(error)
  }
}

/**
 * Desmarcar item como concluído
 * PATCH /items/:id/uncomplete
 */
export async function uncompleteScheduleItem(
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

    // Verificar se item pertence ao usuário
    const { data: item } = await supabase
      .from('schedule_items')
      .select(`
        *,
        study_plans!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('study_plans.user_id', user.id)
      .single()

    if (!item) {
      res.status(404).json({ error: 'Item não encontrado' })
      return
    }

    // Desmarcar como concluído
    const { data: updatedItem, error } = await supabase
      .from('schedule_items')
      .update({
        completed: false,
        completed_at: null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ item: updatedItem })
  } catch (error) {
    next(error)
  }
}

/**
 * Atualizar item do cronograma
 * PATCH /items/:id
 */
export async function updateScheduleItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.uid
    const { id } = req.params
    const { discipline, topic, duration_minutes, scheduled_date } = req.body

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

    // Verificar se item pertence ao usuário
    const { data: item } = await supabase
      .from('schedule_items')
      .select(`
        *,
        study_plans!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('study_plans.user_id', user.id)
      .single()

    if (!item) {
      res.status(404).json({ error: 'Item não encontrado' })
      return
    }

    const updateData: any = {}
    if (discipline) updateData.discipline = discipline
    if (topic) updateData.topic = topic
    if (duration_minutes) updateData.duration_minutes = duration_minutes
    if (scheduled_date) updateData.scheduled_date = scheduled_date

    const { data: updatedItem, error } = await supabase
      .from('schedule_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ item: updatedItem })
  } catch (error) {
    next(error)
  }
}

/**
 * Deletar item do cronograma
 * DELETE /items/:id
 */
export async function deleteScheduleItem(
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

    // Verificar se item pertence ao usuário
    const { data: item } = await supabase
      .from('schedule_items')
      .select(`
        *,
        study_plans!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('study_plans.user_id', user.id)
      .single()

    if (!item) {
      res.status(404).json({ error: 'Item não encontrado' })
      return
    }

    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
