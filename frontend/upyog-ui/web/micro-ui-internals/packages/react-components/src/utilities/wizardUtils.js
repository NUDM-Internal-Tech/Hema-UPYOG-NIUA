/**
 * wizardUtils.js
 *
 * Shared, module-agnostic helpers for DynamicForm wizards (one-step or multi-step).
 * Used by any UPYOG module — keep EST / demo / future modules thin by importing
 * these instead of copying goNext / step-flattening logic.
 *
 * Responsibilities
 * ----------------
 * 1. Flatten MDMS- or local-JSON wizard masters into routable step objects.
 * 2. Derive the wizard base path from the current URL.
 * 3. Build a goNext navigator (nextStep string → route, null → /check).
 * 4. Collect flat field values from every completed step (final payload / check).
 *
 * Config shape (same as MDMS Estate.* masters)
 * --------------------------------------------
 *   [
 *     {
 *       head: "SOME_HEADING",
 *       body: [
 *         { route, key, component, form, nextStep, payloadKey, ... },
 *         ...
 *       ]
 *     }
 *   ]
 *
 * @see useDynamicWizard
 * @see DynamicFormStep
 * @see mergeSessionStepWithRouteConfig
 */

import { extractWizardFormValues } from "./checkPageUtils";

/** Preview-only components that should not become employee fill routes. */
const DEFAULT_SKIP_COMPONENTS = new Set(["ReviewDetails"]);

/**
 * Flatten a wizard master (MDMS array or local JSON) into routable fill steps.
 *
 * @param {Array<object>|null|undefined} initialConfig  Wizard master array.
 * @param {string} [indexRoute]                         First route name (stored on array).
 * @param {object} [options]
 * @param {Set<string>|string[]} [options.skipComponents] Extra component names to skip.
 * @returns {Array<object>} Steps array; also has `.indexRoute` when provided.
 */
export const buildWizardSteps = (initialConfig, indexRoute, options = {}) => {
  if (!initialConfig || !Array.isArray(initialConfig)) return [];

  const skip = new Set([
    ...DEFAULT_SKIP_COMPONENTS,
    ...(options.skipComponents || []),
  ]);

  const steps = initialConfig.reduce((acc, entry) => {
    if (!entry?.body) return acc;
    return acc.concat(
      entry.body.filter((step) => {
        if (step.hideInEmployee) return false;
        if (skip.has(step.component)) return false;
        // Empty preview stubs are not fillable form pages.
        if (step.isPreview && (!Array.isArray(step.form) || step.form.length === 0)) {
          return false;
        }
        return true;
      })
    );
  }, []);

  if (indexRoute) steps.indexRoute = indexRoute;
  return steps;
};

/**
 * Resolve the wizard base path used for relative navigate("check") / ack.
 *
 * Prefer React Router's module `pathnameBase`. Fallback: strip the last
 * terminal segment (check, acknowledgement, or a step route) from pathname.
 *
 * @param {string} pathname
 * @param {string} [pathnameBase]
 * @param {string[]} [terminalSegments=["check","acknowledgement"]]
 * @returns {string}
 */
export const getWizardBasePath = (
  pathname,
  pathnameBase,
  terminalSegments = ["check", "acknowledgement"]
) => {
  if (pathnameBase) return pathnameBase;

  const parts = String(pathname || "").split("/");
  const terminalIndex = parts.findIndex((p) => terminalSegments.includes(p));
  if (terminalIndex > 0) {
    return parts.slice(0, terminalIndex).join("/");
  }
  return parts.slice(0, -1).join("/");
};

/**
 * Create the shared "Save & Next" navigator used by DynamicForm wizards.
 *
 * Behaviour
 * ---------
 * - Reads current route segment from pathname.
 * - Looks up that step in `config` and reads `nextStep`.
 * - `nextStep === null` or non-string → navigate to `"check"`.
 * - Otherwise navigate to the next step route (optional multi-entry index).
 *
 * @param {object}   args
 * @param {string}   args.pathname     Current location.pathname.
 * @param {Array}    args.config       Flattened steps from buildWizardSteps.
 * @param {Function} args.navigate     Digit.Hooks.useCustomNavigate() (or RR navigate).
 * @param {boolean}  [args.multiStep=true] Enable indexed multi-entry path handling.
 * @returns {Function} goNext(skipStep, index, isAddMultiple, key)
 */
export const createWizardGoNext = ({ pathname, config, navigate, multiStep = true }) => {
  return (skipStep, index, isAddMultiple, key) => {
    let currentPath = String(pathname || "").split("/").pop();
    let isMultiple = false;

    if (multiStep) {
      const lastchar = currentPath.charAt(currentPath.length - 1);
      if (Number(parseInt(currentPath, 10)) || currentPath === "0" || currentPath === "-1") {
        if (currentPath === "-1" || currentPath === "-2") {
          currentPath = pathname.slice(0, -3).split("/").pop();
        } else {
          currentPath = pathname.slice(0, -2).split("/").pop();
        }
        isMultiple = true;
      } else {
        isMultiple = false;
      }
      if (!Number.isNaN(Number(lastchar))) isMultiple = true;
    }

    let { nextStep = {} } = config.find((routeObj) => routeObj.route === currentPath) || {};

    let redirectWithHistory = (to, state) =>
      navigate(to, state != null ? { state } : undefined);

    if (skipStep) {
      redirectWithHistory = (to, state) =>
        navigate(to, state != null ? { replace: true, state } : { replace: true });
    }

    if (isAddMultiple) nextStep = key;
    if (nextStep === null) return redirectWithHistory("check");
    if (typeof nextStep !== "string") return redirectWithHistory("check");

    const nextPage =
      multiStep && !Number.isNaN(Number(nextStep.split("/").pop())) && nextStep !== "map"
        ? `${nextStep}`
        : isMultiple && nextStep !== "map"
          ? `${nextStep}/${index}`
          : `${nextStep}`;

    redirectWithHistory(nextPage);
  };
};

/**
 * Merge flat field values from every fill step in the wizard session.
 * Useful on the check page / mock submit when the final API wants one object.
 *
 * @param {object}   session      Wizard session from useSessionStorage.
 * @param {Array}    steps        Flattened steps (buildWizardSteps result).
 * @param {string}   [fallbackPayloadKey="Applications"]
 * @returns {object} Combined flat field map.
 */
export const collectWizardFlatValues = (
  session = {},
  steps = [],
  fallbackPayloadKey = "Applications"
) =>
  (steps || []).reduce((acc, step) => {
    const payloadKey = step?.payloadKey || fallbackPayloadKey;
    const flat = extractWizardFormValues(session, step?.key, payloadKey);
    return { ...acc, ...(flat || {}) };
  }, {});

/**
 * List of fill-step route names — handy for terminalSegments in useDynamicWizard.
 *
 * @param {Array<object>} steps
 * @returns {string[]}
 */
export const getWizardStepRoutes = (steps = []) =>
  steps.map((s) => s.route).filter(Boolean);
