"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { formatDisplayDate } from "@/lib/format-display-date";
import { cn } from "@/lib/utils";

function parseIsoLocal(iso: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function toIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  className?: string;
};

export function DatePickerField({ id, label, value, onChange, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = parseIsoLocal(value);

  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldContent className="space-y-2">
        <Button
          type="button"
          variant="outline"
          id={id}
          className="h-11 w-full touch-manipulation justify-start font-normal sm:h-9"
          onClick={() => setOpen((o) => !o)}
        >
          {formatDisplayDate(value)}
        </Button>
        {open ? (
          <div className={cn("rounded-lg border bg-card p-2 shadow-sm")}>
            <DayPicker
              mode="single"
              selected={selected}
              defaultMonth={selected ?? new Date()}
              onSelect={(d) => {
                if (!d) return;
                onChange(toIsoLocal(d));
                setOpen(false);
              }}
            />
          </div>
        ) : null}
      </FieldContent>
    </Field>
  );
}
