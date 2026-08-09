import { useFetcher } from "react-router";

import type { ShoppingItem } from "~/db/schema";

export function ShoppingItemRow({ item }: { item: ShoppingItem }) {
  const fetcher = useFetcher();
  const checked = fetcher.state !== "idle" ? !item.checked : item.checked;

  return (
    <fetcher.Form
      method="post"
      className="flex items-center gap-3 border-b border-border px-4.5 py-3.5 last:border-b-0"
    >
      <input type="hidden" name="intent" value="toggleItem" />
      <input type="hidden" name="itemId" value={item.id} />
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => fetcher.submit(event.currentTarget.form)}
        className="size-[18px] shrink-0 accent-accent"
      />
      <span
        className={`flex-1 text-[15px] font-medium ${checked ? "text-muted line-through" : ""}`}
      >
        {item.name}
      </span>
      <span className="text-sm font-medium text-muted">
        {item.quantity}
        {item.unit ? ` ${item.unit}` : ""}
      </span>
    </fetcher.Form>
  );
}
