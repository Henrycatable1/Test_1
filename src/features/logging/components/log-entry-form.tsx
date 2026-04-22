"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { logFormConfig } from "@/features/logging/config/logging-config";
import { saveLogEntry } from "@/features/logging/lib/logging-writes";
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
  const router = useRouter();
  const config = logFormConfig[category];
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
          Daily health logging
        </p>
        <h2 className="mt-2 text-3xl font-black text-neutral-900">{config.title}</h2>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-neutral-800">
          {config.description}
        </p>
      </div>

      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setIsSaving(true);
          setErrorMessage(null);
          setSavedMessage(null);
          setReviewMessage(null);

          try {
            const result = await saveLogEntry(category, values);
            setSavedMessage(result.message);
            setReviewMessage(result.reviewMessage);
            router.refresh();
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to save the log.");
          } finally {
            setIsSaving(false);
          }
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
          <button className="cta-button" disabled={isSaving} type="submit">
            {isSaving ? "Saving..." : category === "vet_visit" ? "Save vet visit" : "Save daily record"}
          </button>
        </div>
      </form>

      {savedMessage ? (
        <div className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Saved
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-neutral-900">{savedMessage}</p>
          {reviewMessage ? (
            <p className="mt-3 text-sm font-medium leading-6 text-neutral-700">{reviewMessage}</p>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[24px] border-4 border-neutral-900 bg-rose-100 p-4 shadow-[5px_5px_0_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Save failed
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-neutral-900">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
