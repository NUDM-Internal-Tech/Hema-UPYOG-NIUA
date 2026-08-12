/**
 * employee/index.js
 *
 * Example module home — pick Single-step or Multi-step, then run that wizard.
 *
 * Mount paths (under the module base path, e.g. /upyog-ui/employee/multistepsform):
 *   /                → chooser cards
 *   /single/*        → SingleStepWizard
 *   /multi/*         → MultiStepWizard
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Route, Routes } from "react-router-dom";
import {
  AppContainer,
  BackButton,
  Card,
  CardHeader,
  CardText,
  PrivateRoute,
} from "@nudmcdgnpm/digit-ui-react-components";
import { useLocation } from "react-router-dom";
import SingleStepWizard from "./SingleStepWizard";
import MultiStepWizard from "./MultiStepWizard";

const ExampleHome = ({ path }) => {
  const { t } = useTranslation();

  return (
    <div>
      <Card>
        <CardHeader>
          {t("EXAMPLE_MODULE_TITLE") || "DynamicForm examples"}
        </CardHeader>
        <CardText>
          {t("EXAMPLE_MODULE_INTRO") ||
            "Same DynamicForm engine for both options. Config is local JSON in this module; shared helpers live in react-components utilities."}
        </CardText>
      </Card>

      <Card style={{ marginTop: "1rem" }}>
        <CardHeader>{t("EXAMPLE_SINGLE_OPTION") || "1. Single-step form"}</CardHeader>
        <CardText>
          {t("EXAMPLE_SINGLE_OPTION_DESC") ||
            "One fill page with all fields → Check → Acknowledgement. nextStep is null on the only step."}
        </CardText>
        <Link to={`${path}/single`} style={{ fontWeight: 700 }}>
          {t("EXAMPLE_OPEN_SINGLE") || "Open single-step wizard →"}
        </Link>
      </Card>

      <Card style={{ marginTop: "1rem" }}>
        <CardHeader>{t("EXAMPLE_MULTI_OPTION") || "2. Multi-step form"}</CardHeader>
        <CardText>
          {t("EXAMPLE_MULTI_OPTION_DESC") ||
            "Three fill pages (basic → contact → documents) chained by nextStep → Check (all sections) → Acknowledgement."}
        </CardText>
        <Link to={`${path}/multi`} style={{ fontWeight: 700 }}>
          {t("EXAMPLE_OPEN_MULTI") || "Open multi-step wizard →"}
        </Link>
      </Card>
    </div>
  );
};

const EmployeeApp = ({ path }) => {
  const location = useLocation();
  const hideBack =
    location.pathname.includes("/acknowledgement") ||
    location.pathname.endsWith("/multistepsform") ||
    location.pathname.endsWith("/multistepsform/");

  return (
    <AppContainer>
      {!hideBack ? <BackButton location={location} /> : null}
      <Routes>
        <Route
          index
          element={
            <PrivateRoute>
              <ExampleHome path={path} />
            </PrivateRoute>
          }
        />
        <Route
          path="single/*"
          element={
            <PrivateRoute>
              <SingleStepWizard />
            </PrivateRoute>
          }
        />
        <Route
          path="multi/*"
          element={
            <PrivateRoute>
              <MultiStepWizard />
            </PrivateRoute>
          }
        />
      </Routes>
    </AppContainer>
  );
};

export default EmployeeApp;
