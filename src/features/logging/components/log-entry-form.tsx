"use client";

import { useMemo, useState } from "react";

import { logFormConfig } from "@/features/logging/config/logging-config";
import type { LogItemId } from "@/types/domain";

type LogEntryFormProps = {
  category: LogItemId;
};

function getDefaultTimestamp() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

export function LogEntryForm({ category }: LogEntryFormProps) {
  const config = logFormConfig[category];
  const [savedPayload, setSavedPayload] = useState<string | null>(null);

  const initialValues = useMemo(() => {
    return config.fields.reduce<Record<string, string | boolean>>((acc, field) => {
      if (field.type === "checkbox") {
        acc[field.id] = false;
        return acc;
      }

      if (field.type === "datetime-local") {
        acc[field.id] = getDefaultTimestamp();
        return acc;
      }

      acc[field.id] = field.options?.[0]?.value ?? "";
      return acc;
    }, {});
  }, [config.fields]);

  const [values, setValues] = useState(initialValues);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-700">
          Typed form scaffold
        </p>
        <h2 className="mt-2 text-3xl font-black text-neutral-900">{config.title}</h2>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-neutral-800">
          {config.description}
        </p>
      </div>

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSavedPayload(
            JSON.stringify(
              {
                type: category,
                values,
              },
              null,
              2,
            ),
          );
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {config.fields.map((field) => (
            <label
              key={field.id}
              className={`block ${field.type === "textarea" ? "md:col-span-2" : ""}`}
            >
              <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
                {field.label}
              </span>

              {field.type === "select" ? (
                <select
                  className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
                  value={String(values[field.id] ?? "")}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: event.target.value,
                    }))
                  }
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {field.type === "textarea" ? (
                <textarea
                  className="min-h-28 w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
                  value={String(values[field.id] ?? "")}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: event.target.value,
                    }))
                  }
                />
              ) : null}

              {field.type === "checkbox" ? (
                <div className="flex items-center gap-3 rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3">
                  <input
                    checked={Boolean(values[field.id])}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.id]: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span className="text-sm font-medium text-neutral-900">
                    Mark this as true
                  </span>
                </div>
              ) : null}

              {field.type === "text" ||
              field.type === "number" ||
              field.type === "datetime-local" ? (
                <input
                  className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
                  type={field.type}
                  value={String(values[field.id] ?? "")}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: event.target.value,
                    }))
                  }
                />
              ) : null}

              <span className="mt-2 block text-xs font-medium leading-5 text-neutral-700">
                {field.helperText}
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <button className="cta-button" type="submit">
            Save demo log
          </button>
        </div>
      </form>

      {savedPayload ? (
        <div className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Preview payload
          </p>
          <pre className="mt-3 overflow-x-auto text-sm font-medium text-neutral-900">
            {savedPayload}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
