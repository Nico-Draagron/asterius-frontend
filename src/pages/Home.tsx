import { useState, useEffect } from "react";
import { TrendingUp, Thermometer, CloudRain } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { KPICard as KPICardEnhanced } from "@/components/KPICardEnhanced";
import { SalesChart } from "@/components/SalesChart";
import { MiniChart } from "@/components/MiniChart";
import { TemperatureChart } from "@/components/TemperatureChart";
import { PrecipitationChart } from "@/components/PrecipitationChart";
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

// Fallback mock data generator (usado apenas em caso de erro na API)
const generateFallbackData = (dates: Date[]) => {
  return dates.map(date => ({
    day: date.toISOString().split('T')[0],
    sales: Math.floor(Math.random() * 3000) + 3000,
    rain: Math.floor(Math.random() * 60) + 10,
    temperature: Math.floor(Math.random() * 10) + 20,
  }));
};

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

  // Fetch real data from API
  const fetchPredictionsWithWeather = async (days: number, loja: number) => {
    setLoading(true);
    setSendingRequest(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/predictions-with-weather/${days}/${loja}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data: APIResponse = await response.json();
      setApiData(data);
      console.log("✅ Dados reais carregados:", data);
    } catch (err) {
      console.error("❌ Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      // Use fallback data
      const fallbackData = generateFallbackData(cycleDates);
      setApiData({
        success: false,
        days: cycleDates.length,
        loja_id: loja,
        model_status: "fallback",
        predictions: fallbackData.map(item => ({
          date: item.day,
          value: item.sales,
          confidence: 0.5
        })),
        weather_data: fallbackData.map(item => ({
          date: item.day,
          temperature: item.temperature,
          temp_max: item.temperature + 5,
          humidity: 65,
          precipitation: item.rain
        })),
        charts: {
          sales: {
            labels: fallbackData.map(item => item.day),
            data: fallbackData.map(item => item.sales)
          },
          temperature: {
            labels: fallbackData.map(item => item.day),
            data: fallbackData.map(item => item.temperature)
          },
          precipitation: {
            labels: fallbackData.map(item => item.day),
            data: fallbackData.map(item => item.rain)
          }
        }
      });
    } finally {
      setLoading(false);
      setSendingRequest(false);
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
  
  // Buscar a maior temperatura máxima entre todos os registros do dia de hoje
  let todaysTemp = 22;
  if (apiData?.weather_data && apiData.weather_data.length > 0) {
    const todayDate = apiData.weather_data[todayIndex]?.date;
    // Filtra todos os registros do dia de hoje
    const todayMaxTemps = apiData.weather_data
      .filter(w => w.date === todayDate)
      .map(w => w.temp_max ?? w.temperature ?? w.temp_media ?? -Infinity)
      .filter(temp => temp > -Infinity);
    if (todayMaxTemps.length > 0) {
      todaysTemp = Math.round(Math.max(...todayMaxTemps));
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

    // Filtra apenas hoje (se houver) e todos os próximos dias futuros disponíveis (comparando datas em UTC)
    const todayUTC = new Date();
    todayUTC.setUTCHours(0,0,0,0);
    const filtered = sortedPredictions.map((pred, idx) => ({ pred, weather: sortedWeather[idx] }))
      .filter(({ pred, weather }) => {
        if (!isUsefulDay(pred, weather)) return false;
        // Força data do backend para UTC (meio-dia UTC para evitar fuso)
        const dataDate = new Date(pred.date + 'T12:00:00Z');
        dataDate.setUTCHours(0,0,0,0);
        return dataDate >= todayUTC;
      }); // Mostra hoje e todos os próximos dias disponíveis

    salesData = filtered.map(({ pred, weather }) => ({
      day: pred.date ? formatDayOfWeek(pred.date) : '',
      fullDate: pred.date,
      sales: pred.value || 0,
      rain: weather?.precipitation || 0,
      temperature: weather?.temperature,
    }));

    // Para o gráfico, sempre usar 'temp_max' quando disponível (fallback para temperature/temp_media)
    const days = Array.from(new Set(filtered.map(({ weather }) => weather.date)));
    tempData = days.map((date, index) => {
      const dayWeathers = filtered
        .filter(({ weather }) => weather.date === date)
        .map(({ weather }) => weather);
      // Preferência: temp_max > temperature > temp_media
      const temps = dayWeathers.map(w => (w.temp_max ?? w.temperature ?? w.temp_media ?? -Infinity));
      const maxTemp = Math.max(...temps);
      return {
        day: date ? formatDayOfWeek(date) : `Dia ${index + 1}`,
        fullDate: date,
        value: maxTemp,
        radiation: dayWeathers[0]?.radiation,
        precipitation: dayWeathers[0]?.precipitation || 0,
      };
    });

    rainData = filtered.map(({ weather }, index) => ({
      day: weather.date ? formatDayOfWeek(weather.date) : `Dia ${index + 1}`,
      fullDate: weather.date,
      value: weather.precipitation || 0,
    }));
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
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-6">
            ⚠️ Usando dados simulados - {error}
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
            temperature={todaysTemp}
            precipitation={todaysRain}
            radiation={todaysRadiation}
          />
          <KPICard 
            title="Temperatura Max para hoje" 
            value={`${todaysTemp}°C`} 
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