import {
  Card,
  CardHeader,
  CardSubHeader,
  CardText,
  CitizenInfoLabel,
  Loader,
  SubmitBar,
} from "@nudmcdgnpm/digit-ui-react-components";
import React, { useMemo } from "react";
import localRequiredDocuments from "../config/RequiredDocuments.json";

/**
 * /info — required-documents landing (EST AssignAstRequiredDoc pattern).
 * Prefers step config.requiredDocuments (workbench / Accordion navigation.infoPage),
 * then local RequiredDocuments.json, then TradeLicense.Documents MDMS.
 */
const TradeLicense = ({ t, config, onSelect }) => {
  const stateId = Digit.ULBService.getStateId();

  const hasStepDocuments =
    Array.isArray(config?.requiredDocuments) && config.requiredDocuments.length > 0;

  const { isLoading, data: Documentsob = {} } = Digit.Hooks.tl.useTradeLicenseMDMS(
    stateId,
    "TradeLicense",
    "TLDocuments"
  );

  const documents = useMemo(() => {
    if (hasStepDocuments) {
      return config.requiredDocuments.filter(
        (doc) => doc.active !== false && doc.active !== "false"
      );
    }

    const fromLocalFile = (localRequiredDocuments?.RequiredDocuments || []).filter(
      (doc) => doc.active !== false && doc.active !== "false"
    );
    if (fromLocalFile.length > 0) return fromLocalFile;

    // Legacy MDMS Documents (nested dropdownData) → flat EST-like rows
    const mdmsDocs = Documentsob?.TradeLicense?.Documents || [];
    const flat = [];
    mdmsDocs.forEach((group) => {
      (group?.dropdownData || []).forEach((item, idx) => {
        if (!item?.code) return;
        flat.push({
          order: flat.length + 1,
          code: item.code,
          i18nKey: `TRADELICENSE_${String(item.code).replace(/\./g, "_")}_LABEL`,
          name: item.code,
          active: item.active !== false,
        });
      });
    });
    return flat.filter((doc) => doc.active !== false);
  }, [config, hasStepDocuments, Documentsob]);

  const goNext = () => onSelect(config?.key || "info", {});

  if (isLoading && !hasStepDocuments && !(localRequiredDocuments?.RequiredDocuments || []).length) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <Card>
        <CardHeader>
          {t(config?.sectionHeading || config?.header || "TL_DOC_REQ_SCREEN_HEADER")}
        </CardHeader>

        <div>
          <CardSubHeader>
            {t(config?.documentsHeading || "TL_NEW_APPLICATION_DOCUMENTS_REQUIRED")}
          </CardSubHeader>
          {config?.text || config?.cardText ? (
            <CardText>{t(config.text || config.cardText)}</CardText>
          ) : (
            <CardText>{t("TL_DOC_REQ_SCREEN_TEXT")}</CardText>
          )}

          <div>
            {documents.map((doc, index) => (
              <CardText key={doc.code || doc.i18nKey || index} className="primaryColor">
                {doc.order ?? index + 1}. {t(doc.i18nKey || doc.name || doc.label || "")}
              </CardText>
            ))}
          </div>
        </div>

        <span>
          <SubmitBar
            label={t(config?.nextLabel || "CS_COMMON_NEXT")}
            onSubmit={goNext}
          />
        </span>
      </Card>
      <CitizenInfoLabel
        info={t(config?.infoLabel || "CS_FILE_APPLICATION_INFO_LABEL")}
        text={t(config?.infoText || "TL_DOCUMENT_SIZE_INFO_MSG")}
      />
    </React.Fragment>
  );
};

export default TradeLicense;
