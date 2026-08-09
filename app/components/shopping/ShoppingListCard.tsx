import { Link } from "react-router";

import { cardClassName } from "~/components/ui";
import type { ShoppingListPreview } from "~/db/queries/shopping.server";

export function ShoppingListCard({ list }: { list: ShoppingListPreview }) {
  return (
    <Link to={`/shopping/${list.id}`} className={cardClassName}>
      <div className="mb-1 font-serif text-base font-semibold">{list.name}</div>
      <div className="text-sm font-semibold text-accent">{list.openCount} articles restants</div>
    </Link>
  );
}
