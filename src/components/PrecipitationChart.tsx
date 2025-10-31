import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, LineChart, Line, ComposedChart } from "recharts";
import { useState, useEffect } from "react";
import { HourlyPrecipitationChart } from "./HourlyPrecipitationChart";
import { sumHourlyPrecipitationByDay } from "../lib/sumHourlyPrecipitationByDay";

interface PrecipitationChartProps {
  data: { day: string; fullDate?: string; value: number }[];
  lojaId: number;
}

export const PrecipitationChart = ({ data, lojaId }: PrecipitationChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHourlyChart, setShowHourlyChart] = useState(false);
  const [hourlyDataAll, setHourlyDataAll] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<Array<Record<string, unknown>>>([]);

  // Buscar todos os dados horários ao montar
  useEffect(() => {
    async function fetchAllHourly() {
      setIsLoading(true);
      try {
        // Filtrar apenas hoje e dias futuros
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureData = data.filter(dayData => {
          if (!dayData.fullDate) return false;
          const dayDate = new Date(dayData.fullDate);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate >= today;
        });
        
        console.log(`📊 Buscando dados horários para ${futureData.length} dias em paralelo...`);
        
        // OTIMIZAÇÃO: Buscar dados horários em PARALELO com Promise.all
        const fetchPromises = futureData.map(async (dayData) => {
          if (!dayData.fullDate) return [];
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout por requisição
            
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/hourly-precipitation/${dayData.fullDate}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              console.warn(`⚠️ Status ${response.status} para ${dayData.fullDate}`);
              return [];
            }
            
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
              console.log(`✅ ${dayData.fullDate}: ${result.data.length} horas carregadas`);
              // Adiciona fullDate em cada item para facilitar agrupamento
              return result.data.map((item: Record<string, unknown>) => ({
                ...item,
                fullDate: dayData.fullDate
              }));
            }
            return [];
          } catch (err) {
            const errorMsg = err instanceof Error && err.name === 'AbortError' 
              ? 'Timeout' 
              : 'Erro de rede';
            console.warn(`⚠️ ${errorMsg} ao buscar ${dayData.fullDate}`);
            return [];
          }
        });
        
        // Espera TODAS as requisições terminarem (paralelo)
        const results = await Promise.all(fetchPromises);
        const allHourlyData = results.flat();
        
        console.log(`✅ Total de ${allHourlyData.length} registros horários carregados`);
        setHourlyDataAll(allHourlyData);
      } catch (err) {
        console.error('❌ Erro ao buscar dados horários:', err);
        setHourlyDataAll([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (data.length > 0) {
      fetchAllHourly();
    } else {
      setIsLoading(false);
    }
  }, [data]);

  // Somar chuva horária por dia
  const dailySums = sumHourlyPrecipitationByDay(hourlyDataAll);
  
  // Filtrar apenas hoje e dias futuros para o fallback também
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDataFallback = data.filter(d => {
    if (!d.fullDate) return false;
    const dayDate = new Date(d.fullDate);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate >= today;
  }).map(d => ({ fullDate: d.fullDate || '', value: d.value || 0 }));
  
  // Se não houver dados horários, usar dados do prop (pode ser vazio, mas exibe o gráfico)
  const dataToUse = dailySums.length > 0 ? dailySums : futureDataFallback;
  
  // Calcular precipitação acumulada e estatísticas a partir dos somatórios diários
  const processedData = dataToUse.map((item, index) => {
    return {
      ...item,
      rainDaily: Number(item.value) || 0,
      day: item.fullDate ? new Date(item.fullDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
      dayIndex: index
    };
  });
  
  const precipitations: number[] = processedData.map(d => Number(d.rainDaily) || 0);
  const totalRain: number = precipitations.reduce((a, b) => a + b, 0);
  const maxRain: number = precipitations.length > 0 ? Math.max(...precipitations) : 0;
  const todayRain: number = processedData.length > 0 ? (Number(processedData[0].rainDaily) || 0) : 0;
  
  // Classificar tipo de precipitação
  const getRainType = (rain: number) => {
    if (rain === 0) return { type: "Sem Chuva", icon: "☀️", color: "#f59e0b" };
    if (rain < 2.5) return { type: "Garoa", icon: "🌦️", color: "#10b981" };
    if (rain < 10) return { type: "Chuva Fraca", icon: "🌧️", color: "#3b82f6" };
    if (rain < 50) return { type: "Chuva Moderada", icon: "⛈️", color: "#8b5cf6" };
    return { type: "Chuva Forte", icon: "🌩️", color: "#ef4444" };
  };
  
  const getWeatherIcon = (totalRain: number) => {
    if (totalRain < 5) return "☀️";
    if (totalRain < 20) return "🌤️";
    if (totalRain < 50) return "🌧️";
    return "⛈️";
  };
  
  // Função para lidar com cliques no gráfico - agora apenas filtra dados já carregados
  const handleBarClick = (clickData: { fullDate?: string }) => {
    if (clickData && clickData.fullDate) {
      setSelectedDate(clickData.fullDate);
      setShowHourlyChart(true);
      // Filtra dados horários do dia selecionado
      setHourlyData(hourlyDataAll.filter(d => d.fullDate === clickData.fullDate));
    }
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: typeof processedData[number] }>;
    label?: string;
  }
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const rainValue: number = Number(data.rainDaily) || 0;
      const rainInfo = getRainType(rainValue);
      return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 shadow-xl">
          <div className="border-b border-[hsl(var(--border))] pb-2 mb-2">
            <p className="font-bold text-[hsl(var(--card-foreground))] text-lg">{label}</p>
            {data.fullDate && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {new Date(data.fullDate + 'T00:00:00').toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{rainInfo.icon}</span>
              <div>
                <p className="text-lg font-bold" style={{ color: rainInfo.color }}>
                  {rainValue.toFixed(1)}mm
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {rainInfo.type}
                </p>
              </div>
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
              <p>⛈️ Pico máximo: {maxRain.toFixed(1)}mm</p>
              <p>💦 Total previsto: {totalRain.toFixed(1)}mm</p>
              <div className="mt-2 pt-1 border-t border-[hsl(var(--border))]">
                <p className="text-blue-600 font-semibold">👆 Clique para ver detalhes por hora</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 shadow-lg animate-fade-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--card-foreground))] mb-2">
            🌧️ Previsão de Precipitação 
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Clique em um dia para ver precipitação por hora
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 italic">
            ℹ️ Dados do modelo GFS/NOMADS (atualização a cada 6h - valores distribuídos uniformemente)
          </p>
          {/* Indicador de loading */}
          {isLoading && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
              <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Carregando dados horários...
            </div>
          )}
        </div>
        
        {/* Informações da precipitação */}
        <div className="text-right space-y-3">
          {/* Previsão para hoje */}
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl">{getWeatherIcon(todayRain)}</span>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {todayRain.toFixed(1)}mm
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Hoje
              </div>
            </div>
          </div>
          
          {/* Total previsto acumulado */}
          <div className="flex items-center gap-2 justify-end pt-2 border-t border-[hsl(var(--border))]">
            <span className="text-xl">💧</span>
            <div>
              <div className="text-base font-semibold text-[hsl(var(--card-foreground))]">
                {totalRain.toFixed(1)}mm
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Total Acumulado
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Carregando dados de precipitação...</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
            <ComposedChart 
              data={processedData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onMouseMove={(e: { activeTooltipIndex?: number }) => {
                if (e.activeTooltipIndex !== undefined) {
                  setHoveredPoint(e.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={(e: { activePayload?: Array<{ payload: { fullDate?: string } }> }) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  handleBarClick(e.activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3} 
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(value) => `${Number(value).toFixed(1)}mm`}
                domain={[0, 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Sem legenda */}
              
              {/* Barras de precipitação diária */}
              <Bar
                dataKey="rainDaily"
                name="🌧️ Precipitação Diária (mm)"
                fill="#3b82f6"
                opacity={0.8}
                radius={[4, 4, 0, 0]}
                style={{ cursor: 'pointer' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
      )}

      {/* Modal do gráfico horário */}
      {showHourlyChart && selectedDate && (
        <HourlyPrecipitationChart
          date={selectedDate}
          data={hourlyData.map((d) => ({
            hour: String(d.hour || ''),
            precipitation: typeof d.precipitation === 'number' ? d.precipitation : 
                          typeof d.precipitacao_total === 'number' ? d.precipitacao_total :
                          typeof d.Chuva_aberta === 'number' ? d.Chuva_aberta : 0,
            temperature: typeof d.temperature === 'number' ? d.temperature : undefined
          }))}
          onClose={() => {
            setShowHourlyChart(false);
            setHourlyData([]);
          }}
        />
      )}
    </div>
  );
};