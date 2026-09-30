/**
 * TLCitizenNewApplication.js
 *
 * Citizen Trade License create step — thin wrapper around ConfigDrivenFormStep.
 * Accordion vs stepped layout comes from navigation.pattern / accordionConfig.
 * Billing slabs + enrichFieldArrayRow stay in the TL module (not workbench JSON).
 */
import React, { useCallback, useEffect } from "react";
import { ConfigDrivenFormStep } from "@nudmcdgnpm/digit-ui-react-components";
import tlFormConfig from "../config/tlFormConfig";
import {
  mapPropertyToSearchMatch,
  persistPropertySession,
  searchPropertyById,
} from "../utils/tlPropertySearch";
import {
  enrichTlBillingSlabRow,
  ensureTlBillingSlabFieldRule,
  filterTradeUnitDropdownByBillingSlabs,
  selectCitizenNewBillingSlabs,
} from "../utils/tlBillingSlab";

const TLCitizenNewApplication = ({
  onSelect,
  config,
  persistedData,
  formData,
  isEditMode,
  editData,
  t,
}) => {
  const tenantId =
    Digit.ULBService.getCitizenCurrentTenant?.(true) ||
    Digit.ULBService.getCurrentTenantId();

  useEffect(() => {
    ensureTlBillingSlabFieldRule();
  }, []);

  const { data: billingSlabs = [] } = Digit.Hooks.tl.useTradeLicenseBillingslab(
    { tenantId, filters: {} },
    {
      enabled: !!tenantId,
      select: selectCitizenNewBillingSlabs,
    }
  );

  const enrichFieldArrayRow = useCallback(
    (ctx) =>
      enrichTlBillingSlabRow({
        ...ctx,
        billingSlabs,
      }),
    [billingSlabs]
  );

  const transformDropdownData = useCallback(
    (dropdownData, values) =>
      filterTradeUnitDropdownByBillingSlabs(dropdownData, values, billingSlabs),
    [billingSlabs]
  );

  const handleFieldSearch = useCallback(
    async (fieldName, values) => {
      if (fieldName !== "searchPropertyId") return null;

      const propertyId = String(values?.searchPropertyId || "").trim();
      if (!propertyId) {
        return { error: "Enter a property ID or mobile number" };
      }

      try {
        const properties = await searchPropertyById(propertyId, tenantId);
        if (!properties.length) {
          return { notFound: true, estateNo: propertyId };
        }

        return {
          matches: properties.map(mapPropertyToSearchMatch),
        };
      } catch (err) {
        console.error("TL property search failed:", err);
        return { error: "CS_SOMETHING_WENT_WRONG" };
      }
    },
    [tenantId]
  );

  const handlePrefillApplied = useCallback((prefill = {}) => {
    if (prefill.__property) {
      persistPropertySession(prefill.__property);
    }
  }, []);

  return (
    <ConfigDrivenFormStep
      config={config}
      localOverrides={tlFormConfig}
      onSelect={onSelect}
      persistedData={persistedData}
      formData={formData}
      isEditMode={isEditMode}
      editData={editData}
      t={t}
      tenantId={tenantId}
      defaultHeaderCode="TL_COMMON_NEW_TRADE_LICENSE"
      onFieldSearch={handleFieldSearch}
      onPrefillApplied={handlePrefillApplied}
      enrichFieldArrayRow={enrichFieldArrayRow}
      transformDropdownData={transformDropdownData}
      confirmCancel
      wrapperClassName="tl-citizen-form-step"
      accordionWrapperClassName="tl-citizen-form-step tl-citizen-form-step--accordion"
    />
  );
};

export default TLCitizenNewApplication;
