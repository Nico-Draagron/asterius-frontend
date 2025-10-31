import { useState, useEffect } from "react";
import { TrendingUp, Thermometer, CloudRain } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { KPICard as KPICardEnhanced } from "@/components/KPICardEnhanced";
import { SalesChart } from "@/components/SalesChart";
import { MiniChart } from "@/components/MiniChart";
import { TemperatureChart } from "@/components/TemperatureChart";
import { PrecipitationChart } from "@/components/PrecipitationChart";
import { LoadingScreen } from "@/components/LoadingScreen";
import { classificadorVendas } from "@/lib/classificadorVendas";

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Types for API responses
interface PredictionData {
  date: string;
  value: number;
  confidence: number;
}

interface WeatherData {
  date: string;
  temperature: number;
  temp_max?: number;
  temp_min?: number;
  temp_media?: number;
  humidity: number;
  precipitation: number;
  radiation?: number;
}

interface APIResponse {
  success: boolean;
  days: number;
  loja_id: number;
  model_status: string;
  predictions: PredictionData[];
  weather_data: WeatherData[];
  charts: {
    sales: { labels: string[]; data: number[] };
    temperature: { labels: string[]; data: number[] };
    precipitation: { labels: string[]; data: number[] };
  };
}

// Função para gerar ciclo dinâmico: ontem, hoje, +5 dias futuros
function getCycleDates() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const dates = [];
  // Ontem
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  dates.push(new Date(yesterday));
  // Hoje
  dates.push(new Date(today));
  // Próximos 5 dias
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const Home = () => {
  const [lojaId, setLojaId] = useState(1);
  const [apiData, setApiData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  // Mobile chart selector state
  const [mobileChart, setMobileChart] = useState<string | null>(null);
  // Track orientation (portrait/landscape)
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const updateOrientation = () => {
      setIsPortrait(window.matchMedia('(orientation: portrait)').matches);
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  // Função para formatar data para dia da semana (garante fuso local, não UTC)
  const formatDayOfWeek = (dateString: string) => {
    // Usa new Date(dateString + 'T00:00:00') para garantir localtime
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  };

  // Fetch hourly weather data and calculate max/min temperature for each day
  const fetchHourlyWeatherAndCalculateMaxMin = async (dates: string[], loja: number) => {
    const dailyMaxTemps: Record<string, number> = {};
    const dailyMinTemps: Record<string, number> = {};
    
    for (const dateStr of dates) {
      try {
        const response = await fetch(`${API_BASE_URL}/hourly-weather/${dateStr}/${loja}`);
        if (response.ok) {
          const hourlyData = await response.json();
          if (hourlyData.success && hourlyData.data && Array.isArray(hourlyData.data)) {
            // Calcular temp_max e temp_min do dia pegando o maior e menor valor entre todas as horas
            const temps = hourlyData.data
              .map((h: { temp_max: number }) => h.temp_max)
              .filter((t: number | null | undefined) => t !== null && t !== undefined && !isNaN(t as number));
            if (temps.length > 0) {
              dailyMaxTemps[dateStr] = Math.max(...temps as number[]);
              dailyMinTemps[dateStr] = Math.min(...temps as number[]);
              console.log(`✅ Temp para ${dateStr}: Máx ${dailyMaxTemps[dateStr]}°C / Mín ${dailyMinTemps[dateStr]}°C (calculada de ${temps.length} horas)`);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Erro ao buscar dados horários para ${dateStr}:`, err);
      }
    }
    
    return { dailyMaxTemps, dailyMinTemps };
  };

  // Fetch real data from API
  const fetchPredictionsWithWeather = async (days: number, loja: number) => {
    setLoading(true);
    setSendingRequest(true);
    setError(null);
    try {
      // Adicionar timeout de 15 segundos para mobile
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${API_BASE_URL}/predictions-with-weather/${days}/${loja}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data: APIResponse = await response.json();
      
      // Buscar dados horários e calcular temp_max e temp_min real para cada dia
      const dates = data.predictions.map(p => p.date.split('T')[0]);
      const { dailyMaxTemps, dailyMinTemps } = await fetchHourlyWeatherAndCalculateMaxMin(dates, loja);
      
      // Atualizar weather_data com temp_max e temp_min real calculado dos dados horários
      data.weather_data = data.weather_data.map(w => {
        const dateStr = w.date.split('T')[0];
        if (dailyMaxTemps[dateStr]) {
          return {
            ...w,
            temp_max: dailyMaxTemps[dateStr],
            temp_min: dailyMinTemps[dateStr],
            temperature: dailyMaxTemps[dateStr] // Também atualiza temperature
          };
        }
        return w;
      });
      
      setApiData(data);
      console.log("✅ Dados reais carregados com temp_max calculada dos dados horários:", data);
    } catch (err) {
      console.error("❌ Erro ao carregar dados da API:", err);
      const errorMessage = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Timeout na conexão - tente novamente' : err.message)
        : "Erro desconhecido ao conectar com backend";
      setError(errorMessage);
      // NÃO usa fallback - deixa apiData null para mostrar erro real
    } finally {
      setLoading(false);
      setSendingRequest(false);
      console.log("🔄 Loading finalizado");
    }
  };

  const cycleDates = getCycleDates();

  // Sempre buscar 7 dias (ontem, hoje, +5)
  useEffect(() => {
    fetchPredictionsWithWeather(cycleDates.length, lojaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId]);

  // CORRIGIDO: Encontrar o índice do dia HOJE (data atual)
  const getTodayIndex = () => {
    if (!apiData?.predictions || apiData.predictions.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Procurar o índice onde a data corresponde a hoje
    const todayIdx = apiData.predictions.findIndex(pred => 
      pred.date && pred.date.split('T')[0] === todayStr
    );
    
    // Se não encontrar hoje, usar o segundo item (índice 1) que deveria ser hoje
    return todayIdx >= 0 ? todayIdx : 1;
  };
  
  const todayIndex = getTodayIndex();
  
  // Calculate KPIs from today's data (data atual) - Handle null values safely
  const todaysSales = apiData?.predictions.length > todayIndex 
    ? (apiData.predictions[todayIndex].value ?? 0) 
    : 0;
  
  // Buscar a máxima e mínima do dia de HOJE apenas
  let todayTempMax = 22;
  let todayTempMin = 22;
  if (apiData?.weather_data && apiData.weather_data.length > todayIndex) {
    const todayWeather = apiData.weather_data[todayIndex];
    if (todayWeather?.temp_max !== null && todayWeather?.temp_max !== undefined && !isNaN(todayWeather.temp_max)) {
      todayTempMax = Math.round(todayWeather.temp_max);
    }
    if (todayWeather?.temp_min !== null && todayWeather?.temp_min !== undefined && !isNaN(todayWeather.temp_min)) {
      todayTempMin = Math.round(todayWeather.temp_min);
    }
  }
  
  const todaysRain = apiData?.weather_data.length > todayIndex 
    ? (apiData.weather_data[todayIndex].precipitation ?? 0)
    : 0;
    
  const todaysRadiation = apiData?.weather_data.length > todayIndex 
    ? (apiData.weather_data[todayIndex].radiation ?? 800)
    : 800;

  // Obter dia da semana atual (0 = Segunda, 6 = Domingo)
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Converte domingo=0 para domingo=6
  const mesAtual = today.getMonth() + 1;

  // Classificação inteligente das vendas (apenas thresholds históricos)
  const classificacaoVendas = classificadorVendas.classificar_para_kpi(
    todaysSales,
    dayOfWeek,
    mesAtual
  );

  // CORRIGIDO: Ordenar dados cronologicamente e garantir 7 dias
  const ensureChronologicalOrder = (predictions: PredictionData[], weather: WeatherData[]) => {
    // Combinar dados com suas datas
    const combined = predictions.map((pred, idx) => ({
      prediction: pred,
      weather: weather[idx],
      date: new Date(pred.date)
    }));
    
    // Ordenar por data (do mais antigo para o mais recente)
    combined.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Separar novamente
    return {
      sortedPredictions: combined.map(c => c.prediction),
      sortedWeather: combined.map(c => c.weather)
    };
  };

  // Prepare chart data with validation, sorting and day names
  interface SalesChartData {
    day: string;
    fullDate?: string;
    sales: number;
    rain: number;
    temperature?: number;
  }
  interface TempChartData {
    day: string;
    fullDate?: string;
    value: number;
    radiation?: number;
    precipitation?: number;
  }
  interface RainChartData {
    day: string;
    fullDate?: string;
    value: number;
  }
  let salesData: SalesChartData[] = [];
  let tempData: TempChartData[] = [];
  let rainData: RainChartData[] = [];
  
  if (apiData?.predictions && Array.isArray(apiData.predictions)) {
    const { sortedPredictions, sortedWeather } = ensureChronologicalOrder(
      apiData.predictions, 
      apiData.weather_data
    );

    // Filtrar colunas onde todos os valores principais são nulos
    const isUsefulDay = (pred: PredictionData, weather: WeatherData) => {
      // Considera útil se pelo menos um valor principal não for nulo
      return (
        (pred.value !== null && pred.value !== undefined) ||
        (weather.temperature !== null && weather.temperature !== undefined) ||
        (weather.precipitation !== null && weather.precipitation !== undefined)
      );
    };

    // Filtra apenas hoje e todos os próximos dias futuros disponíveis
    // CORRIGIDO: usar data local do Brasil, não UTC
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD local
    
    const filtered = sortedPredictions.map((pred, idx) => ({ pred, weather: sortedWeather[idx] }))
      .filter(({ pred, weather }) => {
        if (!isUsefulDay(pred, weather)) return false;
        // Comparar data sem timezone
        const predDate = pred.date.split('T')[0]; // YYYY-MM-DD
        return predDate >= todayStr; // Hoje ou futuro
      });

    salesData = filtered.map(({ pred, weather }) => ({
      day: pred.date ? formatDayOfWeek(pred.date.split('T')[0]) : '',
      fullDate: pred.date.split('T')[0], // CORRIGIDO: usar pred.date, não weather.date
      sales: pred.value || 0,
      rain: weather?.precipitation || 0,
      temperature: weather?.temperature,
    }));

    // Para o gráfico de temperatura, sempre usar 'temp_max'
    // Agrupa por data e pega a temperatura MÁXIMA de cada dia
    const days = Array.from(new Set(filtered.map(({ pred }) => pred.date.split('T')[0])));
    tempData = days.map((dateStr) => {
      // Pegar todos os registros deste dia
      const dayRecords = filtered.filter(({ pred }) => pred.date.split('T')[0] === dateStr);
      
      // Extrair APENAS temp_max (prioridade absoluta)
      const allTemps = dayRecords
        .map(({ weather }) => weather.temp_max)
        .filter((t): t is number => t !== null && t !== undefined && !isNaN(t));
      
      // Pegar a MÁXIMA entre todas as temp_max do dia
      const maxTemp = allTemps.length > 0 ? Math.max(...allTemps) : 0;
      
      // Pegar radiação e precipitação do primeiro registro do dia
      const firstRecord = dayRecords[0]?.weather;
      
      return {
        day: dateStr ? formatDayOfWeek(dateStr) : '',
        fullDate: dateStr,
        value: maxTemp,
        radiation: firstRecord?.radiation,
        precipitation: firstRecord?.precipitation || 0,
      };
    });

    rainData = filtered.map(({ pred, weather }) => ({
      day: pred.date ? formatDayOfWeek(pred.date.split('T')[0]) : '',
      fullDate: pred.date.split('T')[0],
      value: weather.precipitation || 0,
    }));
  }

  // Estado para controlar quando mostrar a tela de loading
  const isDataReady = !loading && apiData !== null;

  // Se os dados não estão prontos, mostrar tela de loading
  if (!isDataReady) {
    console.log("⏳ Aguardando dados - loading:", loading, "apiData:", apiData);
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen ml-20 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground animate-fade-in">
            Dashboard - Loja {lojaId}
          </h1>
          
          {/* Loja Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setLojaId(1)}
              className={`px-4 py-2 rounded-lg font-medium ${
                lojaId === 1 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Loja 1
            </button>
            <button
              onClick={() => setLojaId(2)}
              className={`px-4 py-2 rounded-lg font-medium ${
                lojaId === 2 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Loja 2
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {sendingRequest && (
          <div className="bg-blue-100 border border-blue-300 text-blue-900 px-4 py-2 rounded-lg mb-2 animate-pulse">
            ⏳ Enviando solicitação ao backend...
          </div>
        )}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg mb-6">
            🔄 Carregando dados meteorológicos e previsões...
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-900 px-6 py-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div className="flex-1">
                <p className="font-bold text-lg mb-1">Erro ao carregar dados</p>
                <p className="text-sm mb-2">{error}</p>
                <button
                  onClick={() => fetchPredictionsWithWeather(cycleDates.length, lojaId)}
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  🔄 Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        )}
        
        {apiData && apiData.model_status && (
          <div className={`px-4 py-2 rounded-lg mb-6 ${
            apiData.model_status === 'real' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-orange-50 border border-orange-200 text-orange-800'
          }`}>
            {apiData.model_status === 'real' 
              ? '✅ Usando modelo XGBoost com dados NOMADS/GFS reais' 
              : '🔧 Usando modelo simulado para desenvolvimento'
            }
            <div className="mt-2 text-xs">
              📊 {apiData.predictions.length} previsões carregadas | 
              📅 Hoje (índice {todayIndex}): {apiData.predictions[todayIndex]?.date} | 
              💰 Vendas: R$ {(todaysSales || 0).toFixed(2)}
            </div>
          </div>
        )}

        {/* KPI Cards - Dados de Hoje - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <KPICardEnhanced
            title={`Previsão de Hoje (${(() => {
              const today = new Date();
              const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
              const diaSemana = days[today.getDay()];
              const dataFormatada = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
              return `${diaSemana}, ${dataFormatada}`;
            })()})`}
            value={`R$ ${todaysSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            trend={classificacaoVendas}
            salesValue={todaysSales}
            dayOfWeek={dayOfWeek}
            temperature={todayTempMax}
            precipitation={todaysRain}
            radiation={todaysRadiation}
          />
          <KPICard 
            title="Temperatura Maxima prevista para Hoje" 
            value={`${todayTempMax}°C`}
            subtitle={`Mínima: ${todayTempMin}°C`}
            icon={Thermometer} 
          />
          <KPICard 
            title="Precipitação Acumulada para hoje" 
            value={`${(todaysRain || 0).toFixed(1)}mm`} 
            icon={CloudRain} 
          />
        </div>

        {/* Mobile Portrait: Chart Selector & Modal */}
        {isPortrait && (
          <>
            <div className="block xl:hidden mb-6">
              <div className="flex flex-col gap-3">
                <span className="font-semibold text-lg mb-2">Selecione o gráfico para visualizar:</span>
                <button
                  className="bg-[hsl(45,100%,50%)] text-primary-foreground rounded-lg px-4 py-2 font-medium shadow hover:bg-yellow-400"
                  onClick={() => setMobileChart('sales')}
                >Vendas</button>
                <button
                  className="bg-[hsl(var(--chart-temp))] text-white rounded-lg px-4 py-2 font-medium shadow hover:bg-[hsl(var(--chart-temp))/90]"
                  onClick={() => setMobileChart('temperature')}
                >Temperatura</button>
                <button
                  className="bg-[hsl(var(--chart-rain))] text-white rounded-lg px-4 py-2 font-medium shadow hover:bg-[hsl(var(--chart-rain))/90]"
                  onClick={() => setMobileChart('precipitation')}
                >Precipitação</button>
              </div>
            </div>
            {/* Fullscreen chart modal for mobile portrait */}
            {mobileChart && (
              <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-2">
                <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-4 relative flex flex-col items-center">
                  <button
                    className="absolute top-2 right-2 bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] rounded-full p-2 shadow hover:bg-[hsl(var(--sidebar-primary))]"
                    onClick={() => setMobileChart(null)}
                    aria-label="Fechar"
                  >
                    <span className="text-xl">×</span>
                  </button>
                  {mobileChart === 'sales' && <SalesChart data={salesData} />}
                  {mobileChart === 'temperature' && <TemperatureChart data={tempData} />}
                  {mobileChart === 'precipitation' && <PrecipitationChart data={rainData} lojaId={lojaId} />}
                </div>
              </div>
            )}
          </>
        )}

        {/* Mobile Landscape & Desktop/Tablet: Show charts normally */}
        {!isPortrait && (
          <div className="mb-6">
            <SalesChart data={salesData} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              <TemperatureChart data={tempData} />
              <PrecipitationChart data={rainData} lojaId={lojaId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;