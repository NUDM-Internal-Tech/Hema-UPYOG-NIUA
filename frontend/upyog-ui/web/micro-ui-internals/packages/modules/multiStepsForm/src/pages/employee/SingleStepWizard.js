/**
 * SingleStepWizard.js
 *
 * ONE fill page → Check → Acknowledgement
 *
 * Uses the same shared pieces as multi-step:
 *   useDynamicWizard + DynamicFormStep + DynamicCheckPage
 * Difference is only the local JSON: one body step with nextStep: null.
 *
 * Routes (relative to this wizard mount):
 *   /application/*   → ExampleFormStep
 *   /check/*         → ExampleCheckPage (mode="single")
 *   /acknowledgement → ExampleAcknowledgement
 */

import React from "react";
import {
  Loader,
  useDynamicWizard,
  getWizardStepRoutes,
} from "@nudmcdgnpm/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import { singleStepForm } from "../../config";
import ExampleCheckPage from "./ExampleCheckPage";
import ExampleAcknowledgement from "./ExampleAcknowledgement";

const SingleStepWizard = () => {
  const { t } = useTranslation();

  // Local JSON stands in for MDMS — same array shape: [ { head, body: [...] } ]
  const fillRoutes = getWizardStepRoutes(
    // preview flatten — buildWizardSteps runs inside the hook too
    singleStepForm?.[0]?.body || []
  );

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
    wizardConfig: singleStepForm,
    indexRoute: "application",
    sessionKey: "EXAMPLE_SINGLE_STEP_FORM",
    // Every fill route + check + ack — used to derive wizard base path
    terminalSegments: [...fillRoutes, "application", "check", "acknowledgement"],
    // Still true: goNext understands nextStep; with one step it just goes to /check
    multiStepNavigation: true,
  });

  if (!isReady) return <Loader />;

  return (
    <Routes>
      {/* One Route per fill step from config (here: only "application") */}
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
            mode="single"
            steps={config}
            value={params}
            onSubmit={onCheckSuccess}
            onError={onCheckError}
            editRoute={`${match?.pathnameBase || ""}/application`}
          />
        }
      />

      <Route
        path="acknowledgement/*"
        element={<ExampleAcknowledgement onSuccess={onAckSuccess} />}
      />

      {/* Default entry → first fill step */}
      <Route index element={<Navigate to="application" replace />} />
      <Route path="*" element={<Navigate to="application" replace />} />
    </Routes>
  );
};

export default SingleStepWizard;
