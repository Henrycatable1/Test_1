export type OnboardingSex = "male" | "female" | "neutered_male" | "neutered_female";

export type OnboardingFormValues = {
  name: string;
  ageYears: string;
  sex: OnboardingSex;
  breed: string;
  weightKg: string;
  personality: string;
};

export type OnboardingCatRow = {
  name: string;
  age_months: number;
  gender: string;
  breed: string | null;
  initial_weight_kg: number;
  personality: string | null;
};

export const emptyOnboardingValues: OnboardingFormValues = {
  name: "",
  ageYears: "",
  sex: "female",
  breed: "",
  weightKg: "",
  personality: "",
};

const onboardingSexValues = new Set<OnboardingSex>([
  "male",
  "female",
  "neutered_male",
  "neutered_female",
]);

function isOnboardingSex(value: string): value is OnboardingSex {
  return onboardingSexValues.has(value as OnboardingSex);
}

// ### keep re-entry edits from inventing demo age/weight when a real cat already exists
export function mapCatRowToOnboardingValues(cat: OnboardingCatRow): OnboardingFormValues {
  return {
    name: cat.name,
    ageYears: String(Number((cat.age_months / 12).toFixed(1))),
    sex: isOnboardingSex(cat.gender) ? cat.gender : "female",
    breed: cat.breed ?? "",
    weightKg: String(cat.initial_weight_kg),
    personality: cat.personality ?? "",
  };
}

function parseNonNegativeNumber(value: string, fieldLabel: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Enter a valid ${fieldLabel}.`);
  }

  return parsed;
}

function buildSharedCatFields(values: OnboardingFormValues) {
  const name = values.name.trim();
  const breed = values.breed.trim();
  const personality = values.personality.trim();

  if (!name) {
    throw new Error("Enter a cat name.");
  }

  if (!breed) {
    throw new Error("Enter a breed.");
  }

  if (!personality) {
    throw new Error("Enter personality notes.");
  }

  if (!isOnboardingSex(values.sex)) {
    throw new Error("Select a valid sex.");
  }

  return {
    name,
    age_months: Math.max(0, Math.round(parseNonNegativeNumber(values.ageYears, "age") * 12)),
    gender: values.sex,
    breed,
    initial_weight_kg: parseNonNegativeNumber(values.weightKg, "weight"),
    personality,
  };
}

// ### first-time create may initialize an empty conditions list; updates must not wipe later edits
export function buildOnboardingInsertPayload(ownerUserId: string, values: OnboardingFormValues) {
  return {
    owner_user_id: ownerUserId,
    ...buildSharedCatFields(values),
    underlying_health_conditions: [] as string[],
  };
}

export function buildOnboardingUpdatePayload(values: OnboardingFormValues) {
  return buildSharedCatFields(values);
}

// ### returning owners should land on the live dashboard, not a blank create form
export function resolveSignedInHomePath(hasExistingCat: boolean) {
  return hasExistingCat ? "/dashboard" : "/onboarding";
}
