import { useState } from "react";
import { useFetcher } from "react-router";

import { Button, Card, Input, Modal, Select } from "~/components/ui";
import type { AssignmentMode, ChoreConfig, FrequencyUnit } from "~/lib/chores-api.server";
import { getCurrentIsoDate } from "~/lib/day";
import type { HouseholdMember } from "~/lib/household-api.server";

function userName(users: HouseholdMember[], userId: string): string {
  return users.find((user) => user.id === userId)?.name ?? "?";
}

function frequencyLabel(unit: FrequencyUnit, value: number): string {
  if (unit === "DAY") {
    return value === 1 ? "Chaque jour" : `Tous les ${value} jours`;
  }
  return value === 1 ? "Chaque semaine" : `Toutes les ${value} semaines`;
}

function assignmentLabel(chore: ChoreConfig, users: HouseholdMember[]): string {
  const name = userName(users, chore.anchorUserId);
  return chore.assignmentMode === "PINNED" ? `Toujours : ${name}` : `Alterne — commence par ${name}`;
}

/** Add and edit share this form — remounted (via key) per open so its
 * local assignmentMode/frequencyUnit state starts fresh from the target
 * chore. */
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
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>(
    chore?.frequencyUnit ?? "WEEK",
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
      <Select
        label="Unité de fréquence"
        name="frequencyUnit"
        value={frequencyUnit}
        onChange={(event) => setFrequencyUnit(event.target.value as FrequencyUnit)}
      >
        <option value="DAY">Jours</option>
        <option value="WEEK">Semaines</option>
      </Select>
      {errorFor("frequencyUnit")}
      <Input
        label={frequencyUnit === "DAY" ? "Fréquence (en jours)" : "Fréquence (en semaines)"}
        name="frequencyValue"
        type="number"
        min={1}
        step={1}
        defaultValue={chore?.frequencyValue ?? 1}
        required
      />
      {errorFor("frequencyValue")}
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
        label="Date de départ"
        name="anchorDate"
        type="date"
        defaultValue={chore?.anchorDate ?? getCurrentIsoDate()}
        required
      />
      {frequencyUnit === "WEEK" && (
        <p className="text-xs font-medium text-muted">
          Doit être un lundi pour une corvée hebdomadaire.
        </p>
      )}
      {errorFor("anchorDate")}
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

function SubtaskRow({
  choreId,
  subtask,
  orderedSubtaskIds,
  isFirst,
  isLast,
}: {
  choreId: string;
  subtask: ChoreConfig["subtasks"][number];
  orderedSubtaskIds: string[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const editFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const reorderFetcher = useFetcher();

  function move(direction: -1 | 1) {
    const index = orderedSubtaskIds.indexOf(subtask.id);
    const reordered = [...orderedSubtaskIds];
    const targetIndex = index + direction;
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const formData = new FormData();
    formData.set("intent", "reorderChoreSubtasks");
    formData.set("choreId", choreId);
    for (const id of reordered) formData.append("subtaskIds", id);
    void reorderFetcher.submit(formData, { method: "post" });
  }

  return (
    <div className="flex items-center gap-1.5">
      <editFetcher.Form method="post" className="flex min-w-0 flex-1 items-center gap-1.5">
        <input type="hidden" name="intent" value="editChoreSubtask" />
        <input type="hidden" name="choreId" value={choreId} />
        <input type="hidden" name="subtaskId" value={subtask.id} />
        <input
          type="text"
          name="label"
          defaultValue={subtask.label}
          aria-label={`Libellé de la sous-tâche « ${subtask.label} »`}
          className="min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
        />
        <Button type="submit" variant="secondary">
          Enregistrer
        </Button>
      </editFetcher.Form>
      <button
        type="button"
        disabled={isFirst}
        onClick={() => move(-1)}
        aria-label="Monter"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={isLast}
        onClick={() => move(1)}
        aria-label="Descendre"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm disabled:opacity-30"
      >
        ↓
      </button>
      <deleteFetcher.Form method="post">
        <input type="hidden" name="intent" value="deleteChoreSubtask" />
        <input type="hidden" name="choreId" value={choreId} />
        <input type="hidden" name="subtaskId" value={subtask.id} />
        <button
          type="submit"
          aria-label={`Supprimer la sous-tâche « ${subtask.label} »`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-sm text-accent"
        >
          ×
        </button>
      </deleteFetcher.Form>
    </div>
  );
}

function AddSubtaskForm({ choreId, subtaskCount }: { choreId: string; subtaskCount: number }) {
  const fetcher = useFetcher();

  return (
    // Keyed on subtaskCount so a successful add remounts this (uncontrolled)
    // form fresh, clearing the input — no extra state/effect needed.
    <fetcher.Form key={subtaskCount} method="post" className="flex items-center gap-1.5">
      <input type="hidden" name="intent" value="addChoreSubtask" />
      <input type="hidden" name="choreId" value={choreId} />
      <input
        type="text"
        name="label"
        placeholder="Nouvelle sous-tâche"
        required
        className="min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
      />
      <Button type="submit" variant="secondary">
        + Ajouter
      </Button>
    </fetcher.Form>
  );
}

function ChoreSubtasksEditor({ chore }: { chore: ChoreConfig }) {
  const orderedSubtaskIds = chore.subtasks.map((subtask) => subtask.id);

  return (
    <div className="flex flex-col gap-1.5 border-t border-border px-3 py-2.5">
      {chore.subtasks.map((subtask, index) => (
        <SubtaskRow
          key={subtask.id}
          choreId={chore.id}
          subtask={subtask}
          orderedSubtaskIds={orderedSubtaskIds}
          isFirst={index === 0}
          isLast={index === chore.subtasks.length - 1}
        />
      ))}
      <AddSubtaskForm choreId={chore.id} subtaskCount={chore.subtasks.length} />
    </div>
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
  const [expandedChoreIds, setExpandedChoreIds] = useState<Set<string>>(new Set());

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

  function toggleExpanded(choreId: string) {
    setExpandedChoreIds((current) => {
      const next = new Set(current);
      if (next.has(choreId)) {
        next.delete(choreId);
      } else {
        next.add(choreId);
      }
      return next;
    });
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
        {chores.map((chore) => {
          const expanded = expandedChoreIds.has(chore.id);
          return (
            <div key={chore.id} className="rounded-lg bg-surface">
              <div className="flex flex-wrap items-center gap-2.5 px-3 py-2.5">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{chore.name}</div>
                  <div className="text-xs font-medium text-muted">
                    {frequencyLabel(chore.frequencyUnit, chore.frequencyValue)} ·{" "}
                    {assignmentLabel(chore, users)}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => toggleExpanded(chore.id)}
                  aria-expanded={expanded}
                >
                  {expanded ? "Masquer les sous-tâches" : `Sous-tâches (${chore.subtasks.length})`}
                </Button>
                <Button variant="secondary" onClick={() => openEditModal(chore)}>
                  Modifier
                </Button>
                <Button variant="secondary" onClick={() => setDeletingChore(chore)}>
                  Supprimer
                </Button>
              </div>
              {expanded && <ChoreSubtasksEditor chore={chore} />}
            </div>
          );
        })}
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
