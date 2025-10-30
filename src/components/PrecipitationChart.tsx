import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, LineChart, Line, ComposedChart } from "recharts";
import { useState } from "react";
import { HourlyPrecipitationChart } from "./HourlyPrecipitationChart";


interface PrecipitationChartProps {
  data: { day: string; fullDate?: string; value: number }[];
  lojaId: number;
}

export const PrecipitationChart = ({ data, lojaId }: PrecipitationChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHourlyChart, setShowHourlyChart] = useState(false);
  interface HourlyPrecipitationData {
    hour: string;
    precipitacao_total: number;
    precipitation?: number;
    temperature?: number;
    [key: string]: unknown;
  }
  const [hourlyData, setHourlyData] = useState<HourlyPrecipitationData[]>([]);
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);

  // Validação dos dados
  const chartData = Array.isArray(data) ? data : [];
  
  // Normaliza valores: <2mm vira 0mm, não contam para totais
  const normalizeRain = (v: number) => (v >= 2 ? v : 0);
  let accumulated = 0;
  const processedData = chartData.map((item, index) => {
    const rain = normalizeRain(item.value);
    accumulated += rain;
    return {
      ...item,
      rainDaily: rain,
      rainAccumulated: accumulated,
      dayIndex: index
    };
  });
  // Só considera valores >=2mm para totais e estatísticas
  const precipitations = chartData.map(d => normalizeRain(d.value));
  const totalRain = precipitations.reduce((a, b) => a + b, 0);
  const avgRain = precipitations.length > 0 ? totalRain / precipitations.length : 0;
  const maxRain = precipitations.length > 0 ? Math.max(...precipitations) : 0;
  const rainyDays = precipitations.filter(p => p >= 2).length; // Dias com chuva relevante
  
  // Classificar tipo de precipitação
  // Para tooltip: se <2mm, mostra "Sem Chuva"
  const getRainType = (rain: number) => {
    if (rain < 2) return { type: "Sem Chuva", icon: "☀️", color: "#f59e0b" };
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
  
  // Função para lidar com cliques no gráfico
  // Corrigido: buscar do endpoint correto de precipitação horária
  const handleBarClick = async (data: { fullDate?: string }) => {
    if (data && data.fullDate) {
      setSelectedDate(data.fullDate);
      setIsLoadingHourly(true);
      setShowHourlyChart(true);
      try {
        // Busca do endpoint correto
        const response = await fetch(`${import.meta.env.VITE_API_URL}/hourly-precipitation/${data.fullDate}`);
        const result = await response.json();
        if (result.success && result.data) {
          // Normaliza para o formato esperado pelo HourlyPrecipitationChart
          setHourlyData(result.data.map((d: HourlyPrecipitationData) => ({
            hour: d.hour,
            precipitation: (typeof d.precipitacao_total === 'number' ? d.precipitacao_total :
              typeof d.Chuva_aberta === 'number' ? d.Chuva_aberta :
              typeof d.precipitation === 'number' ? d.precipitation : 0),
            temperature: (typeof d.temperature === 'number' ? d.temperature :
              typeof d.temp_media === 'number' ? d.temp_media :
              typeof d.temp_max === 'number' ? d.temp_max : undefined)
          })));
        } else {
          setHourlyData([]);
        }
      } catch (err) {
        setHourlyData([]);
      } finally {
        setIsLoadingHourly(false);
      }
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
      // Garante que rainDaily <2mm aparece como 0mm e "Sem Chuva"
      const rainValue = typeof data.rainDaily === 'number' ? (data.rainDaily >= 2 ? data.rainDaily : 0) : 0;
      const rainInfo = getRainType(rainValue);
      return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 shadow-xl">
          <div className="border-b border-[hsl(var(--border))] pb-2 mb-2">
            <p className="font-bold text-[hsl(var(--card-foreground))] text-lg">{label}</p>
            {data.fullDate && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {new Date(data.fullDate).toLocaleDateString('pt-BR', { 
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
              <p>⛈️ Pico máximo: {(maxRain || 0).toFixed(1)}mm</p>
              <p>💦 Total previsto: {(totalRain || 0).toFixed(1)}mm</p>
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
        </div>
        
        {/* Informações da precipitação */}
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl">{getWeatherIcon(totalRain)}</span>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {(totalRain || 0).toFixed(1)}mm
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Total Previsto
              </div>
            </div>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
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
                tickFormatter={(value) => `${value}mm`}
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
            hour: d.hour,
            precipitation: typeof d.precipitation === 'number' ? d.precipitation : 0,
            temperature: d.temperature
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