/**
 * Algoritmo de geração de cronograma de estudos
 * Distribui as disciplinas de forma equilibrada ao longo do período
 * e insere itens de pausa (Pomodoro) entre os blocos de foco.
 */

export const BREAK_SHORT = 'Pausa Curta'
export const BREAK_LONG  = 'Pausa Longa'

interface GenerateScheduleParams {
  planId: string
  disciplines: string[]
  dailyHours: number
  startDate: Date
  endDate: Date
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
  const { planId, disciplines, dailyHours, startDate, endDate } = params
  const items: ScheduleItem[] = []

  // Total de dias úteis (seg–sex)
  const totalDays = countWeekdays(startDate, endDate)

  // Pomodoros que cabem por dia (simulando pausas reais)
  const blocksPerDay = pomodoroBlocksForHours(dailyHours)

  // Quota de blocos por disciplina
  const blocksPerDiscipline = Math.floor((blocksPerDay * totalDays) / disciplines.length)

  let currentDate = new Date(startDate)
  let disciplineIndex = 0
  const blocksAssigned: { [key: string]: number } = {}
  disciplines.forEach(d => { blocksAssigned[d] = 0 })

  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const dateStr = formatDate(currentDate)
      let pomodoroInDay = 0

      for (let i = 0; i < blocksPerDay; i++) {
        const discipline = disciplines[disciplineIndex]

        if (blocksAssigned[discipline] < blocksPerDiscipline) {
          // Bloco de foco (Pomodoro)
          items.push({
            plan_id: planId,
            discipline,
            topic: `Bloco ${blocksAssigned[discipline] + 1}`,
            scheduled_date: dateStr,
            duration_minutes: 25,
            completed: false,
          })
          blocksAssigned[discipline]++
          pomodoroInDay++

          // Inserir pausa após cada Pomodoro, exceto o último do dia
          if (i < blocksPerDay - 1) {
            const isLongBreak = pomodoroInDay % 4 === 0
            items.push({
              plan_id: planId,
              discipline: isLongBreak ? BREAK_LONG : BREAK_SHORT,
              topic: isLongBreak ? '15 min de descanso' : '5 min de descanso',
              scheduled_date: dateStr,
              duration_minutes: isLongBreak ? 15 : 5,
              completed: false,
            })
          }
        }

        disciplineIndex = (disciplineIndex + 1) % disciplines.length
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)

    const allComplete = disciplines.every(d => blocksAssigned[d] >= blocksPerDiscipline)
    if (allComplete) break
  }

  return items
}

/**
 * Conta quantos Pomodoros (25 min) COMEÇAM dentro do orçamento diário,
 * simulando pausas curtas (5 min) e longa (15 min a cada 4º Pomodoro).
 */
function pomodoroBlocksForHours(dailyHours: number): number {
  const totalMinutes = dailyHours * 60
  let elapsed = 0
  let count = 0

  while (elapsed < totalMinutes) {
    count++
    elapsed += 25
    if (count % 4 === 0) {
      elapsed += 15
    } else {
      elapsed += 5
    }
  }

  return count
}

function countWeekdays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
