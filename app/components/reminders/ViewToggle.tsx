import { Link } from "react-router";

const VIEWS = [
  { value: "list", label: "Liste" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
] as const;

export function ViewToggle({ view, week }: { view: string; week: string }) {
  return (
    <div className="inline-flex gap-1 rounded-lg border border-border bg-card p-1">
      {VIEWS.map(({ value, label }) => (
        <Link
          key={value}
          to={`/reminders?view=${value}&week=${week}`}
          className={`inline-flex min-h-11 items-center justify-center rounded-md px-3.5 text-sm font-semibold ${
            view === value ? "bg-accent text-accent-foreground" : "text-muted"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
