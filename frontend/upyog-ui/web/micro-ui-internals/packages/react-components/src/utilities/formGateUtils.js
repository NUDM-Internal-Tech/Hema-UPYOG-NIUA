/**
 * formGateUtils.js
 *
 * Resolves the optional "registration / property gate" used by DynamicForm:
 * a top-of-form radio that either unlocks a search field or redirects to create
 * a related entity (asset / property), then reveals the rest of the form.
 *
 * Modules can set `routeConfig.formGate` explicitly. When omitted, the gate is
 * inferred from field names so Estate (assetRegistrationType) and Trade License
 * (hasPropertyId) keep working without duplicate hardcoded branches.
 *
 * @see DynamicForm
 */

/** Estate NewRegistration defaults (existing asset vs new building). */
export const ESTATE_FORM_GATE = {
  typeField: "assetRegistrationType",
  detailsField: "showRegistrationDetails",
  searchValue: "EXISTING_ASSET",
  openValue: "NEW_BUILDING",
  searchField: "searchEstateNo",
  redirectOnValue: null,
  redirectModalHeading: "EST_CREATE_NEW_REGISTRATION",
  redirectModalMessage: "EST_CREATE_NEW_REGISTRATION_REDIRECT_INFO",
};

/** Trade License NewApplication defaults (has property ID vs create property). */
export const TL_PROPERTY_FORM_GATE = {
  typeField: "hasPropertyId",
  detailsField: "showTradeDetails",
  searchValue: "YES",
  openValue: null,
  searchField: "searchPropertyId",
  redirectOnValue: "NO",
  redirectPath: "/upyog-ui/citizen/pt/property/new-application/info",
  redirectModalHeading: "TL_CREATE_NEW_PROPERTY",
  redirectModalMessage: "TL_PROCEED_POST_APPROVAL",
  redirectModalMessageDefault:
    "You will be able to proceed post approval.",
};

/**
 * Resolve the active form gate for a DynamicForm route.
 *
 * @param {object}   [routeConfig]
 * @param {object[]} [flatFields] Flattened leaf field configs.
 * @returns {object|null} Gate config, or null when the form has no gate.
 */
export const resolveFormGate = (routeConfig = {}, flatFields = []) => {
  if (routeConfig?.formGate && typeof routeConfig.formGate === "object") {
    const base =
      routeConfig.formGate.typeField === "hasPropertyId"
        ? TL_PROPERTY_FORM_GATE
        : ESTATE_FORM_GATE;
    return { ...base, ...routeConfig.formGate };
  }

  const names = new Set(
    (flatFields || []).map((fc) => fc?.field?.name).filter(Boolean)
  );

  if (names.has("hasPropertyId")) return { ...TL_PROPERTY_FORM_GATE };
  if (names.has("assetRegistrationType")) return { ...ESTATE_FORM_GATE };
  return null;
};

/**
 * Find the first createNewPath declared on any field in the form
 * (search field first, then any other field).
 *
 * @param {object[]} flatFields
 * @param {string}   [preferredFieldName]
 * @returns {string|null}
 */
export const resolveCreateNewPath = (flatFields = [], preferredFieldName) => {
  if (preferredFieldName) {
    const preferred = flatFields.find((fc) => fc?.field?.name === preferredFieldName);
    if (preferred?.field?.createNewPath) return preferred.field.createNewPath;
  }
  const any = flatFields.find((fc) => fc?.field?.createNewPath);
  return any?.field?.createNewPath || null;
};

/**
 * Whether the wizard ActionBar should show for a gated form.
 * Details unlocked (YES) → show. Open-path gate value → show.
 * TL movable trades set detailsField without using the property gate.
 *
 * @param {object|null} formGate
 * @param {object}      formData
 * @returns {boolean}
 */
export const shouldShowGatedActionBar = (formGate, formData = {}) => {
  if (!formGate) return true;
  const details = String(formData[formGate.detailsField] || "").toUpperCase();
  if (details === "YES") return true;
  if (
    formGate.openValue &&
    String(formData[formGate.typeField] || "").toUpperCase() ===
      String(formGate.openValue).toUpperCase()
  ) {
    return true;
  }
  // TL movable: structure chosen, details already unlocked above.
  // IMMOVABLE without property keeps details empty → hide action bar.
  return false;
};
