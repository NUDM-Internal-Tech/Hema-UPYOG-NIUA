/**
 * ExampleCheckPage.js
 *
 * Review screen before final submit — wraps shared DynamicCheckPage helpers.
 *
 * SINGLE-STEP
 * -----------
 * One DynamicCheckPage for the only fill step (key = "application").
 *
 * MULTI-STEP
 * ----------
 * DynamicCheckPage is designed around one step key + one routeConfig.form.
 * For multiple steps we render one summary block per step, then a single
 * declaration + Submit at the bottom.
 *
 * SUBMIT (example)
 * -------------
 * No real backend. We build a payload with shared buildApiPayload /
 * collectWizardFlatValues, log it, and call onSubmit so the wizard navigates
 * to acknowledgement. Swap the mock mutation for a real Digit hook later.
 */

import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardSubHeader,
  CheckBox,
  DynamicCheckPage,
  SubmitBar,
  StatusTable,
  Row,
  buildApiPayload,
  buildSummarySections,
  collectWizardFlatValues,
  defaultCheckNA,
  extractWizardFormValues,
  formatCheckPageDate,
  mergeRouteConfig,
  resolveActiveRouteConfig,
  resolveFieldLabelKey,
  resolveSummaryFieldValue,
  useDynamicCheckSubmit,
} from "@nudmcdgnpm/digit-ui-react-components";
import { exampleLocalOverrides } from "../../config";

/**
 * Mock react-query-style mutation for the example (no network).
 * useDynamicCheckSubmit expects `{ mutate(payload, { onSuccess, onError }) }`.
 */
const createMockMutation = () => ({
  mutate: (payload, { onSuccess, onError } = {}) => {
    try {
      const first =
        (payload?.Applications && payload.Applications[0]) || payload || {};
      const response = {
        ResponseInfo: { status: "successful" },
        Applications: [
          {
            applicationNo: `EXAMPLE-${Date.now()}`,
            ...first,
          },
        ],
      };
      // Open browser console to inspect the payload shape from buildApiPayload.
      console.info("[multiStepsForm example] mock submit payload:", payload);
      onSuccess?.(response);
    } catch (err) {
      onError?.(err);
    }
  },
});

/**
 * Resolve merged routeConfig for a step (session snapshot preferred).
 */
const useStepRouteConfig = (value, step) =>
  useMemo(() => {
    const fromSession = resolveActiveRouteConfig(value, null, step?.key);
    return mergeRouteConfig(fromSession || step || {}, exampleLocalOverrides);
  }, [value, step]);

/**
 * One read-only summary section for a wizard step (multi-step mode).
 */
const StepSummary = ({ step, value, t }) => {
  const routeConfig = useStepRouteConfig(value, step);
  const payloadKey = routeConfig?.payloadKey || "Applications";

  const formValues = useMemo(
    () => extractWizardFormValues(value, step.key, payloadKey),
    [value, step.key, payloadKey]
  );

  const { sections } = useMemo(
    () => buildSummarySections(routeConfig?.form || []),
    [routeConfig]
  );

  const title =
    t(routeConfig?.texts?.header || step?.sectionHeading || step?.key) ||
    step?.key;

  return (
    <Card style={{ marginBottom: "1rem" }}>
      <CardSubHeader>{title}</CardSubHeader>
      {sections.map((section, sIdx) => (
        <StatusTable key={section.headerCode || `section-${sIdx}`}>
          {section.headerCode ? (
            <CardSubHeader>{t(section.headerCode)}</CardSubHeader>
          ) : null}
          {section.fields?.map((fieldConfig) => (
            <Row
              key={fieldConfig.field?.name || fieldConfig.key}
              label={t(resolveFieldLabelKey(fieldConfig, formValues))}
              text={resolveSummaryFieldValue(fieldConfig, {
                formValues,
                t,
                formatDate: formatCheckPageDate,
                checkNA: defaultCheckNA,
              })}
            />
          ))}
        </StatusTable>
      ))}
    </Card>
  );
};

