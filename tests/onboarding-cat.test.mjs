import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOnboardingInsertPayload,
  buildOnboardingUpdatePayload,
  mapCatRowToOnboardingValues,
  resolveSignedInHomePath,
} from "../src/features/onboarding/lib/onboarding-cat.ts";

test("mapCatRowToOnboardingValues preserves owned-cat fields for re-entry edits", () => {
  const values = mapCatRowToOnboardingValues({
    name: "Miso",
    age_months: 144,
    gender: "neutered_male",
    breed: "Domestic shorthair",
    initial_weight_kg: 5.2,
    personality: "Quiet morning greeter",
  });

  assert.deepEqual(values, {
    name: "Miso",
    ageYears: "12",
    sex: "neutered_male",
    breed: "Domestic shorthair",
    weightKg: "5.2",
    personality: "Quiet morning greeter",
  });
});

test("buildOnboardingInsertPayload initializes empty health conditions once", () => {
  const payload = buildOnboardingInsertPayload("user-1", {
    name: "Miso",
    ageYears: "12",
    sex: "neutered_male",
    breed: "Domestic shorthair",
    weightKg: "5.2",
    personality: "Quiet morning greeter",
  });

  assert.equal(payload.owner_user_id, "user-1");
  assert.equal(payload.age_months, 144);
  assert.equal(payload.initial_weight_kg, 5.2);
  assert.deepEqual(payload.underlying_health_conditions, []);
});

test("buildOnboardingUpdatePayload omits health conditions so re-entry cannot wipe them", () => {
  const payload = buildOnboardingUpdatePayload({
    name: "Miso",
    ageYears: "12.5",
    sex: "neutered_female",
    breed: "Siamese",
    weightKg: "4.1",
    personality: "Lap seeker",
  });

  assert.equal(payload.age_months, 150);
  assert.equal(payload.gender, "neutered_female");
  assert.equal("underlying_health_conditions" in payload, false);
  assert.equal("owner_user_id" in payload, false);
});

test("resolveSignedInHomePath sends returning owners to the dashboard", () => {
  assert.equal(resolveSignedInHomePath(true), "/dashboard");
  assert.equal(resolveSignedInHomePath(false), "/onboarding");
});
