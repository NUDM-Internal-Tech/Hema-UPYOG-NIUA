/**
 * ExampleFormStep.js
 *
 * Thin, reusable page wrapper around shared DynamicFormStep.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * DynamicFormStep already:
 *   1. Merges JSON/MDMS step config + localOverrides (mergeRouteConfig)
 *   2. Renders Header + DynamicForm
 *   3. On Save & Next → attachRouteConfigToStepData → parent onSelect
 *
 * Module pages should stay thin — only pass config, overrides, and callbacks.
 * The SAME component is used for every step in single-step AND multi-step
 * wizards; the `config` prop (from the wizard route) decides which fields show.
 *
 * FLOW
 * ----
 *   Wizard index (SingleStepWizard / MultiStepWizard)
 *     → <ExampleFormStep config={routeObj} onSelect={handleSelect} formData={params} />
 *       → DynamicFormStep
 *         → DynamicForm → DynamicFormField × N
 */

import React from "react";
import { DynamicFormStep } from "@nudmcdgnpm/digit-ui-react-components";
import { exampleLocalOverrides } from "../config";

/**
 * @param {object}   props
 * @param {Function} props.onSelect      Wizard handleSelect from useDynamicWizard
 * @param {object}   props.config        Current step from buildWizardSteps (route, key, form, …)
 * @param {object}   [props.formData]    Full wizard session (all steps so far)
 * @param {object}   [props.persistedData] Alias some wizards pass instead of formData
 * @param {Function} [props.t]           i18n
 * @param {boolean}  [props.isEditMode]
 * @param {object}   [props.editData]
 */
const ExampleFormStep = ({
  onSelect,
  config,
  formData,
  persistedData,
  t,
  isEditMode,
  editData,
}) => {
  return (
    <DynamicFormStep
      // Step definition from local JSON (or later MDMS)
      config={config}
      // JS-only behaviour (cross-field rules, staticFields, …)
      localOverrides={exampleLocalOverrides}
      // Advances wizard: session merge + navigate nextStep|/check
      onSelect={onSelect}
      // Prefer live session; fall back to persistedData
      formData={formData ?? persistedData}
      persistedData={persistedData}
      isEditMode={isEditMode}
      editData={editData}
      t={t}
      // Shown if pageHeading i18n key is missing
      defaultHeaderCode="EXAMPLE_FORM_TITLE"
      wrapperClassName="employeeCard"
      // Opt-in Cancel confirmation modal (shared DynamicForm prop)
      confirmCancel
    />
  );
};

export default ExampleFormStep;
