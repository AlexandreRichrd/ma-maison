import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { ShoppingItemRow } from "~/components/shopping/ShoppingItemRow";
import { Button, cardClassName, Input, Modal, Select } from "~/components/ui";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import {
  addShoppingItem,
  deleteShoppingList,
  getShoppingListDetail,
  toggleShoppingItem,
} from "~/lib/shopping-api.server";
import { UNIT_OPTIONS } from "~/lib/units";
import { addItemSchema, deleteShoppingListSchema } from "~/lib/validation";

import type { Route } from "./+types/shopping.$listId";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData ? `${loaderData.list.name} · Hearth` : "Courses · Hearth" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const detail = await getShoppingListDetail(request, params.listId);
  if (!detail) {
    throw data("Introuvable", { status: 404 });
  }
  return detail;
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "toggleItem") {
      const itemId = formData.get("itemId");
      await toggleShoppingItem(request, typeof itemId === "string" ? itemId : "");
      return { ok: true };
    }

    if (intent === "addItem") {
      const result = addItemSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await addShoppingItem(request, {
        listId: params.listId,
        name: result.data.name,
        quantity: result.data.quantity,
        unit: result.data.unit,
      });
      return { ok: true };
    }

    if (intent === "deleteList") {
      const result = deleteShoppingListSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await deleteShoppingList(request, result.data.listId);
      return redirect("/shopping");
    }
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }

  throw data("Intention inconnue", { status: 400 });
}

export default function ShoppingListDetail({ loaderData }: Route.ComponentProps) {
  const { list, items } = loaderData;
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const deleteFetcher = useFetcher();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;
  const nameErrors = errors && "name" in errors ? errors.name : undefined;
  const quantityErrors = errors && "quantity" in errors ? errors.quantity : undefined;

  return (
    <div>
      <PageHeader
        back={{ to: "/shopping", label: "← Toutes les listes" }}
        title={list.name}
        action={
          <div className="flex gap-2.5">
            <Button onClick={() => setModalOpen(true)}>+ Ajouter un article</Button>
            <Button variant="secondary" onClick={() => setDeleting(true)}>
              Supprimer
            </Button>
          </div>
        }
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
        <Select label="Unité" name="unit" defaultValue="UNITE">
          {UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Modal>

      <Modal
        open={deleting}
        title={`Supprimer « ${list.name} » ?`}
        onClose={() => setDeleting(false)}
        fetcher={deleteFetcher}
        submitLabel="Supprimer"
      >
        <input type="hidden" name="intent" value="deleteList" />
        <input type="hidden" name="listId" value={list.id} />
        <p className="text-sm font-medium text-muted">
          Ses articles seront supprimés avec elle. Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
