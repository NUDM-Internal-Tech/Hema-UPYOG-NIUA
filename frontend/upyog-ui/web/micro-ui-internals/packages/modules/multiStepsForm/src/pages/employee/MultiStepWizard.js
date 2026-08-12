/**
 * MultiStepWizard.js
 *
 * THREE fill pages → Check → Acknowledgement
 *
 * Same engine as SingleStepWizard. Only differences:
 *   1. multiStepForm.json has 3 body steps chained by nextStep
 *   2. ExampleCheckPage mode="multi" summarizes every step
 *
 * Flow:
 *   /basic → /contact → /documents → /check → /acknowledgement
 *
 * nextStep on the last fill step is null → createWizardGoNext navigates to "check".
 */

import React from "react";
import {
  Loader,
  useDynamicWizard,
  getWizardStepRoutes,
} from "@nudmcdgnpm/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import { multiStepForm } from "../../config";
import ExampleCheckPage from "./ExampleCheckPage";
import ExampleAcknowledgement from "./ExampleAcknowledgement";

const MultiStepWizard = () => {
  const { t } = useTranslation();

  const fillRoutes = getWizardStepRoutes(multiStepForm?.[0]?.body || []);

  const {
    config,
    params,
    handleSelect,
    onAckSuccess,
    onCheckSuccess,
    onCheckError,
    isReady,
    match,
  } = useDynamicWizard({
    wizardConfig: multiStepForm,
    indexRoute: "basic",
    sessionKey: "EXAMPLE_MULTI_STEP_FORM",
    terminalSegments: [...fillRoutes, "basic", "contact", "documents", "check", "acknowledgement"],
    multiStepNavigation: true,
  });

  if (!isReady) return <Loader />;

  return (
    <Routes>
      {/*
        config = [basic, contact, documents]
        Each step reuses the SAME ExampleFormStep component; only `config` (form fields) changes.
      */}
      {config.map((routeObj, index) => {
        const Component =
          typeof routeObj.component === "string"
            ? Digit.ComponentRegistryService.getComponent(routeObj.component)
            : routeObj.component;

        return (
          <Route
            path={`${routeObj.route}/*`}
            key={routeObj.key || index}
            element={
              <Component
                config={routeObj}
                onSelect={handleSelect}
                t={t}
                formData={params}
                persistedData={params}
                parentRoute={match?.pathnameBase}
              />
            }
          />
        );
      })}

      <Route
        path="check/*"
        element={
          <ExampleCheckPage
            mode="multi"
            steps={config}
            value={params}
            onSubmit={onCheckSuccess}
            onError={onCheckError}
          />
        }
      />

      <Route
        path="acknowledgement/*"
        element={<ExampleAcknowledgement onSuccess={onAckSuccess} />}
      />

      <Route index element={<Navigate to="basic" replace />} />
      <Route path="*" element={<Navigate to="basic" replace />} />
    </Routes>
  );
};

export default MultiStepWizard;
