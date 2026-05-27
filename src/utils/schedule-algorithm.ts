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

  // Calcular total de dias disponíveis (excluindo fins de semana)
  const totalDays = countWeekdays(startDate, endDate)
  
  // Horas totais disponíveis
  const totalHours = totalDays * dailyHours
  
  // Distribuir horas por disciplina (equilibrado)
  const hoursPerDiscipline = totalHours / disciplines.length
  
  // Converter para minutos (mais fácil de dividir)
  const minutesPerDiscipline = hoursPerDiscipline * 60
  
  // Dividir em blocos de estudo (Pomodoro: 25min estudo + 5min pausa)
  const blockDuration = 25 // minutos por bloco de estudo
  const blocksPerDiscipline = Math.floor(minutesPerDiscipline / blockDuration)

  // Distribuir blocos ao longo dos dias
  let currentDate = new Date(startDate)
  let disciplineIndex = 0
  let blocksAssigned: { [key: string]: number } = {}
  
  // Inicializar contador de blocos por disciplina
  disciplines.forEach(d => {
    blocksAssigned[d] = 0
  })

  // Gerar cronograma
  while (currentDate <= endDate) {
    // Pular fins de semana
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Quantos blocos de 25min cabem nas horas diárias?
      const blocksPerDay = Math.floor((dailyHours * 60) / 25)
      
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
            duration_minutes: blockDuration,
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

