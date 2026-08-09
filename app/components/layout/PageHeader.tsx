import { type ReactNode } from "react";
import { Link } from "react-router";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: { to: string; label: string };
};

export function PageHeader({ title, subtitle, action, back }: PageHeaderProps) {
  return (
    <div className="mb-5">
      {back && (
        <Link to={back.to} className="mb-3.5 inline-block text-sm font-semibold">
          {back.label}
        </Link>
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">{title}</h1>
        {action}
      </div>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}