/**
 * Multi-step review UI with a single declaration checkbox + Submit.
 */
const MultiStepCheck = ({ steps, value, t, isSubmitting, onSubmit }) => {
  const [agree, setAgree] = useState(false);

  return (
    <div>
      <Card>
        <CardHeader>{t("EXAMPLE_SUMMARY_TITLE") || "Review & submit"}</CardHeader>
        <p style={{ margin: "0 0 1rem", color: "#505A5F" }}>
          {t("EXAMPLE_SUMMARY_HINT") ||
            "Confirm details from every step, then submit."}
        </p>
      </Card>

      {steps.map((step) => (
        <StepSummary key={step.key} step={step} value={value} t={t} />
      ))}

      <Card>
        <CheckBox
          label={t("EXAMPLE_DECLARATION") || "I declare the information is correct"}
          onChange={() => setAgree((v) => !v)}
          checked={agree}
        />
        <SubmitBar
          label={t("CS_COMMON_SUBMIT") || "Submit"}
          onSubmit={onSubmit}
          disabled={!agree || isSubmitting}
        />
      </Card>
    </div>
  );
};

/**
 * @param {object}   props
 * @param {"single"|"multi"} props.mode
 * @param {Array}    props.steps           Flattened wizard steps
 * @param {object}   props.value           Session params
 * @param {Function} props.onSubmit        useDynamicWizard.onCheckSuccess
 * @param {Function} props.onError         useDynamicWizard.onCheckError
 * @param {string}   [props.editRoute]     Path for Edit on single-step summary
 */
const ExampleCheckPage = ({
  mode = "single",
  steps = [],
  value = {},
  onSubmit,
  onError,
  editRoute,
}) => {
  const { t } = useTranslation();
  const tenantId = useMemo(() => Digit.ULBService.getCurrentTenantId(), []);
  const mockMutation = useMemo(() => createMockMutation(), []);

  const primaryStep = steps[0] || {};
  const primaryRouteConfig = useStepRouteConfig(value, primaryStep);

  /**
   * Build an example API-shaped payload from all steps' flat values.
   * Real modules replace this with domain-specific builders.
   */
  const buildPayload = useCallback(() => {
    const flat = collectWizardFlatValues(value, steps, "Applications");
    const lastStep = steps[steps.length - 1] || primaryStep;
    const lastFromSession = resolveActiveRouteConfig(value, null, lastStep.key);
    const lastConfig = mergeRouteConfig(lastFromSession || lastStep, exampleLocalOverrides);
    const body = buildApiPayload(lastConfig, flat, tenantId);
    return {
      RequestInfo: {
        apiId: lastConfig?.apiId || "example-form",
        msgId: `${Date.now()}|en_IN`,
      },
      Applications: [body],
    };
  }, [value, steps, primaryStep, tenantId]);

  const { isSubmitting, handleSubmit } = useDynamicCheckSubmit({
    routeConfig: primaryRouteConfig,
    buildPayload,
    mutation: mockMutation,
    onSubmit,
    onError,
    logTag: "EXAMPLE_CHECK",
  });

  if (mode === "single") {
    return (
      <DynamicCheckPage
        routeConfig={primaryRouteConfig}
        config={{ key: primaryStep.key || "application" }}
        value={value}
        editRoute={editRoute}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        summaryHeaderCode="EXAMPLE_SUMMARY_TITLE"
        defaultSectionHeaderCode="EXAMPLE_SECTION_BASIC"
        declarationCode="EXAMPLE_DECLARATION"
        submitLabelCode="CS_COMMON_SUBMIT"
        t={t}
        formatDate={formatCheckPageDate}
        checkNA={defaultCheckNA}
      />
    );
  }

  return (
    <MultiStepCheck
      steps={steps}
      value={value}
      t={t}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
};

export default ExampleCheckPage;
