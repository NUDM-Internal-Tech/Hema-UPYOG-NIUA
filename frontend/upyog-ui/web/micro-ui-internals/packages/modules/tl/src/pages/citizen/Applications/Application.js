/**
 * Citizen My Applications — same layout as Estate My Applications.
 * Page load searches by tenant only. The trade-license service then limits
 * the result to the logged-in citizen. Application number, license number,
 * and status are filtered on the client.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  Header,
  Loader,
  TextInput,
  Dropdown,
  SubmitBar,
  CardLabel,
  Card,
  KeyNote,
  sortByOrder,
} from "@nudmcdgnpm/digit-ui-react-components";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TLApplicationCard from "./tl-application";
import styles from "../../../styles/TLMyApplications.module.scss";

const PAGE_SIZE = 50;

const STATUS_CODES = [
  "INITIATED",
  "APPLIED",
  "FIELDINSPECTION",
  "PENDINGAPPROVAL",
  "PENDINGPAYMENT",
  "CITIZENACTIONREQUIRED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
];

const FILTERS = [
  {
    order: 1,
    key: "TL_HOME_SEARCH_RESULTS_APP_NO_LABEL",
    name: "applicationNumber",
    type: "text",
    placeholder: "TL_HOME_SEARCH_RESULTS_APP_NO_LABEL",
  },
  {
    order: 2,
    key: "TL_COMMON_TABLE_COL_STATUS",
    name: "status",
    type: "dropdown",
    placeholder: "TL_HOME_SEARCH_RESULTS_APP_STATUS_LABEL",
  },
];

const TLBills = () => {
  const { t } = useTranslation();
  const { mobileNumber, tenantId: userTenantId } = Digit.UserService.getUser()?.info || {};
  const tenantId =
    Digit.ULBService.getCitizenCurrentTenant(true) ||
    Digit.ULBService.getCurrentTenantId() ||
    userTenantId;
  const { isLoading, data } = Digit.Hooks.tl.useFetchBill({
    params: {
      businessService: "TL",
      tenantId,
      mobileNumber,
    },
    config: { enabled: true },
  });

  if (isLoading) return <Loader />;

  return (
    <>
      <Header>{t("TL_MY_APPLICATIONS_HEADER")}</Header>
      {(data || []).map((application, index) => (
        <div key={application?.raw?.applicationNumber || index}>
          <Card>
            {Object.keys(application)
              .filter((key) => key !== "raw" && application[key] !== null)
              .map((item) => (
                <KeyNote key={item} keyValue={t(item)} note={t(application[item])} />
              ))}
            <Link
              to={`/upyog-ui/citizen/tl/tradelicence/application/${application?.raw?.applicationNumber}/${application.raw?.tenantId}`}
            >
              <SubmitBar
                label={t(
                  application?.raw?.status !== "PENDINGPAYMENT"
                    ? "TL_VIEW_DETAILS"
                    : "TL_VIEW_DETAILS_PAY"
                )}
              />
            </Link>
          </Card>
        </div>
      ))}
    </>
  );
};

const TLMyApplicationsList = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { tenantId: userTenantId } = Digit.UserService.getUser()?.info || {};
  const tenantId =
    Digit.ULBService.getCitizenCurrentTenant(true) ||
    Digit.ULBService.getCurrentTenantId() ||
    userTenantId;

  const filters = useMemo(() => sortByOrder(FILTERS), []);
  const numberFilter = filters.find((item) => item.name === "applicationNumber");
  const statusFilter = filters.find((item) => item.name === "status");

  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState({});

  const pathOffset = useMemo(() => {
    const segment = location.pathname.split("/").pop();
    const parsed = parseInt(segment, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [location.pathname]);

  const apiFilters = useMemo(
    () => ({ tenantId, offset: 0, limit: 100 }),
    [tenantId]
  );

  const { isLoading, error, data } = Digit.Hooks.tl.useTradeLicenseSearch(
    { tenantId, filters: apiFilters },
    { enabled: Boolean(tenantId), structuralSharing: false }
  );

  const statusOptions = useMemo(
    () =>
      STATUS_CODES.map((code) => ({
        code,
        name: t(`WF_NEWTL_${code}`),
      })),
    [t]
  );

  const applications = useMemo(() => {
    const list = data?.Licenses || data?.licenses || [];
    const numberQuery = String(appliedFilters.applicationNumber || "")
      .trim()
      .toUpperCase();
    const statusQuery = String(appliedFilters.status || "").toUpperCase();
    let rows = Array.isArray(list) ? [...list] : [];

    if (numberQuery) {
      rows = rows.filter((item) => {
        const applicationNumber = String(item?.applicationNumber || "").toUpperCase();
        const licenseNumber = String(item?.licenseNumber || "").toUpperCase();
        return (
          applicationNumber.includes(numberQuery) || licenseNumber.includes(numberQuery)
        );
      });
    }

    if (!statusQuery) return rows;
    return rows.filter((item) => String(item?.status || "").toUpperCase() === statusQuery);
  }, [data, appliedFilters.applicationNumber, appliedFilters.status]);

  const visibleApplications = useMemo(
    () => applications.slice(pathOffset, pathOffset + PAGE_SIZE),
    [applications, pathOffset]
  );

  const navigate = Digit.Hooks.useCustomNavigate();

  const resetPage = () => {
    if (pathOffset) navigate("/upyog-ui/citizen/tl/tradelicence/my-application");
  };

  const handleSearch = useCallback(() => {
    const trimmed = searchTerm.trim();
    const statusCode = status?.code || undefined;
    resetPage();
    if (!trimmed && !statusCode) {
      setAppliedFilters({});
      return;
    }
    setAppliedFilters({
      applicationNumber: trimmed || undefined,
      status: statusCode,
    });
  }, [searchTerm, status, pathOffset]);

  const handleClear = useCallback(() => {
    setSearchTerm("");
    setStatus(null);
    setAppliedFilters({});
    resetPage();
  }, [pathOffset]);

  if (isLoading && !data) return <Loader />;

  const totalCount = applications.length;
  const nextOffset = pathOffset + PAGE_SIZE;
  const hasMore = nextOffset < totalCount;

  return (
    <>
      <Header>{`${t("TL_MY_APPLICATIONS_HEADER")} (${totalCount})`}</Header>
      <Card>
        <div className={styles["tl-myapps__container"]}>
          <div className={styles["tl-myapps__search-row"]}>
            {numberFilter ? (
              <div className={styles["tl-myapps__field-col"]}>
                <div className={styles["tl-myapps__field-inner"]}>
                  <CardLabel>{t(numberFilter.key)}</CardLabel>
                  <TextInput
                    placeholder={t(numberFilter.placeholder)}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className={styles["tl-myapps__text-input"]}
                  />
                </div>
              </div>
            ) : null}
            {statusFilter ? (
              <div className={styles["tl-myapps__field-col"]}>
                <div className={styles["tl-myapps__field-inner"]}>
                  <CardLabel>{t(statusFilter.key)}</CardLabel>
                  <Dropdown
                    className={`form-field ${styles["tl-myapps__dropdown"]}`}
                    selected={status}
                    select={setStatus}
                    option={statusOptions}
                    placeholder={t(statusFilter.placeholder)}
                    optionKey="name"
                    t={t}
                  />
                </div>
              </div>
            ) : null}
            <div>
              <div className={styles["tl-myapps__search-btn-wrap"]}>
                <SubmitBar label={t("ES_COMMON_SEARCH")} onSubmit={handleSearch} />
                <p
                  className={`link ${styles["tl-myapps__clear-link"]}`}
                  onClick={handleClear}
                >
                  {t("ES_COMMON_CLEAR_ALL")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <p className={styles["tl-myapps__msg"]}>{t("CS_SOMETHING_WENT_WRONG")}</p>
      ) : null}

      {!error &&
        visibleApplications.map((license, index) => (
          <div key={`${license.applicationNumber || license.id || "row"}-${index}`}>
            <TLApplicationCard application={license} />
          </div>
        ))}

      {!error && !isLoading && totalCount === 0 ? (
        <p className={styles["tl-myapps__msg"]}>{t("PT_NO_APPLICATION_FOUND_MSG")}</p>
      ) : null}

      {hasMore ? (
        <p className={styles["tl-myapps__msg"]}>
          <span className="link">
            <Link to={`/upyog-ui/citizen/tl/tradelicence/my-application/${nextOffset}`}>
              {t("PT_LOAD_MORE_MSG")}
            </Link>
          </span>
        </p>
      ) : null}
    </>
  );
};

const TLMyApplications = ({ view }) => {
  if (view === "bills") return <TLBills />;
  return <TLMyApplicationsList />;
};

export default TLMyApplications;
