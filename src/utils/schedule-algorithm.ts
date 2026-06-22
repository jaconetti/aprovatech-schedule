/**
 * Algoritmo de geração de cronograma de estudos (Pomodoro)
 * Suporta dois modos:
 *  - rotativo:    disciplinas se revezam automaticamente em grupos de 3 Pomodoros
 *  - predefinido: o aluno define quais disciplinas estudar em cada dia da semana
 */

export const BREAK_SHORT = 'Pausa Curta'
export const BREAK_LONG  = 'Pausa Longa'

/** Pomodoros consecutivos por disciplina antes de alternar */
const POMODOROS_PER_BLOCK = 3

export interface GenerateScheduleParams {
  planId: string
  disciplines: string[]
  dailyHours: number
  startDate: Date
  endDate: Date
  tipo: 'rotativo' | 'predefinido'
  /** Para predefinido: chave = getDay() (1=Seg…5=Sex), valor = disciplinas do dia */
  dayDisciplines?: Record<number, string[]>
}

interface ScheduleItem {
  plan_id: string
  discipline: string
  topic: string
  scheduled_date: string
  duration_minutes: number
  completed: boolean
}

export function generateSchedule(params: GenerateScheduleParams): ScheduleItem[] {
  if (params.tipo === 'predefinido' && params.dayDisciplines) {
    return generatePredefinido(params)
  }
  return generateRotativo(params)
}

// ─────────────────────────────────────────────────────────────────────────────
// Rotativo: distribui disciplinas em grupos de POMODOROS_PER_BLOCK
// ─────────────────────────────────────────────────────────────────────────────
function generateRotativo(params: GenerateScheduleParams): ScheduleItem[] {
  const { planId, disciplines, dailyHours, startDate, endDate } = params
  const items: ScheduleItem[] = []

  const blocksPerDay      = pomodoroBlocksForHours(dailyHours)
  const totalDays         = countWeekdays(startDate, endDate)
  const blocksPerDisc     = Math.floor((blocksPerDay * totalDays) / disciplines.length)

  const blocksAssigned: Record<string, number> = {}
  disciplines.forEach(d => { blocksAssigned[d] = 0 })

  let currentDate    = new Date(startDate)
  let discIndex      = 0
  let pomodorosInGrp = 0      // Pomodoros feitos da disciplina atual

  while (currentDate <= endDate) {
    if (isWeekday(currentDate)) {
      const dateStr    = formatDate(currentDate)
      let pomodoroInDay = 0

      for (let i = 0; i < blocksPerDay; i++) {
        // Trocar disciplina após POMODOROS_PER_BLOCK consecutivos
        if (pomodorosInGrp >= POMODOROS_PER_BLOCK) {
          discIndex = (discIndex + 1) % disciplines.length
          pomodorosInGrp = 0
        }

        const disc = disciplines[discIndex]

        if (blocksAssigned[disc] < blocksPerDisc) {
          items.push(makeFocus(planId, disc, blocksAssigned[disc], dateStr))
          blocksAssigned[disc]++
          pomodorosInGrp++
          pomodoroInDay++

          if (i < blocksPerDay - 1) {
            items.push(makeBreak(planId, pomodoroInDay, dateStr))
          }
        } else {
          // Disciplina completa — avança para a próxima
          discIndex = (discIndex + 1) % disciplines.length
          pomodorosInGrp = 0
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)

    if (disciplines.every(d => blocksAssigned[d] >= blocksPerDisc)) break
  }

  return items
}

// ─────────────────────────────────────────────────────────────────────────────
// Pré-definido: aluno escolhe quais disciplinas estudar em cada dia da semana
// ─────────────────────────────────────────────────────────────────────────────
function generatePredefinido(params: GenerateScheduleParams): ScheduleItem[] {
  const { planId, dailyHours, startDate, endDate, dayDisciplines = {} } = params
  const items: ScheduleItem[] = []
  const blocksPerDay = pomodoroBlocksForHours(dailyHours)

  const blocksAssignedGlobal: Record<string, number> = {}

  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()   // 1=Seg…5=Sex
    const dayDiscs  = dayDisciplines[dayOfWeek] ?? []

    if (dayDiscs.length > 0) {
      const dateStr   = formatDate(currentDate)
      const todayAsgn: Record<string, number> = {}
      dayDiscs.forEach(d => { todayAsgn[d] = 0 })

      let localDiscIdx   = 0
      let pomodorosInGrp = 0
      let pomodoroInDay  = 0

      for (let i = 0; i < blocksPerDay; i++) {
        if (pomodorosInGrp >= POMODOROS_PER_BLOCK) {
          localDiscIdx = (localDiscIdx + 1) % dayDiscs.length
          pomodorosInGrp = 0
        }

        const disc = dayDiscs[localDiscIdx]
        const globalIdx = blocksAssignedGlobal[disc] ?? 0

        items.push(makeFocus(planId, disc, globalIdx, dateStr))
        blocksAssignedGlobal[disc] = globalIdx + 1
        todayAsgn[disc]++
        pomodorosInGrp++
        pomodoroInDay++

        if (i < blocksPerDay - 1) {
          items.push(makeBreak(planId, pomodoroInDay, dateStr))
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return items
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeFocus(
  planId: string, discipline: string, blockIndex: number, date: string
): ScheduleItem {
  return {
    plan_id: planId,
    discipline,
    topic: `Bloco ${blockIndex + 1}`,
    scheduled_date: date,
    duration_minutes: 25,
    completed: false,
  }
}

function makeBreak(planId: string, pomodoroInDay: number, date: string): ScheduleItem {
  const isLong = pomodoroInDay % 4 === 0
  return {
    plan_id: planId,
    discipline: isLong ? BREAK_LONG : BREAK_SHORT,
    topic: isLong ? '15 min de descanso' : '5 min de descanso',
    scheduled_date: date,
    duration_minutes: isLong ? 15 : 5,
    completed: false,
  }
}

/**
 * Conta quantos Pomodoros (25 min) COMEÇAM dentro do orçamento diário,
 * simulando pausas curtas (5 min) e longa (15 min a cada 4º Pomodoro).
 */
export function pomodoroBlocksForHours(dailyHours: number): number {
  const totalMinutes = dailyHours * 60
  let elapsed = 0, count = 0
  while (elapsed < totalMinutes) {
    count++
    elapsed += 25
    if (count % 4 === 0) elapsed += 15
    else elapsed += 5
  }
  return count
}

function isWeekday(date: Date): boolean {
  const d = date.getDay()
  return d >= 1 && d <= 5
}

function countWeekdays(startDate: Date, endDate: Date): number {
  let count = 0
  const cur = new Date(startDate)
  while (cur <= endDate) {
    if (isWeekday(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
