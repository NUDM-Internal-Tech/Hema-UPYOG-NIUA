/**
 * localOverrides.js
 *
 * Local JS behaviour that JSON cannot express (same pattern as EST estateFormConfig).
 *
 * Field shape / labels / options live in:
 *   - singleStepForm.json
 *   - multiStepForm.json
 *
 * This file only adds:
 *   - crossFieldValidations (JS functions)
 *   - optional staticFields for buildApiPayload examples
 *
 * Passed into <DynamicFormStep localOverrides={...} /> and merged via
 * mergeRouteConfig (shared utility — outside this module).
 */

/**
 * Example cross-field rule (optional).
 * Example: if category is SUPPORT, description must be at least 20 characters.
 * Works for both single-step (all fields on one page) and multi-step
 * (only when both fields exist on the *current* step's formData).
 *
 * For true cross-step rules, read earlier steps from wizard `formData` /
 * session in the page wrapper — not here.
 */
export const exampleCrossFieldValidations = [
  {
    id: "SUPPORT_NEEDS_LONGER_DESCRIPTION",
    fields: ["description"],
    message: "EXAMPLE_SUPPORT_DESCRIPTION_TOO_SHORT",
    /**
     * @param {object} formData Live DynamicForm values for the current step.
     * @returns {boolean} true = valid
     */
    validate: (formData) => {
      const categoryCode =
        typeof formData?.category === "object"
          ? formData.category?.code
          : formData?.category;
      if (String(categoryCode || "").toUpperCase() !== "SUPPORT") return true;
      const text = String(formData?.description || "").trim();
      // If description is not on this step yet, skip (multi-step step 1).
      if (formData?.description === undefined) return true;
      return text.length >= 20;
    },
  },
];

/**
 * Example static fields stamped onto the mock API payload.
 * buildApiPayload merges these when present on routeConfig.
 */
export const exampleStaticFields = () => ({
  source: "MULTI_STEPS_FORM_EXAMPLE",
  applicationStatus: "DRAFT_SUBMITTED",
});

/**
 * Default localOverrides object passed to every ExampleFormStep.
 */
const exampleLocalOverrides = {
  crossFieldValidations: exampleCrossFieldValidations,
  staticFields: exampleStaticFields,
  payloadKey: "Applications",
};

export default exampleLocalOverrides;
