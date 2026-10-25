"use client";

import { PanelRightIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useDataStream } from "./data-stream-provider";

export function GatewayFoldout() {
  const { gatewaySuggestions, suggesting } = useDataStream();
  const [open, setOpen] = useState(true);
  const toggle = useCallback(() => {
    setOpen((value) => !value);
  }, []);

  return (
    <aside
      aria-label="Gateway suggestions"
      className={
        open
          ? "flex h-dvh w-[min(100%,340px)] shrink-0 flex-col border-border border-l bg-sidebar"
          : "flex h-dvh w-11 shrink-0 flex-col border-border border-l bg-sidebar"
      }
    >
      <div className="flex items-center justify-between gap-2 border-border border-b px-3 py-3">
        {open ? (
          <p className="font-serif text-[11px] uppercase tracking-[0.14em] text-primary">
            Gateway
          </p>
        ) : null}
        <button
          aria-expanded={open}
          className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          onClick={toggle}
          type="button"
        >
          <PanelRightIcon className="size-4" />
          <span className="sr-only">{open ? "Collapse" : "Expand"}</span>
        </button>
      </div>
      {open ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
          {suggesting ? (
            <p className="text-[13px] text-muted-foreground">
              Reading the question for gateway sources.
            </p>
          ) : null}
          {!suggesting && gatewaySuggestions.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              Suggestions show up here beside the answer.
            </p>
          ) : null}
          <ul className="grid gap-2">
            {gatewaySuggestions.map((item) => (
              <li
                className="rounded-xl border border-border bg-card px-3 py-2"
                key={item.id}
              >
                <p className="font-medium text-[14px] text-foreground">
                  {item.title}
                </p>
                {item.reason ? (
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {item.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
