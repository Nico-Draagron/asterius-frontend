import { useState } from "react";
import { Send, Star, Loader2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import SimpleChart from '../components/SimpleChart';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp?: Date;
  visualization?: {
    type: 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'radial' | 'boxplot';
    labels: string[];
    values: number[];
    extra?: {
      title?: string;
      colors?: string[];
      datasets?: Array<{
        label: string;
        data: number[];
        color?: string;
      }>;
    };
  };
}

interface ChatResponse {
  answer: string;
  visualization?: any;
}

const suggestions = [
  "Qual a previsão de vendas para os próximos 7 dias?",
  "Como está o clima hoje?",
  "Mostre as vendas da loja 1",
  "Qual é a correlação entre chuva e vendas?",
  "Previsão para amanhã com dados meteorológicos",
];

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Olá! 👋 Sou o Asterius, seu assistente inteligente para análise de vendas e previsões meteorológicas. Como posso ajudar você hoje?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Call the real API
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      
      const botMessage: Message = {
        id: messages.length + 2,
        text: data.answer,
        sender: "bot",
        timestamp: new Date(),
        visualization: data.visualization,
      };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Erro ao comunicar com API:", error);
      
      // Fallback response
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Desculpe, houve um problema ao conectar com o servidor. 😔 Verifique se o backend está rodando na porta 8000.",
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="min-h-screen ml-20 flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))]/50 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-[hsl(var(--accent))] fill-[hsl(var(--accent))]" />
            <h1 className="text-3xl font-bold text-foreground">Chatbot Asterius</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Conectado - XGBoost + NOMADS</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="animate-fade-in mb-8">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                Sugestões de perguntas:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 rounded-full bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] text-sm hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-all hover-lift"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex animate-fade-in",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[90%] rounded-2xl px-6 py-4 shadow-md",
                  message.sender === "user"
                    ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                    : "bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                
                {/* Renderiza visualização se existir */}
                {message.visualization && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-xs font-medium opacity-70">Visualização</span>
                    </div>
                    <SimpleChart data={message.visualization} />
                  </div>
                )}
                
                {message.timestamp && (
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] rounded-2xl px-6 py-4 shadow-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Asterius está analisando...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-8 border-t border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))]/50 backdrop-blur">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-6 py-4 rounded-full bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] shadow-md"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-8 py-4 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
