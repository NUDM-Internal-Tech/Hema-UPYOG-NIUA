import React, { useMemo } from "react";
import { ArrowRightInbox } from "./svgindex";
import { Link } from "react-router-dom";

const CARD_ACCENTS = [
  "#0d7377",
  "#b8860b",
  "#2d6a4f",
  "#14919b",
  "#c45c26",
  "#6b3fa0",
  "#1e5f8a",
  "#8b4513",
];

const KNOWN_MODULE_STYLES = [
  { match: /property\s*tax|\bpt\b/i, code: "PT", color: "#0d7377" },
  { match: /miscellaneous|mcollect|m.?collect/i, code: "MC", color: "#b8860b" },
  { match: /trade\s*licen[cs]e|\btl\b/i, code: "TL", color: "#2d6a4f" },
  { match: /water\s*&\s*sewerage|water and sewerage|^water$/i, code: "WS", color: "#14919b" },
  { match: /sewerage/i, code: "SW", color: "#0f766e" },
  { match: /grievance|\bpgr\b|complaint/i, code: "PGR", color: "#c45c26" },
  { match: /birth|death|\bbnd\b/i, code: "BND", color: "#6b3fa0" },
  { match: /faecal|fsm|desludg|vehicle\s*log/i, code: "FSM", color: "#1e5f8a" },
  { match: /building|obps|bpa/i, code: "BPA", color: "#7c3aed" },
  { match: /\bnoc\b|objection/i, code: "NOC", color: "#b45309" },
  { match: /hrms|hr management/i, code: "HR", color: "#0369a1" },
  { match: /pet\s*reg/i, code: "PTR", color: "#be185d" },
  { match: /asset/i, code: "AST", color: "#0f766e" },
  { match: /community\s*hall|\bchb\b|venue/i, code: "CHB", color: "#a16207" },
  { match: /advertisement|\bads\b/i, code: "ADS", color: "#6b3fa0" },
  { match: /e.?waste/i, code: "EW", color: "#9a3412" },
  { match: /vendor/i, code: "VM", color: "#115e59" },
  { match: /receipt/i, code: "RC", color: "#1d4ed8" },
  { match: /bill\s*amend|bill\s*genie|\bbill\b/i, code: "BL", color: "#c2410c" },
  { match: /dashboard|dss/i, code: "DSS", color: "#4338ca" },
  { match: /survey|engagement/i, code: "ENG", color: "#0e7490" },
  { match: /water\s*tanker|\bwt\b/i, code: "WT", color: "#0284c7" },
  { match: /mobile\s*toilet|\bmt\b/i, code: "MT", color: "#7c2d12" },
  { match: /tree\s*prun|\btp\b/i, code: "TP", color: "#166534" },
  { match: /\bgis\b/i, code: "GIS", color: "#475569" },
  { match: /\btqm\b|quality/i, code: "TQM", color: "#6d28d9" },
  { match: /no\s*dues|\bndc\b/i, code: "NDC", color: "#9f1239" },
];

const extractText = (value) => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (React.isValidElement(value)) return extractText(value.props?.children);
  return "";
};

const findKnownModuleStyle = (moduleName) => {
  const text = extractText(moduleName).trim();
  if (!text) return null;
  return KNOWN_MODULE_STYLES.find(({ match }) => match.test(text)) || null;
};

