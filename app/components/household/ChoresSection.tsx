import { useState } from "react";
import { useFetcher } from "react-router";

import { Button, Card, Input, Modal, Select } from "~/components/ui";
import type { AssignmentMode, ChoreConfig } from "~/lib/chores-api.server";
import type { HouseholdMember } from "~/lib/household-api.server";
import { getCurrentIsoWeek } from "~/lib/week";

function userName(users: HouseholdMember[], userId: string): string {
  return users.find((user) => user.id === userId)?.name ?? "?";
}

function frequencyLabel(frequencyWeeks: number): string {
  return frequencyWeeks === 1 ? "Chaque semaine" : `Toutes les ${frequencyWeeks} semaines`;
}

function assignmentLabel(chore: ChoreConfig, users: HouseholdMember[]): string {
  const name = userName(users, chore.anchorUserId);
  return chore.assignmentMode === "PINNED" ? `Toujours : ${name}` : `Alterne — commence par ${name}`;
}

/** Add and edit share this form — remounted (via key) per open so its
 * local assignmentMode state starts fresh from the target chore. */
function ChoreFormFields({
  chore,
  users,
  fieldErrors,
}: {
  chore: ChoreConfig | null;
  users: HouseholdMember[];
  fieldErrors: Record<string, string[]> | undefined;
}) {
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(
    chore?.assignmentMode ?? "ROTATING",
  );

  const errorFor = (field: string) =>
    fieldErrors && field in fieldErrors ? (
      <p className="text-sm font-medium text-accent" role="alert">
        {fieldErrors[field][0]}
      </p>
    ) : null;

  return (
    <>
      <Input label="Nom" name="name" defaultValue={chore?.name} required autoFocus />
      {errorFor("name")}
      <Input
        label="Fréquence (en semaines)"
        name="frequencyWeeks"
        type="number"
        min={1}
        step={1}
        defaultValue={chore?.frequencyWeeks ?? 1}
        required
      />
      {errorFor("frequencyWeeks")}
      <Select
        label="Attribution"
        name="assignmentMode"
        value={assignmentMode}
        onChange={(event) => setAssignmentMode(event.target.value as AssignmentMode)}
      >
        <option value="ROTATING">Alterne entre les deux</option>
        <option value="PINNED">Toujours la même personne</option>
      </Select>
      {errorFor("assignmentMode")}
      <Input
        label="Semaine de départ"
        name="anchorIsoWeek"
        type="week"
        defaultValue={chore?.anchorIsoWeek ?? getCurrentIsoWeek()}
        required
      />
      {errorFor("anchorIsoWeek")}
      <Select
        label={assignmentMode === "PINNED" ? "Assigné à" : "Commence avec"}
        name="anchorUserId"
        defaultValue={chore?.anchorUserId ?? users[0]?.id}
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </Select>
      {errorFor("anchorUserId")}
    </>
  );
}

export function ChoresSection({
  chores,
  users,
}: {
  chores: ChoreConfig[];
  users: HouseholdMember[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<ChoreConfig | null>(null);
  const [deletingChore, setDeletingChore] = useState<ChoreConfig | null>(null);

  const formFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const formErrors =
    formFetcher.data && "errors" in formFetcher.data
      ? (formFetcher.data.errors as Record<string, string[]>)
      : undefined;
  const generalError = formErrors && "general" in formErrors ? formErrors.general[0] : undefined;

  function openAddModal() {
    setEditingChore(null);
    setFormOpen(true);
  }

  function openEditModal(chore: ChoreConfig) {
    setEditingChore(chore);
    setFormOpen(true);
  }

  return (
    <Card className="mt-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Corvées</h2>
        <Button variant="secondary" onClick={openAddModal}>
          + Ajouter une corvée
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {chores.map((chore) => (
          <div
            key={chore.id}
            className="flex flex-wrap items-center gap-2.5 rounded-lg bg-surface px-3 py-2.5"
          >
            <div className="flex-1">
              <div className="text-sm font-semibold">{chore.name}</div>
              <div className="text-xs font-medium text-muted">
                {frequencyLabel(chore.frequencyWeeks)} · {assignmentLabel(chore, users)}
              </div>
            </div>
            <Button variant="secondary" onClick={() => openEditModal(chore)}>
              Modifier
            </Button>
            <Button variant="secondary" onClick={() => setDeletingChore(chore)}>
              Supprimer
            </Button>
          </div>
        ))}
        {chores.length === 0 && (
          <p className="px-3 py-2.5 text-sm font-medium text-muted">Aucune corvée pour l’instant.</p>
        )}
      </div>

      <Modal
        open={formOpen}
        title={editingChore ? "Modifier la corvée" : "Ajouter une corvée"}
        onClose={() => setFormOpen(false)}
        fetcher={formFetcher}
        submitLabel={editingChore ? "Enregistrer" : "Ajouter"}
      >
        <input type="hidden" name="intent" value={editingChore ? "editChore" : "addChore"} />
        {editingChore && <input type="hidden" name="choreId" value={editingChore.id} />}
        {generalError && (
          <p className="text-sm font-medium text-accent" role="alert">
            {generalError}
          </p>
        )}
        <ChoreFormFields
          key={editingChore?.id ?? "new"}
          chore={editingChore}
          users={users}
          fieldErrors={formErrors}
        />
      </Modal>

      <Modal
        open={deletingChore != null}
        title={deletingChore ? `Supprimer « ${deletingChore.name} » ?` : ""}
        onClose={() => setDeletingChore(null)}
        fetcher={deleteFetcher}
        submitLabel="Supprimer"
      >
        <input type="hidden" name="intent" value="deleteChore" />
        {deletingChore && <input type="hidden" name="choreId" value={deletingChore.id} />}
        <p className="text-sm font-medium text-muted">
          Son historique de complétion sera supprimé avec elle. Cette action est irréversible.
        </p>
      </Modal>
    </Card>
  );
}
