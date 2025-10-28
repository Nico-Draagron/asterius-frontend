import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { useState } from "react";

interface TemperatureChartProps {
  data: { day: string; fullDate?: string; value: number; radiation?: number; precipitation?: number }[];
}

import { HourlyTemperatureChart } from "./HourlyTemperatureChart";
export const TemperatureChart = ({ data }: TemperatureChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHourlyChart, setShowHourlyChart] = useState(false);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);

  // Validação dos dados
  const chartData = Array.isArray(data) ? data : [];
  
  // Calcular estatísticas de temperatura
  const temperatures = chartData.map(d => d.value);
  const avgTemp = temperatures.length > 0 ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length : 0;
  const maxTemp = temperatures.length > 0 ? Math.max(...temperatures) : 0;
  const minTemp = temperatures.length > 0 ? Math.min(...temperatures) : 0;
  const tempVariation = maxTemp - minTemp;
  
  // Classificar tipo de clima baseado na temperatura, radiação e precipitação
  const getWeatherType = (temp: number, radiation?: number, precipitation?: number) => {
    // Prioridade: chuva > radiação baixa > temperatura
    if (precipitation && precipitation > 0.5) {
      return { type: "Chuvoso", icon: "🌧️", color: "#3b82f6" };
    }
    
    // Radiação baixa indica tempo nublado (assumindo valores normais entre 200-800 W/m²)
    if (radiation !== undefined && radiation < 300) {
      return { type: "Nublado", icon: "☁️", color: "#64748b" };
    }
    
    // Radiação alta com temperatura
    if (radiation !== undefined && radiation >= 300) {
      if (temp < 15) return { type: "Frio e Ensolarado", icon: "🌤️", color: "#3b82f6" };
      if (temp < 25) return { type: "Ameno e Ensolarado", icon: "☀️", color: "#10b981" };
      if (temp < 30) return { type: "Quente e Ensolarado", icon: "☀️", color: "#f59e0b" };
      return { type: "Muito Quente", icon: "🔥", color: "#ef4444" };
    }
    
    // Fallback para apenas temperatura (quando não há dados de radiação)
    if (temp < 15) return { type: "Frio", icon: "🥶", color: "#3b82f6" };
    if (temp < 25) return { type: "Ameno", icon: "🌤️", color: "#10b981" };
    if (temp < 30) return { type: "Quente", icon: "☀️", color: "#f59e0b" };
    return { type: "Muito Quente", icon: "🔥", color: "#ef4444" };
  };
  
  // Calcular médias de radiação e precipitação para o período
  const avgRadiation = chartData.length > 0 ? 
    chartData.reduce((sum, d) => sum + (d.radiation || 0), 0) / chartData.length : undefined;
  const avgPrecipitation = chartData.length > 0 ? 
    chartData.reduce((sum, d) => sum + (d.precipitation || 0), 0) / chartData.length : undefined;
    
  const weatherInfo = getWeatherType(avgTemp, avgRadiation, avgPrecipitation);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const temp = data.value;
      const tempInfo = getWeatherType(temp, data.radiation, data.precipitation);
      
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
              <span className="text-2xl">{tempInfo.icon}</span>
              <div>
                <p className="text-lg font-bold" style={{ color: tempInfo.color }}>
                  {(temp || 0).toFixed(1)}°C
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {tempInfo.type}
                </p>
              </div>
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
              <p>❄️ Mínima do período: {(minTemp || 0).toFixed(1)}°C</p>
              <p>📏 Amplitude térmica: {(tempVariation || 0).toFixed(1)}°C</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handlePointClick = async (data: any) => {
    if (data && data.fullDate) {
      setSelectedDate(data.fullDate);
      setIsLoadingHourly(true);
      setShowHourlyChart(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/hourly-weather/${data.fullDate}/1`); // lojaId fixo, pode ser prop
        const result = await response.json();
        if (result.success && result.data) {
          setHourlyData(result.data.map((d: any) => ({ hour: d.hour, temp_max: d.temp_max, temp_min: d.temp_min })));
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

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 shadow-lg animate-fade-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--card-foreground))] mb-2">
            🌡️ Previsão de Temperatura Max- 7 Dias
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Acompanhe as variações térmicas previstas
          </p>
        </div>
        {/* Informações do clima customizadas */}
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2 justify-end">
            <div className="flex flex-col items-end">
              <span className="text-4xl mb-1" style={{ color: weatherInfo.color }}>{weatherInfo.icon}</span>
              <div className="text-3xl font-bold mb-1" style={{ color: weatherInfo.color }}>
                {(maxTemp || 0).toFixed(1)}°C
              </div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {weatherInfo.type}
              </div>
            </div>
          </div>
        </div>
      </div>

  {chartData.length === 0 ? (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Carregando dados meteorológicos...</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
            <LineChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onMouseMove={(e: any) => {
                if (e.activeTooltipIndex !== undefined) {
                  setHoveredPoint(e.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  handlePointClick(e.activePayload[0].payload);
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
                tickFormatter={(value) => `${Number(value).toFixed(1)}°C`}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '15px' }}
                iconType="line"
              />
              
              {/* Linha principal de temperatura */}
              <Line
                type="monotone"
                dataKey="value"
                name="🌡️ Temperatura (°C)"
                stroke="#ef4444"
                strokeWidth={4}
                dot={{ 
                  fill: "#ef4444", 
                  r: 6, 
                  strokeWidth: 3, 
                  stroke: "white",
                  style: { filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))' }
                }}
                activeDot={{ 
                  r: 8, 
                  stroke: "#ef4444", 
                  strokeWidth: 3, 
                  fill: "white",
                  style: { filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.5))' }
                }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
      )}
      {/* Modal do gráfico horário de temperatura */}
      {showHourlyChart && selectedDate && (
        <HourlyTemperatureChart
          date={selectedDate}
          data={hourlyData}
          onClose={() => {
            setShowHourlyChart(false);
            setHourlyData([]);
          }}
        />
      )}
    </div>
  );
};