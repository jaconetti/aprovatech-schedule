import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'

/**
 * Listar concursos disponíveis para seleção no plano de estudo
 * GET /concursos
 */
export async function listConcursos(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data: concursos, error } = await supabase
      .from('concursos')
      .select('id, name, organizer, status, exam_date, disciplines')
      .order('name', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ concursos })
  } catch (error) {
    next(error)
  }
}
