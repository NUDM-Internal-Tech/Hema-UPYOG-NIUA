/**
 * ExampleAcknowledgement.js
 *
 * Simple success / failure screen after mock submit.
 * Reads location.state from useDynamicWizard.onCheckSuccess / onCheckError.
 */

import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Banner, Card, CardText, SubmitBar } from "@nudmcdgnpm/digit-ui-react-components";

const ExampleAcknowledgement = ({ onSuccess }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const state = location?.state || {};
  const isSuccess = state.isSuccess !== false;
  const applicationNo =
    state?.data?.Applications?.[0]?.applicationNo ||
    state?.data?.applicationNo ||
    "";

  useEffect(() => {
    if (isSuccess) onSuccess?.();
  }, [isSuccess, onSuccess]);

  const { path: modulePath } = Digit.Hooks.useModuleBasePath();

  return (
    <Card>
      <Banner
        message={
          isSuccess
            ? t("EXAMPLE_SUBMIT_SUCCESS") || "Application submitted (example)"
            : t("EXAMPLE_SUBMIT_FAILED") || "Submission failed (example)"
        }
        applicationNumber={applicationNo || ""}
        info={
          applicationNo
            ? t("EXAMPLE_APPLICATION_NO") || "Application No"
            : state?.error?.message || ""
        }
        successful={isSuccess}
      />
      <CardText>
        {t("EXAMPLE_ACK_HINT") ||
          "This is a sample module — no real API was called. Check the browser console for the mock payload."}
      </CardText>
      <Link to={`${modulePath || ""}`}>
        <SubmitBar label={t("CS_COMMON_BACK_HOME") || "Back to example home"} />
      </Link>
    </Card>
  );
};

export default ExampleAcknowledgement;
