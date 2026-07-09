import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTypeScriptModule(path) {
  const source = readFileSync(path, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const cjsModule = { exports: {} };

  vm.runInNewContext(outputText, {
    exports: cjsModule.exports,
    module: cjsModule,
  });

  return cjsModule.exports;
}

const { mergeDailyRecordUpdate } = loadTypeScriptModule("src/features/logging/lib/daily-record-merge.ts");

const existingRecord = {
  abnormal_behavior_note: "Morning vomiting.",
  food_amount_grams: 40,
  notes: "Breakfast note.",
  vomit_times: 1,
};

const mergedFood = mergeDailyRecordUpdate("food", existingRecord, {
  food_amount_grams: 50,
  notes: "Dinner note.",
});

assert.equal(mergedFood.food_amount_grams, 90);
assert.equal(mergedFood.notes, "Breakfast note.\nDinner note.");

const nonGramFood = mergeDailyRecordUpdate("food", existingRecord, {
  food_amount_grams: null,
  notes: "Recorded amount: 1 cup.",
});

assert.equal(Object.hasOwn(nonGramFood, "food_amount_grams"), false);
assert.equal(nonGramFood.notes, "Breakfast note.\nRecorded amount: 1 cup.");

const secondVomitingEvent = mergeDailyRecordUpdate("abnormal_event", existingRecord, {
  abnormal_behavior: true,
  abnormal_behavior_note: "Event type: vomiting.",
  notes: "Afternoon note.",
  vomit_times: 1,
});

assert.equal(secondVomitingEvent.vomit_times, 2);
assert.equal(secondVomitingEvent.notes, "Breakfast note.\nAfternoon note.");
assert.equal(secondVomitingEvent.abnormal_behavior_note, "Morning vomiting.\nEvent type: vomiting.");

const repeatedVomitingEvent = mergeDailyRecordUpdate("abnormal_event", existingRecord, {
  abnormal_behavior: true,
  abnormal_behavior_note: "Event type: vomiting.\nMarked as repeated today.",
  vomit_times: 2,
});

assert.equal(repeatedVomitingEvent.vomit_times, 2);

const nonVomitingEvent = mergeDailyRecordUpdate("abnormal_event", existingRecord, {
  abnormal_behavior: true,
  abnormal_behavior_note: "Event type: diarrhea.",
  notes: "Diarrhea note.",
  vomit_times: 0,
});

assert.equal(Object.hasOwn(nonVomitingEvent, "vomit_times"), false);
assert.equal(nonVomitingEvent.notes, "Breakfast note.\nDiarrhea note.");

console.log("daily record merge tests passed");
