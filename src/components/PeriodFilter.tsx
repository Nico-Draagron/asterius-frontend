import { cn } from "@/lib/utils";

interface PeriodFilterProps {
  periods: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

export const PeriodFilter = ({ periods, selected, onSelect }: PeriodFilterProps) => {
  return (
    <div className="flex gap-3 flex-wrap">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onSelect(period.value)}
          className={cn(
            "px-6 py-2.5 rounded-full font-medium transition-all",
            selected === period.value
              ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-lg scale-105"
              : "bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] hover:bg-[hsl(var(--muted))] hover:scale-102"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};
