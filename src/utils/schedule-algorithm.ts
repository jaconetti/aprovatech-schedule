/**
 * Algoritmo de geração de cronograma de estudos
 * Distribui as disciplinas de forma equilibrada ao longo do período
 */

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

  // Calcular total de dias úteis disponíveis (seg–sex)
  const totalDays = countWeekdays(startDate, endDate)

  // Quantos Pomodoros cabem por dia (contando pausas reais)
  const blocksPerDay = pomodoroBlocksForHours(dailyHours)

  // Blocos por disciplina distribuídos igualmente
  const blocksPerDiscipline = Math.floor((blocksPerDay * totalDays) / disciplines.length)

  // Distribuir blocos ao longo dos dias
  let currentDate = new Date(startDate)
  let disciplineIndex = 0
  const blocksAssigned: { [key: string]: number } = {}

  disciplines.forEach(d => {
    blocksAssigned[d] = 0
  })

  // Gerar cronograma
  while (currentDate <= endDate) {
    // Pular fins de semana
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      
      // Distribuir blocos do dia entre as disciplinas
      for (let i = 0; i < blocksPerDay; i++) {
        const discipline = disciplines[disciplineIndex]
        
        // Verificar se a disciplina ainda precisa de blocos
        if (blocksAssigned[discipline] < blocksPerDiscipline) {
          items.push({
            plan_id: planId,
            discipline,
            topic: `Bloco ${blocksAssigned[discipline] + 1}`,
            scheduled_date: formatDate(currentDate),
            duration_minutes: 25,
            completed: false
          })
          
          blocksAssigned[discipline]++
        }
        
        // Rotacionar para próxima disciplina
        disciplineIndex = (disciplineIndex + 1) % disciplines.length
      }
    }
    
    // Próximo dia
    currentDate.setDate(currentDate.getDate() + 1)
    
    // Verificar se todas as disciplinas atingiram o objetivo
    const allComplete = disciplines.every(d => blocksAssigned[d] >= blocksPerDiscipline)
    if (allComplete) break
  }

  return items
}

/**
 * Calcular quantos Pomodoros (blocos de 25 min) cabem no orçamento diário
 * considerando pausas curtas (5 min) após cada Pomodoro e pausa longa (15 min)
 * a cada 4 Pomodoros. Um Pomodoro "conta" se ele COMEÇA dentro do orçamento,
 * mesmo que as pausas finais ultrapassem levemente (comportamento esperado).
 */
function pomodoroBlocksForHours(dailyHours: number): number {
  const totalMinutes = dailyHours * 60
  let elapsed = 0
  let count = 0

  while (elapsed < totalMinutes) {
    count++
    elapsed += 25 // foco
    if (count % 4 === 0) {
      elapsed += 15 // pausa longa
    } else {
      elapsed += 5  // pausa curta
    }
  }

  return count
}

/**
 * Contar dias úteis (seg-sex) entre duas datas
 */
function countWeekdays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

/**
 * Formatar data para YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

