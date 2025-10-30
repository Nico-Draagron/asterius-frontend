import React, { useState, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { X } from "lucide-react";

interface HourlyTempData {
  hour: string;
  temperature: number;
  temp_max?: number;
  temp_min?: number;
  precipitacao_total?: number;
}

interface HourlyTemperatureChartProps {
  date: string;
  data: HourlyTempData[];
  onClose: () => void;
}

export const HourlyTemperatureChart = ({ date, data, onClose }: HourlyTemperatureChartProps) => {
  const [hourlyData, setHourlyData] = useState<HourlyTempData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados horários do backend
  const fetchHourlyData = useCallback(async () => {
    try {
      setIsLoading(true);
      const formattedDate = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
      const response = await fetch(`${import.meta.env.VITE_API_URL}/hourly-weather/${formattedDate}/1`); // lojaId fixo, pode ser prop
      const result = await response.json();
      if (result.success && result.data) {
        setHourlyData(result.data.map((d: {
          hour: string;
          temperature?: number;
          temp_max?: number;
          temp_min?: number;
          precipitacao_total?: number;
          precipitation?: number;
        }) => ({
          hour: d.hour,
          temperature: typeof d.temperature === 'number' ? d.temperature : (typeof d.temp_max === 'number' && typeof d.temp_min === 'number' ? (d.temp_max + d.temp_min) / 2 : d.temp_max ?? 0),
          temp_max: d.temp_max,
          temp_min: d.temp_min,
          precipitacao_total: d.precipitacao_total ?? d.precipitation ?? d['precipitacao_total'] ?? 0
        })));
      } else {
        setHourlyData(generateMockHourlyTempData());
      }
    } catch (error) {
      setHourlyData(generateMockHourlyTempData());
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  React.useEffect(() => {
    fetchHourlyData();
  }, [fetchHourlyData]);

  // Normalizar hour para número (0-23) e garantir que temperaturas são números
  const normalizeHour = (h: number | string | undefined) => {
    if (typeof h === 'number') return h;
    if (typeof h === 'string') {
      const match = h.match(/^(\d{1,2})/);
      if (match) {
        const n = parseInt(match[1], 10);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    }
    return 0;
  };
  const normalizeTemp = (t: number | string | undefined) => {
    const n = typeof t === 'number' ? t : parseFloat(String(t));
    return isNaN(n) ? 0 : n;
  };
  const displayData = hourlyData.map(d => ({
    ...d,
    hour: normalizeHour(d.hour),
    temperature: normalizeTemp(d.temperature),
    temp_max: normalizeTemp(d.temp_max),
    temp_min: normalizeTemp(d.temp_min),
    precipitacao_total: normalizeTemp(d.precipitacao_total)
  }));
  const maxTemp = Math.max(...displayData.map(d => d.temp_max ?? 0));
  const minTemp = Math.min(...displayData.map(d => d.temp_min ?? 0));
  const avgTemp = displayData.reduce((sum, d) => sum + (d.temp_max ?? 0), 0) / (displayData.length || 1);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{ payload: HourlyTempData }>;
    label?: string;
  }
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Garante que temperature é número antes de chamar toFixed
      const tempValue = typeof data.temperature === 'number' && !isNaN(data.temperature) ? data.temperature : 0;
      return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 shadow-xl">
          <div className="border-b border-[hsl(var(--border))] pb-2 mb-2">
            <p className="font-bold text-[hsl(var(--card-foreground))] text-lg">{label}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {new Date(date).toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌡️</span>
              <div>
                <p className="text-lg font-bold" style={{ color: '#ef4444' }}>
                  {tempValue.toFixed(1)}°C
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Temperatura por hora
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-[hsl(var(--card-foreground))] mb-2">
              ⏰ Temperatura e Precipitação por Hora
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {new Date(date).toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
          >
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        {/* Gráfico */}
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-[hsl(var(--muted-foreground))]">Carregando dados horários...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={displayData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3} 
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                interval={0}
                type="number"
                domain={[0, 23]}
                allowDecimals={false}
                tickFormatter={(value) => `${value}h`}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(value) => `${value}°C`}
                domain={[minTemp - 2, maxTemp + 2]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#3b82f6"
                tick={{ fill: "#3b82f6", fontSize: 11 }}
                tickFormatter={(value) => `${value}mm`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={avgTemp} 
                yAxisId="left"
                stroke="#f59e0b" 
                strokeDasharray="5 5" 
                strokeWidth={1}
                label={{ value: "Média do Dia", position: "top", fontSize: 10 }}
              />
              {/* Temperatura máxima (vermelha) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temp_max"
                name="Temperatura Máxima do Horário"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ 
                  fill: "#ef4444", 
                  r: 4, 
                  strokeWidth: 2, 
                  stroke: "white"
                }}
                activeDot={{ 
                  r: 6, 
                  stroke: "#ef4444", 
                  strokeWidth: 2, 
                  fill: "white",
                  style: { filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.5))' }
                }}
                connectNulls={false}
              />
              {/* Temperatura mínima (azul) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temp_min"
                name="Temperatura Mínima do Horário"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              {/* Linha de temperatura mínima (azul) e demais linhas de temperatura já estão acima */}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// Mock para fallback
const generateMockHourlyTempData = (): HourlyTempData[] => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    const hour = `${i.toString().padStart(2, '0')}:00`;
    const temperature = 18 + Math.sin((i - 6) * Math.PI / 12) * 8 + Math.random() * 2;
    hours.push({ hour, temperature: Math.round(temperature * 10) / 10 });
  }
  return hours;
};
