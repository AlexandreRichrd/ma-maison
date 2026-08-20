import { useState } from "react";
import { useFetcher } from "react-router";

import type { ChoreView, SubtaskView } from "~/lib/cleaning-api.server";

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-4 shrink-0 text-muted transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
    >
      <path d="M7 4l6 6-6 6" />
    </svg>
  );
}

function SubtaskRow({
  choreId,
  occurrenceDate,
  subtask,
}: {
  choreId: string;
  occurrenceDate: string;
  subtask: SubtaskView;
}) {
  const fetcher = useFetcher();
  const done = fetcher.state !== "idle" ? !subtask.done : subtask.done;
  const inputId = `subtask-${subtask.id}`;

  return (
    // Only the checkbox completes a subtask — the label text sits outside
    // the <label>, so tapping it does nothing (see my-home/CLAUDE.md's
    // Cleaning section).
    <fetcher.Form method="post" className="flex min-h-11 items-center gap-2 rounded-lg pr-3">
      <input type="hidden" name="intent" value="toggleChoreSubtask" />
      <input type="hidden" name="choreId" value={choreId} />
      <input type="hidden" name="subtaskId" value={subtask.id} />
      <input type="hidden" name="occurrenceDate" value={occurrenceDate} />
      <label
        htmlFor={inputId}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg active:bg-black/5"
      >
        <input
          id={inputId}
          type="checkbox"
          checked={done}
          onChange={(event) => fetcher.submit(event.currentTarget.form)}
          aria-label={subtask.label}
          className="size-4 accent-accent"
        />
      </label>
      <span className={`flex-1 text-sm ${done ? "text-muted line-through" : ""}`}>
        {subtask.label}
      </span>
    </fetcher.Form>
  );
}

/** A single chore row — the checkbox is the only thing that completes it;
 * tapping the name never does (see my-home/CLAUDE.md's Cleaning section).
 * Shared by the day navigator's list and the persistent weekly block, which
 * differ in how (or whether) a subtask checklist can be hidden:
 * `subtasksExpandable=false` (day view) renders it inline, always visible —
 * a day holds few enough chores that the accordion's tap-target ambiguity
 * isn't worth it there. `subtasksExpandable=true` (weekly block) keeps it
 * collapsed behind an expand control, since a full week's list doesn't fit
 * comfortably expanded. */
export function ChoreItem({
  chore,
  subtasksExpandable,
}: {
  chore: ChoreView;
  subtasksExpandable: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const fetcher = useFetcher();
  const done = fetcher.state !== "idle" ? !chore.done : chore.done;
  const hasSubtasks = chore.subtasks.length > 0;
  const checkboxId = `chore-${chore.id}`;
  const subtasksId = `chore-subtasks-${chore.id}`;
  const doneSubtaskCount = chore.subtasks.filter((subtask) => subtask.done).length;
  const showSubtasks = !subtasksExpandable || expanded;

  // A dedicated, standalone checkbox control — never nested inside the
  // expand button below, so a mis-tap can't fire both at once. Its hit
  // area is 44x44 via padding on the label, not the checkbox's visual
  // size (see my-home/CLAUDE.md's Cleaning section — ticking the parent
  // cascades to every subtask, so a mis-tap here is costly).
  const checkbox = (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="toggleChore" />
      <input type="hidden" name="choreId" value={chore.id} />
      <input type="hidden" name="occurrenceDate" value={chore.occurrenceDate} />
      <label
        htmlFor={checkboxId}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg active:bg-black/5"
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={done}
          onChange={(event) => fetcher.submit(event.currentTarget.form)}
          aria-label={chore.name}
          className="size-[18px] shrink-0 accent-accent"
        />
      </label>
    </fetcher.Form>
  );

  const name = (
    <span
      className={`min-w-0 flex-1 text-sm font-medium ${done ? "text-muted line-through" : ""}`}
    >
      {chore.name}
    </span>
  );
  const tag = <span className="shrink-0 text-xs font-medium text-muted">{chore.tag}</span>;

  return (
    <div className="rounded-lg bg-surface">
      {/* Flex container, not a button — the checkbox and the expand
          control (when present) are two separate interactive elements
          side by side, never one nested inside the other. gap-2.5 keeps
          real space between them so they never share an edge. */}
      <div className="flex min-h-11 items-center gap-2.5 px-1.5">
        {checkbox}
        {subtasksExpandable && hasSubtasks ? (
          // Click only — the default for a <button>, which never reacts
          // to touchstart — so scrolling never expands a row.
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={subtasksId}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg pr-2 text-left active:bg-black/5"
          >
            {name}
            <span className="shrink-0 text-xs font-medium text-muted">
              {doneSubtaskCount}/{chore.subtasks.length}
            </span>
            {tag}
            <ChevronIcon expanded={expanded} />
          </button>
        ) : (
          <div className="flex min-h-11 min-w-0 flex-1 cursor-default items-center gap-2 pr-2">
            {name}
            {tag}
          </div>
        )}
      </div>
      {hasSubtasks && showSubtasks && (
        <div
          id={subtasksId}
          className="flex flex-col gap-0.5 border-t border-border px-1.5 pb-1.5 pl-[26px]"
        >
          {chore.subtasks.map((subtask) => (
            <SubtaskRow
              key={subtask.id}
              choreId={chore.id}
              occurrenceDate={chore.occurrenceDate}
              subtask={subtask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
