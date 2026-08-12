import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";

import { ShoppingListCard } from "~/components/shopping/ShoppingListCard";
import { Button, Input, Modal } from "~/components/ui";
import { PageHeader } from "~/components/layout/PageHeader";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { createShoppingList, getShoppingLists } from "~/lib/shopping-api.server";

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
  const name = formData.get("name");

  try {
    const listId = await createShoppingList(request, typeof name === "string" ? name : "");
    return redirect(`/shopping/${listId}`);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function Shopping({ loaderData }: Route.ComponentProps) {
  const { lists } = loaderData;
  const [modalOpen, setModalOpen] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;

  return (
    <div>
      <PageHeader
        title="Listes de courses"
        action={<Button onClick={() => setModalOpen(true)}>+ Nouvelle liste</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <ShoppingListCard key={list.id} list={list} />
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
        {errors?.name && (
          <p className="text-sm font-medium text-accent" role="alert">
            {errors.name[0]}
          </p>
        )}
      </Modal>
    </div>
  );
}
