import { useState } from "react";
import { useFetcher } from "react-router";

import type { ChoreView, SubtaskView } from "~/lib/cleaning-api.server";

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

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="toggleChoreSubtask" />
      <input type="hidden" name="choreId" value={choreId} />
      <input type="hidden" name="subtaskId" value={subtask.id} />
      <input type="hidden" name="occurrenceDate" value={occurrenceDate} />
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2">
        <input
          type="checkbox"
          checked={done}
          onChange={(event) => fetcher.submit(event.currentTarget.form)}
          className="size-4 shrink-0 accent-accent"
        />
        <span className={`flex-1 text-sm ${done ? "text-muted line-through" : ""}`}>
          {subtask.label}
        </span>
      </label>
    </fetcher.Form>
  );
}

/** A single chore row — checkbox toggles the whole chore. When it has
 * subtasks, an expand affordance reveals their own checklist; ticking the
 * parent ticks every subtask and vice versa (see
 * my-home-backend/CLAUDE.md's Chore rotation section — Subtasks). Shared
 * by the day navigator's list and the persistent weekly block. */
export function ChoreItem({ chore }: { chore: ChoreView }) {
  const [expanded, setExpanded] = useState(false);
  const fetcher = useFetcher();
  const done = fetcher.state !== "idle" ? !chore.done : chore.done;
  const hasSubtasks = chore.subtasks.length > 0;

  return (
    <div className="rounded-lg bg-surface">
      <div className="flex min-h-11 items-center gap-2.5 px-3 py-2.5">
        <fetcher.Form method="post" className="flex min-w-0 flex-1 items-center gap-2.5">
          <input type="hidden" name="intent" value="toggleChore" />
          <input type="hidden" name="choreId" value={chore.id} />
          <input type="hidden" name="occurrenceDate" value={chore.occurrenceDate} />
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={done}
              onChange={(event) => fetcher.submit(event.currentTarget.form)}
              className="size-[18px] shrink-0 accent-accent"
            />
            <span
              className={`flex-1 truncate text-sm font-medium ${done ? "text-muted line-through" : ""}`}
            >
              {chore.name}
            </span>
          </label>
        </fetcher.Form>
        <span className="shrink-0 text-xs font-medium text-muted">{chore.tag}</span>
        {hasSubtasks && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? "Masquer les sous-tâches" : "Afficher les sous-tâches"}
            className="flex size-6 shrink-0 items-center justify-center text-muted"
          >
            {expanded ? "▾" : "▸"}
          </button>
        )}
      </div>
      {hasSubtasks && expanded && (
        <div className="flex flex-col gap-0.5 border-t border-border px-1.5 pb-1.5 pl-[26px]">
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
