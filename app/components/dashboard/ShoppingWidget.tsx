import { Link } from "react-router";

import { Card } from "~/components/ui";
import type { ShoppingListPreview } from "~/lib/shopping-api.server";

export function ShoppingWidget({ lists }: { lists: ShoppingListPreview[] }) {
  return (
    <Card>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Listes de courses</h2>
        <Link to="/shopping" className="text-sm font-semibold">
          Tout voir →
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {lists.map((list) => (
          <Link
            key={list.id}
            to={`/shopping/${list.id}`}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-foreground"
          >
            <span className="text-sm font-semibold">{list.name}</span>
            <span className="text-sm font-medium text-muted">{list.openCount} restants</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
