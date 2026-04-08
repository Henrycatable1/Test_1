"use client";

import { useState } from "react";

const defaultValues = {
  name: "",
  ageYears: "4",
  sex: "female",
  breed: "",
  weightKg: "4.3",
  personality: "",
};

export function OnboardingForm() {
  const [values, setValues] = useState(defaultValues);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        window.localStorage.setItem("cat-health-demo-profile", JSON.stringify(values));
        setSaved(true);
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Cat name
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Miso"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Age (years)
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            type="number"
            min="0"
            step="1"
            value={values.ageYears}
            onChange={(event) =>
              setValues((current) => ({ ...current, ageYears: event.target.value }))
            }
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Sex
          </span>
          <select
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            value={values.sex}
            onChange={(event) =>
              setValues((current) => ({ ...current, sex: event.target.value }))
            }
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Breed
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            value={values.breed}
            onChange={(event) =>
              setValues((current) => ({ ...current, breed: event.target.value }))
            }
            placeholder="Domestic shorthair"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Weight (kg)
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            type="number"
            min="0"
            step="0.1"
            value={values.weightKg}
            onChange={(event) =>
              setValues((current) => ({ ...current, weightKg: event.target.value }))
            }
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
          Personality
        </span>
        <textarea
          className="min-h-32 w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
          value={values.personality}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              personality: event.target.value,
            }))
          }
          placeholder="Food-motivated, shy with guests, playful after dinner."
          required
        />
      </label>

      <div className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 text-sm font-medium leading-6 text-neutral-800 shadow-[5px_5px_0_0_#171717]">
        ### Demo note
        <br />
        Until Supabase keys are added, this form saves to `localStorage` so the
        onboarding flow can be reviewed without backend setup.
      </div>

      <div className="flex flex-wrap gap-4">
        <button className="cta-button" type="submit">
          Save cat profile
        </button>
        {saved ? (
          <p className="rounded-full border-4 border-neutral-900 bg-emerald-200 px-4 py-2 text-sm font-black text-neutral-900 shadow-[4px_4px_0_0_#171717]">
            Saved in demo mode. Next step: connect Supabase auth and cats table.
          </p>
        ) : null}
      </div>
    </form>
  );
}
