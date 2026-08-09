import { type InputHTMLAttributes, useId } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
      {label}
      <input
        {...props}
        id={inputId}
        className={`min-h-11 rounded-lg border border-border px-3 text-base font-medium text-foreground ${className}`}
      />
    </label>
  );
}
