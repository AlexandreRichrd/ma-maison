import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";

import { ShoppingListCard } from "~/components/shopping/ShoppingListCard";
import { Button, Input, Modal } from "~/components/ui";
import { PageHeader } from "~/components/layout/PageHeader";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import {
  createShoppingList,
  deleteShoppingList,
  getShoppingLists,
  type ShoppingListPreview,
} from "~/lib/shopping-api.server";
import { deleteShoppingListSchema } from "~/lib/validation";

import type { Route } from "./+types/shopping";

export function meta() {
  return [{ title: "Courses · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const lists = await getShoppingLists(request);
  return { lists };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "deleteList") {
      const result = deleteShoppingListSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await deleteShoppingList(request, result.data.listId);
      return { ok: true };
    }

    if (intent === "newList") {
      const name = formData.get("name");
      const listId = await createShoppingList(request, typeof name === "string" ? name : "");
      return redirect(`/shopping/${listId}`);
    }
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }

  throw data("Intention inconnue", { status: 400 });
}

export default function Shopping({ loaderData }: Route.ComponentProps) {
  const { lists } = loaderData;
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingList, setDeletingList] = useState<ShoppingListPreview | null>(null);
  const fetcher = useFetcher<typeof action>();
  const deleteFetcher = useFetcher();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;
  const nameErrors = errors && "name" in errors ? errors.name : undefined;

  return (
    <div>
      <PageHeader
        title="Listes de courses"
        action={<Button onClick={() => setModalOpen(true)}>+ Nouvelle liste</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <ShoppingListCard key={list.id} list={list} onDelete={() => setDeletingList(list)} />
        ))}
      </div>

      <Modal
        open={modalOpen}
        title="Nouvelle liste de courses"
        onClose={() => setModalOpen(false)}
        fetcher={fetcher}
        submitLabel="Créer la liste"
      >
        <input type="hidden" name="intent" value="newList" />
        <Input label="Nom de la liste" name="name" required autoFocus />
        {nameErrors && (
          <p className="text-sm font-medium text-accent" role="alert">
            {nameErrors[0]}
          </p>
        )}
      </Modal>

      <Modal
        open={deletingList != null}
        title={deletingList ? `Supprimer « ${deletingList.name} » ?` : ""}
        onClose={() => setDeletingList(null)}
        fetcher={deleteFetcher}
        submitLabel="Supprimer"
      >
        <input type="hidden" name="intent" value="deleteList" />
        {deletingList && <input type="hidden" name="listId" value={deletingList.id} />}
        <p className="text-sm font-medium text-muted">
          Ses articles seront supprimés avec elle. Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
