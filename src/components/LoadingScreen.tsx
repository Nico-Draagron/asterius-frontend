import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] flex items-center justify-center z-50">
      <div className="text-center space-y-8 px-4">
        {/* Logo/Icon Animation */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--primary))] rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--primary))] rounded-full animate-pulse opacity-30"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent))]/80 rounded-full flex items-center justify-center shadow-2xl">
            <svg
              className="w-16 h-16 text-[hsl(var(--primary))] animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--accent))] animate-fade-in drop-shadow-lg">
            Bem-vindo!
          </h1>
          <p className="text-lg md:text-xl text-[hsl(var(--foreground))] animate-fade-in-delay">
            Estamos preparando o ambiente para você{dots}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 max-w-md mx-auto">
          <LoadingStep icon="📊" text="Carregando previsões de vendas" delay={0} />
          <LoadingStep icon="🌡️" text="Obtendo dados meteorológicos" delay={200} />
          <LoadingStep icon="📈" text="Preparando gráficos e análises" delay={400} />
        </div>

        {/* Loading Bar */}
        <div className="max-w-md mx-auto">
          <div className="h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent))]/70 rounded-full animate-loading-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LoadingStepProps {
  icon: string;
  text: string;
  delay: number;
}

const LoadingStep = ({ icon, text, delay }: LoadingStepProps) => {
  return (
    <div
      className="flex items-center gap-3 text-left animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm md:text-base text-[hsl(var(--muted-foreground))]">{text}</span>
    </div>
  );
};
