/**
 * config/index.js
 *
 * Local form configs for the DynamicForm example module.
 *
 * In production EST/etc., the same shape usually comes from MDMS.
 * Here we keep JSON in-repo so the sample runs without MDMS deploy.
 *
 * Shape (identical to MDMS masters like Estate.NewRegistration):
 *   [ { head, body: [ { route, key, component, form, nextStep, ... } ] } ]
 */

import singleStepForm from "./singleStepForm.json";
import multiStepForm from "./multiStepForm.json";
import exampleLocalOverrides, {
  exampleCrossFieldValidations,
  exampleStaticFields,
} from "./localOverrides";

export {
  singleStepForm,
  multiStepForm,
  exampleLocalOverrides,
  exampleCrossFieldValidations,
  exampleStaticFields,
};

export default {
  singleStepForm,
  multiStepForm,
  exampleLocalOverrides,
};
