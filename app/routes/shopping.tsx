import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";

import { ShoppingListCard } from "~/components/shopping/ShoppingListCard";
import { Button, Input, Modal } from "~/components/ui";
import { PageHeader } from "~/components/layout/PageHeader";
import { createShoppingList, getShoppingLists } from "~/db/queries/shopping.server";
import { newListSchema } from "~/lib/validation";

import type { Route } from "./+types/shopping";

export function meta() {
  return [{ title: "Shopping · Hearth" }];
}

export async function loader() {
  const lists = await getShoppingLists();
  return { lists };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = newListSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const listId = await createShoppingList(result.data.name);
  return redirect(`/shopping/${listId}`);
}

export default function Shopping({ loaderData }: Route.ComponentProps) {
  const { lists } = loaderData;
  const [modalOpen, setModalOpen] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;

  return (
    <div>
      <PageHeader
        title="Shopping Lists"
        action={<Button onClick={() => setModalOpen(true)}>+ New list</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <ShoppingListCard key={list.id} list={list} />
        ))}
      </div>

      <Modal
        open={modalOpen}
        title="New shopping list"
        onClose={() => setModalOpen(false)}
        fetcher={fetcher}
        submitLabel="Create list"
      >
        <input type="hidden" name="intent" value="newList" />
        <Input label="List name" name="name" required autoFocus />
        {errors?.name && (
          <p className="text-sm font-medium text-accent" role="alert">
            {errors.name[0]}
          </p>
        )}
      </Modal>
    </div>
  );
}
