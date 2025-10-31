// Utilitário para somar chuva horária por dia
interface HourlyData {
  fullDate?: string;
  precipitation?: number;
  precipitacao_total?: number;
  Chuva_aberta?: number;
  [key: string]: any;
}

export function sumHourlyPrecipitationByDay(hourlyDataArray: HourlyData[]): Array<{ fullDate: string; value: number }> {
  const dailySums: Record<string, number> = {};
  
  for (const item of hourlyDataArray) {
    if (!item.fullDate) continue;
    
    // Extrair valor de precipitação de diferentes campos possíveis
    let precipitation = 0;
    
    if (typeof item.precipitation === 'number') {
      precipitation = item.precipitation;
    } else if (typeof item.precipitacao_total === 'number') {
      precipitation = item.precipitacao_total;
    } else if (typeof item.Chuva_aberta === 'number') {
      precipitation = item.Chuva_aberta;
    }
    
    if (!dailySums[item.fullDate]) {
      dailySums[item.fullDate] = 0;
    }
    dailySums[item.fullDate] += precipitation;
  }
  
  // Retorna array ordenado por data
  return Object.entries(dailySums)
    .map(([fullDate, value]) => ({ fullDate, value }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
}
