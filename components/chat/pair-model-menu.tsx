"use client";

import { useCallback, useState } from "react";
import { TroveMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pairModel, pairModels } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { ModelSelectorLogo } from "../ai-elements/model-selector";
import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";

export function PairModelMenu({
  align,
  displayName,
  label,
  modelId,
  onSelect,
  testId,
}: {
  align: "start" | "end";
  displayName?: string;
  label: string;
  modelId: string;
  onSelect: (modelId: string) => void;
  testId: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = pairModel(modelId);

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-7 max-w-[168px] gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground shadow-none hover:text-foreground"
          data-testid={testId}
          size="sm"
          variant="ghost"
        >
          {displayName ? (
            <TroveMark className="size-4" />
          ) : selected.id === "auto" ? null : (
            <ModelSelectorLogo provider={selected.provider} />
          )}
          <span className="truncate">
            {displayName ?? selected.shortName ?? selected.name}
          </span>
          <ChevronDownIcon size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[240px]" side="top">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          {label}
        </DropdownMenuLabel>
        {pairModels.map((model) => (
          <PairModelItem
            key={model.id}
            modelId={model.id}
            onSelect={onSelect}
            selectedId={selected.id}
            setOpen={setOpen}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PairModelItem({
  modelId,
  onSelect,
  selectedId,
  setOpen,
}: {
  modelId: string;
  onSelect: (modelId: string) => void;
  selectedId: string;
  setOpen: (open: boolean) => void;
}) {
  const model = pairModel(modelId);
  const handleSelect = useCallback(() => {
    onSelect(model.id);
    setOpen(false);
  }, [model.id, onSelect, setOpen]);

  return (
    <DropdownMenuItem
      className={cn("flex items-center justify-between gap-3")}
      data-testid={`pair-model-${model.id}`}
      onSelect={handleSelect}
    >
      <span className="flex min-w-0 items-center gap-2">
        {model.id === "auto" ? null : (
          <ModelSelectorLogo provider={model.provider} />
        )}
        <span className="flex flex-col">
          <span>{model.name}</span>
          {model.description ? (
            <span className="text-muted-foreground text-xs">
              {model.description}
            </span>
          ) : null}
        </span>
      </span>
      {model.id === selectedId ? <CheckCircleFillIcon /> : null}
    </DropdownMenuItem>
  );
}
