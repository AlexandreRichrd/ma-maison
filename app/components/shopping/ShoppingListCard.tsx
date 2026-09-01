import { Link } from "react-router";

import { Button, cardClassName } from "~/components/ui";
import type { ShoppingListPreview } from "~/lib/shopping-api.server";

export function ShoppingListCard({
  list,
  onDelete,
}: {
  list: ShoppingListPreview;
  onDelete: () => void;
}) {
  return (
    <div className={`${cardClassName} flex items-start justify-between gap-3`}>
      <Link to={`/shopping/${list.id}`} className="flex-1">
        <div className="mb-1 font-serif text-base font-semibold">{list.name}</div>
        <div className="text-sm font-semibold text-accent">{list.openCount} articles restants</div>
      </Link>
      <Button variant="secondary" onClick={onDelete}>
        Supprimer
      </Button>
    </div>
  );
}
