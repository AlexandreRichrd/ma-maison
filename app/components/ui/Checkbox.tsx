import { type InputHTMLAttributes } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Checkbox({ label, className = "", id, ...props }: CheckboxProps) {
  const input = (
    <input
      {...props}
      id={id}
      type="checkbox"
      className={`size-5 shrink-0 accent-accent ${className}`}
    />
  );

  if (!label) return input;

  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-center gap-3"
    >
      {input}
      <span>{label}</span>
    </label>
  );
}
