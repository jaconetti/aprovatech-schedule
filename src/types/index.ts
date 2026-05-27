import { Request } from 'express'

export interface AuthRequest extends Request {
  user?: {
    uid: string
    email?: string
    role: 'student' | 'admin'
  }
}

export interface Subject {
  name: string
  weight: number
}

export interface ScheduleItem {
  plan_id: string
  subject: string
  scheduled_date: string
  duration_minutes: number
  status: 'pending' | 'completed' | 'skipped'
}
