import { type SelectHTMLAttributes, useId } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function Select({ label, id, className = "", children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <label htmlFor={selectId} className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
      {label}
      <select
        {...props}
        id={selectId}
        className={`min-h-11 rounded-lg border border-border bg-card px-3 text-base font-medium text-foreground ${className}`}
      >
        {children}
      </select>
    </label>
  );
}
