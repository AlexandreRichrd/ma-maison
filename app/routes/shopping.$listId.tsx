import { useState } from "react";
import { data, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { ShoppingItemRow } from "~/components/shopping/ShoppingItemRow";
import { Button, cardClassName, Input, Modal } from "~/components/ui";
import {
  addShoppingItem,
  getShoppingListDetail,
  toggleShoppingItem,
} from "~/db/queries/shopping.server";
import { addItemSchema, toggleItemSchema } from "~/lib/validation";

import type { Route } from "./+types/shopping.$listId";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData ? `${loaderData.list.name} · Hearth` : "Courses · Hearth" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const detail = await getShoppingListDetail(params.listId);
  if (!detail) {
    throw data("Introuvable", { status: 404 });
  }
  return detail;
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggleItem") {
    const result = toggleItemSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    await toggleShoppingItem(result.data.itemId);
    return { ok: true };
  }

  if (intent === "addItem") {
    const result = addItemSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    await addShoppingItem({ listId: params.listId, ...result.data });
    return { ok: true };
  }

  throw data("Intention inconnue", { status: 400 });
}

export default function ShoppingListDetail({ loaderData }: Route.ComponentProps) {
  const { list, items } = loaderData;
  const [modalOpen, setModalOpen] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;
  const nameErrors = errors && "name" in errors ? errors.name : undefined;
  const quantityErrors = errors && "quantity" in errors ? errors.quantity : undefined;

  return (
    <div>
      <PageHeader
        back={{ to: "/shopping", label: "← Toutes les listes" }}
        title={list.name}
        action={<Button onClick={() => setModalOpen(true)}>+ Ajouter un article</Button>}
      />
      <div className={`${cardClassName} overflow-hidden p-0`}>
        {items.length === 0 ? (
          <p className="p-4.5 text-sm text-muted">Aucun article pour l&rsquo;instant.</p>
        ) : (
          items.map((item) => <ShoppingItemRow key={item.id} item={item} />)
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Ajouter un article"
        onClose={() => setModalOpen(false)}
        fetcher={fetcher}
        submitLabel="Ajouter"
      >
        <input type="hidden" name="intent" value="addItem" />
        <Input label="Nom de l'article" name="name" required autoFocus />
        {nameErrors && (
          <p className="text-sm font-medium text-accent" role="alert">
            {nameErrors[0]}
          </p>
        )}
        <Input label="Quantité" name="quantity" defaultValue="1" required />
        {quantityErrors && (
          <p className="text-sm font-medium text-accent" role="alert">
            {quantityErrors[0]}
          </p>
        )}
        <Input label="Unité (optionnel)" name="unit" placeholder="kg, boîte, sachet…" />
      </Modal>
    </div>
  );
}