const getModuleAbbreviation = (moduleCode, moduleName) => {
  if (moduleCode) return String(moduleCode).replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();

  const known = findKnownModuleStyle(moduleName);
  if (known) return known.code;

  const text = extractText(moduleName).trim();
  if (!text) return "MD";

  const words = text.replace(/[^a-zA-Z0-9\s&]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const getAccentColor = (moduleCode, moduleName, abbreviation) => {
  const known = findKnownModuleStyle(moduleName);
  if (known?.color) return known.color;

  const text = String(moduleCode || extractText(moduleName) || abbreviation || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return CARD_ACCENTS[Math.abs(hash) % CARD_ACCENTS.length];
};

const formatCount = (count) => {
  if (count === 0) return "0";
  if (count === undefined || count === null || count === "") return "-";
  return count;
};

const EmployeeModuleCard = ({
  Icon,
  moduleName,
  moduleCode,
  kpis = [],
  links = [],
  isCitizen = false,
  className,
  styles,
  FsmHideCount,
}) => {
  const abbreviation = useMemo(
    () => getModuleAbbreviation(moduleCode, moduleName),
    [moduleCode, moduleName]
  );
  const accentColor = useMemo(
    () => getAccentColor(moduleCode, moduleName, abbreviation),
    [moduleCode, moduleName, abbreviation]
  );

  const cardClassName = ["employeeCard", "card-home", "customEmployeeCard", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClassName}
      style={{ "--employee-card-accent": accentColor, ...(styles || {}) }}
    >
      <div className="employeeCustomCard">
        <div className="employee-card-header">
          <div className="employee-card-title-row">
            <span className="employee-card-abbr" aria-hidden="true">
              {abbreviation}
            </span>
            <div>
              <div>
            <h3 className="employee-card-title text-employee-card">{moduleName}</h3>
            </div>
            <div>
            {kpis.length > 0 && (
            <div className={`employee-card-kpis flex-fit${isCitizen ? " is-citizen" : ""}`}>
              {kpis.map(({ count, label, link }, index) => {
                const kpiContent = (
                  <>
                    <span className="employee-card-kpi-count">{formatCount(count)}</span>
                    <span className="employee-card-kpi-label employeeTotalLink">{label}</span>
                  </>
                );

                return (
                  <div className="employee-card-kpi card-count" key={index}>
                    {link ? (
                      <Link to={link} className="employee-card-kpi-link">
                        {kpiContent}
                      </Link>
                    ) : (
                      <div className="employee-card-kpi-link">{kpiContent}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )} 
            </div>
            </div>
          </div>

          {/* {kpis.length > 0 && (
            <div className={`employee-card-kpis flex-fit${isCitizen ? " is-citizen" : ""}`}>
              {kpis.map(({ count, label, link }, index) => {
                const kpiContent = (
                  <>
                    <span className="employee-card-kpi-count">{formatCount(count)}</span>
                    <span className="employee-card-kpi-label employeeTotalLink">{label}</span>
                  </>
                );

                return (
                  <div className="employee-card-kpi card-count" key={index}>
                    {link ? (
                      <Link to={link} className="employee-card-kpi-link">
                        {kpiContent}
                      </Link>
                    ) : (
                      <div className="employee-card-kpi-link">{kpiContent}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )} */}
        </div>

        <div className="employee-card-banner employee-card-actions">
          <div className="links-wrapper body">
            {links.map(({ label, link }, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="employee-card-link-sep" aria-hidden="true">|</span>}
                <span className="link">
                  {link ? <Link to={link}>{label}</Link> : <span>{label}</span>}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {/* Keep Icon prop accepted for backwards compatibility with module cards */}
      {Icon ? <span className="employee-card-icon-legacy" hidden>{Icon}</span> : null}
    </div>
  );
};

const ModuleCardFullWidth = ({
  moduleName,
  links = [],
  isCitizen = false,
  className,
  styles,
  headerStyle,
  subHeader,
  subHeaderLink,
}) => {
  return (
    <div
      className={className ? className : "employeeCard card-home customEmployeeCard home-action-cards"}
      style={styles ? styles : {}}
    >
      <div className="complaint-links-container" style={{ padding: "10px" }}>
        <div className="header" style={isCitizen ? { padding: "0px" } : headerStyle}>
          <span className="text removeHeight">{moduleName}</span>
          <span className="link">
            <a href={subHeaderLink}>
              <span className="inbox-total" style={{ display: "flex", alignItems: "center", color: "#a82227", fontWeight: "bold" }}>
                {subHeader || "-"}
                <span style={{ marginLeft: "10px" }}>
                  <ArrowRightInbox />
                </span>
              </span>
            </a>
          </span>
        </div>
        <div className="body" style={{ margin: "0px", padding: "0px" }}>
          <div className="links-wrapper" style={{ width: "100%", display: "flex", flexWrap: "wrap" }}>
            {links.map(({ count, label, link }, index) => (
              <span className="link full-employee-card-link" key={index}>
                {link ? (
                  link?.includes("upyog-ui/") ? (
                    <Link to={link}>{label}</Link>
                  ) : (
                    <a href={link}>{label}</a>
                  )
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { EmployeeModuleCard, ModuleCardFullWidth };
