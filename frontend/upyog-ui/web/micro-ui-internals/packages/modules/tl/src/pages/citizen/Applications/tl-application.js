/**
 * Trade license card on citizen My Applications.
 * Same actions as Estate: view summary, and pay only when payment is pending.
 */
import React from "react";
import {
  Card,
  Row,
  StatusTable,
  SubmitBar,
} from "@nudmcdgnpm/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { convertEpochToDateCitizen } from "../../../utils";
import styles from "../../../styles/TLMyApplications.module.scss";

const ownerLabel = (license) => {
  const detail = license?.tradeLicenseDetail;
  const category = detail?.subOwnerShipCategory || "";
  if (category.includes("INSTITUTION")) {
    return detail?.institution?.name || detail?.institution?.instituionName || "";
  }
  const owners = Array.isArray(detail?.owners) ? [...detail.owners] : [];
  owners.sort(
    (a, b) =>
      (a?.additionalDetails?.ownerSequence ?? 0) -
      (b?.additionalDetails?.ownerSequence ?? 0)
  );
  return owners.map((owner) => owner?.name).filter(Boolean).join(", ");
};

const TLApplicationCard = ({ application }) => {
  const { t } = useTranslation();
  const navigate = Digit.Hooks.useCustomNavigate();
  const { path: modulePath } = Digit.Hooks.useModuleBasePath();
  const license = application || {};
  const pendingPayment = license.status === "PENDINGPAYMENT";
  const applicationDate = convertEpochToDateCitizen(license.applicationDate);

  const handleViewDetails = () => {
    if (!license.applicationNumber || !license.tenantId) return;
    navigate(
      `${modulePath}/tradelicence/application/${license.applicationNumber}/${license.tenantId}`
    );
  };

  const handleMakePayment = () => {
    if (!pendingPayment || !license.applicationNumber) return;
    navigate(
      `/upyog-ui/citizen/payment/collect/${license.businessService || "TL"}/${license.applicationNumber}`,
      { state: { tenantId: license.tenantId } }
    );
  };

  return (
    <Card className={styles["tl-myapps__card"]}>
      <StatusTable>
        <Row
          className="border-none"
          label={t("TL_COMMON_TABLE_COL_APP_NO")}
          text={license.applicationNumber || t("CS_NA")}
        />
        <Row
          className="border-none"
          label={t("TL_COMMON_TABLE_COL_LICENSE_NO")}
          text={license.licenseNumber || t("CS_NA")}
        />
        <Row
          className="border-none"
          label={t("TL_COMMON_TABLE_COL_TRD_NAME")}
          text={license.tradeName || t("CS_NA")}
        />
        <Row
          className="border-none"
          label={t("TL_COMMON_TABLE_COL_OWN_NAME")}
          text={ownerLabel(license) || t("CS_NA")}
        />
        <Row
          className="border-none"
          label={t("TL_COMMON_TABLE_COL_STATUS")}
          text={license.status ? t(`WF_NEWTL_${license.status}`) : t("CS_NA")}
        />
        <Row
          className="border-none"
          label={t("TL_COMMON_TABLE_COL_APP_DATE")}
          text={applicationDate || t("CS_NA")}
        />
      </StatusTable>
      <div className={styles["tl-myapps__actions"]}>
        <SubmitBar
          label={t("TL_VIEW_DETAILS")}
          onSubmit={handleViewDetails}
          className={styles["tl-myapps__action-btn"]}
        />
        {pendingPayment ? (
          <SubmitBar
            label={t("COMMON_MAKE_PAYMENT")}
            onSubmit={handleMakePayment}
            className={styles["tl-myapps__action-btn"]}
          />
        ) : null}
      </div>
    </Card>
  );
};

export default TLApplicationCard;
