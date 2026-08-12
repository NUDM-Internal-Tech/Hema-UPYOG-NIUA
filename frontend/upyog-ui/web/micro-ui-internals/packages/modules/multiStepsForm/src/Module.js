/**
 * Module.js
 *
 * Entry for the multiStepsForm sample module.
 *
 * Registers:
 *   - ExampleFormStep          shared fill-step wrapper (used by every JSON step)
 *   - SingleStepWizard      one-page wizard
 *   - MultiStepWizard       three-page wizard
 *   - ExampleCheckPage         review / mock submit
 *   - ExampleAcknowledgement   success / failure banner
 *
 * Wire this module into the employee shell the same way as EST/PTR
 * (enabledModules + lazy import). Until then you can still read the code
 * as a reference implementation.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { CitizenHomeCard, PropertyHouse } from "@nudmcdgnpm/digit-ui-react-components";
import EmployeeApp from "./pages/employee";
import ExampleFormStep from "./pageComponents/ExampleFormStep";
import SingleStepWizard from "./pages/employee/SingleStepWizard";
import MultiStepWizard from "./pages/employee/MultiStepWizard";
import ExampleCheckPage from "./pages/employee/ExampleCheckPage";
import ExampleAcknowledgement from "./pages/employee/ExampleAcknowledgement";

const componentsToRegister = {
  ExampleFormStep,
  SingleStepWizard,
  MultiStepWizard,
  ExampleCheckPage,
  ExampleAcknowledgement,
};

let componentsRegistered = false;

const addComponentsToRegistry = () => {
  if (componentsRegistered || !Digit?.ComponentRegistryService?.setComponent) return;
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
  componentsRegistered = true;
};

/**
 * Root module component — employee example only for now.
 */
export const MultiStepsFormModule = ({ stateCode, userType, tenants }) => {
  const { path } = Digit.Hooks.useModuleBasePath();
  // Must match enabledModules + MDMS citymodule `code` (URL = code.toLowerCase()).
  const moduleCode = "MultiStepsForm";
  const language = Digit.StoreData.getCurrentLanguage();
  Digit.Services.useStore({ stateCode, moduleCode, language });
  addComponentsToRegistry();
  Digit.SessionStorage.set("MULTISTEPSFORM_TENANTS", tenants);

  if (userType === "employee") {
    return <EmployeeApp path={path} userType={userType} />;
  }

  return <EmployeeApp path={path} userType={userType} />;
};

export const MultiStepsFormLinks = () => {
  const { t } = useTranslation();
  const links = [
    {
      link: `/single`,
      i18nKey: t("EXAMPLE_SINGLE_OPTION") || "Single-step form",
    },
    {
      link: `/multi`,
      i18nKey: t("EXAMPLE_MULTI_OPTION") || "Multi-step form",
    },
  ];

  return (
    <CitizenHomeCard
      header={t("EXAMPLE_MODULE_TITLE") || "DynamicForm examples"}
      links={links}
      Icon={() => <PropertyHouse />}
    />
  );
};

export const MultiStepsFormComponents = {
  MultiStepsFormModule,
  MultiStepsFormLinks,
};

export default MultiStepsFormModule;
