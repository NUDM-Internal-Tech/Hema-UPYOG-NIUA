/**
 * tlPropertySearch.js
 * Property lookup helpers for TL DynamicForm searchCard.
 * Accepts a property ID or a 10-digit mobile number.
 */

/** PT citizen search treats a 10-digit number starting at 5 as a mobile. */
const MOBILE_QUERY = /^[5-9]\d{9}$/;

/**
 * Search PT properties by property ID or owner mobile.
 * Tries citizen tenant first, then state tenant (common for PG property ids).
 * @param {string} query property id or mobile number
 * @param {string} tenantId
 * @returns {Promise<object[]>}
 */
export const searchPropertyById = async (query, tenantId) => {
  const value = String(query || "").trim();
  if (!value) return [];

  const filters = MOBILE_QUERY.test(value)
    ? { mobileNumber: value }
    : { propertyIds: value };

  const tenants = [
    tenantId,
    Digit.ULBService.getCitizenCurrentTenant?.(true),
    Digit.ULBService.getCurrentTenantId?.(),
    Digit.ULBService.getStateId?.(),
  ].filter((t, i, arr) => t && arr.indexOf(t) === i);

  for (const tid of tenants) {
    try {
      const response = await Digit.PTService.search({
        tenantId: tid,
        filters,
        auth: true,
      });
      const list = Array.isArray(response?.Properties) ? response.Properties : [];
      if (list.length) return list;
    } catch (err) {
      console.warn("TL property search failed for tenant", tid, err);
    }
  }
  return [];
};

/**
 * Format a short address line for search-result / property cards.
 * @param {object} property
 * @returns {string}
 */
const formatPropertyAddress = (property = {}) => {
  const address = property.address || {};
  const parts = [
    address.doorNo,
    address.street || address.buildingName,
    address.landmark,
    address.locality?.name || address.locality?.code,
    address.city || property.tenantId,
    address.pincode,
  ].filter(Boolean);
  return parts.join(", ");
};

/**
 * Latest owner first, same order as CPTPropertyDetails.
 * @param {object} property
 * @returns {object}
 */
const getPrimaryOwner = (property = {}) => {
  const owners = Array.isArray(property.owners) ? property.owners.slice().reverse() : [];
  return owners[0] || {};
};

/**
 * Persist CPT session keys the way tl_old PropertyDetails.goNext does,
 * so CheckPage / convertToTrade / same-as-property-owner keep working.
 * @param {object} property
 */
export const persistPropertySession = (property = {}) => {
  if (!property?.propertyId) return;
  try {
    sessionStorage.setItem("KnowProperty", "TL_COMMON_YES");
    sessionStorage.setItem("cpt", JSON.stringify(property));
    if (Digit?.SessionStorage?.set) {
      Digit.SessionStorage.set("cpt", property);
    }
  } catch (e) {
    console.warn("TL persistPropertySession failed", e);
  }
};

/**
 * Prefill DynamicForm fields + stash full property for CheckPage / convertToTrade.
 * @param {object} property
 * @returns {object}
 */
export const mapPropertyToFormPrefill = (property = {}) => {
  const address = property.address || {};
  return {
    propertyId: property.propertyId || "",
    searchPropertyId: property.propertyId || "",
    hasPropertyId: "YES",
    showTradeDetails: "YES",
    pincode: address.pincode || "",
    city: property.tenantId || address.city || "",
    locality: address.locality?.code || address.locality || "",
    street: address.street || "",
    doorNo: address.doorNo || "",
    landmark: address.landmark || "",
    __property: property,
  };
};

/**
 * Map a PT Property into DynamicForm search-panel match shape.
 * Uses `estateNo` as the panel's generic result id (DynamicForm convention).
 *
 * @param {object} property
 * @returns {object}
 */
export const mapPropertyToSearchMatch = (property = {}) => {
  const propertyId = property.propertyId || "";
  const owner = getPrimaryOwner(property);
  const addressLine = formatPropertyAddress(property);
  return {
    estateNo: propertyId,
    label: propertyId,
    subtitle: [owner?.name, owner?.mobileNumber, addressLine].filter(Boolean).join(" — "),
    prefill: mapPropertyToFormPrefill(property),
  };
};
