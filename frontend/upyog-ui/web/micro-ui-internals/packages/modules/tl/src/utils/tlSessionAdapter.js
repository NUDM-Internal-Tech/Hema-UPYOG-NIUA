/**
 * tlSessionAdapter.js
 *
 * Bridges DynamicForm flat session (newApplication.Licenses[0]) into the nested
 * shape expected by legacy TL CheckPage + convertToTrade, without rewriting those.
 *
 * Dynamic form remains the source of truth under `newApplication`; nested keys are
 * derived views for check / acknowledgement.
 */

const asCodeObj = (value, i18nPrefix) => {
  if (value == null || value === "") return undefined;
  if (typeof value === "object" && value.code != null) return value;
  const code = String(value);
  return { code, i18nKey: i18nPrefix ? `${i18nPrefix}_${code}` : code };
};

const pickFirstArrayItem = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
};

const isSameAsPropertyOwnerYes = (value) =>
  value === "YES" || value === true || value === "true";

/** User service rejects create when name or mobile is blank (InvalidUserCreateException). */
const ownerDisplayName = (owner) => {
  const name = owner?.name;
  if (name && typeof name === "object") return String(name.name || name.code || "").trim();
  return String(name || "").trim();
};

const ownerMobile = (owner) =>
  String(owner?.mobilenumber || owner?.mobileNumber || "").trim();

const isFilledOwner = (owner) => Boolean(ownerDisplayName(owner) && ownerMobile(owner));

const normalizeOwnerRow = (owner) => ({
  ...owner,
  name: ownerDisplayName(owner),
  mobilenumber: ownerMobile(owner),
  gender: asCodeObj(owner?.gender),
  relationship: asCodeObj(owner?.relationship),
});

/** Accordion file fields are { filestoreId, fileName } or a bare id string. */
const asUploadDoc = (file, documentType) => {
  if (file == null || file === "") return undefined;
  if (typeof file === "string") {
    return { fileStoreId: file, filestoreId: file, documentType, fileName: documentType };
  }
  const fileStoreId = file.fileStoreId || file.filestoreId || file.documentuuid || "";
  if (!fileStoreId) return undefined;
  return {
    ...file,
    fileStoreId,
    filestoreId: fileStoreId,
    documentType,
    fileName: file.fileName || file.name || documentType,
  };
};

/**
 * Build ownershipCategory from a PT property when citizen picks same-as-property-owner.
 * Mirrors SelectOwnerShipDetails auto-select from cpt.details.ownershipCategory.
 */
const ownershipFromProperty = (property) => {
  const raw = property?.ownershipCategory;
  if (!raw) {
    return {
      code: "INDIVIDUAL.SINGLEOWNER",
      i18nKey: "COMMON_MASTERS_OWNERSHIPCATEGORY_INDIVIDUAL_SINGLEOWNER",
      isSameAsPropertyOwner: true,
    };
  }
  const rawStr = String(raw);
  if (rawStr.includes("INSTITUTIONAL")) {
    const instType = property?.institution?.type;
    const code = instType ? `${rawStr}.${instType}` : rawStr;
    return {
      code,
      i18nKey: `COMMON_MASTERS_OWNERSHIPCATEGORY_${code.replace(/\./g, "_")}`,
      isSameAsPropertyOwner: true,
    };
  }
  return {
    code: rawStr,
    i18nKey: `COMMON_MASTERS_OWNERSHIPCATEGORY_${rawStr.replace(/\./g, "_")}`,
    isSameAsPropertyOwner: true,
  };
};

/**
 * Map PT owners → TL CheckPage / convertToTrade owner shape (mobilenumber lowercase).
 */
const ownersFromProperty = (property, ownershipCategory) => {
  const code = ownershipCategory?.code || "";
  const src = Array.isArray(property?.owners) ? [...property.owners] : [];
  if (src.some((o) => o?.additionalDetails?.ownerSequence != null)) {
    src.sort(
      (a, b) =>
        (a?.additionalDetails?.ownerSequence ?? 0) -
        (b?.additionalDetails?.ownerSequence ?? 0)
    );
  }

  if (code.includes("INSTITUTIONAL")) {
    const first = src[0] || {};
    return [
      {
        name: property?.institution?.nameOfAuthorizedPerson || first.name,
        designation: property?.institution?.designation,
        mobilenumber: first.mobileNumber,
        altContactNumber: first.altContactNumber,
        institutionName: property?.institution?.name,
        fatherOrHusbandName: "",
        relationship: undefined,
        emailId: first.emailId,
        permanentAddress: first.permanentAddress || first.correspondenceAddress,
        gender: undefined,
        subOwnerShipCategory: ownershipCategory,
      },
    ];
  }

  return src.map((ow) => ({
    name: ow?.name,
    mobilenumber: ow?.mobileNumber,
    fatherOrHusbandName: ow?.fatherOrHusbandName,
    relationship: asCodeObj(ow?.relationship, "COMMON_RELATION"),
    gender: asCodeObj(ow?.gender, "TL_GENDER"),
    emailId: ow?.emailId,
    permanentAddress: ow?.permanentAddress || ow?.correspondenceAddress,
  }));
};

/** Ensure trade-unit / accessory nested dropdown codes survive flatten + display. */
const normalizeUnitRow = (row = {}) => ({
  ...row,
  tradecategory:
    typeof row.tradecategory === "object"
      ? row.tradecategory
      : asCodeObj(row.tradecategory),
  tradetype:
    typeof row.tradetype === "object" ? row.tradetype : asCodeObj(row.tradetype),
  tradesubtype:
    typeof row.tradesubtype === "object"
      ? row.tradesubtype
      : asCodeObj(row.tradesubtype),
  accessory:
    typeof row.accessory === "object" ? row.accessory : asCodeObj(row.accessory),
});

/**
 * Extract flat form row from wizard session.
 * @param {object} session
 * @returns {object}
 */
export const getTlDynamicFlatData = (session = {}) => {
  const payloadKey = "Licenses";
  const step =
    session?.newApplication ||
    session?.info ||
    session?.structure ||
    session?.accordionForm;
  const saved = step?.[payloadKey] || session?.newApplication?.[payloadKey];
  if (Array.isArray(saved)) return saved[0] || {};
  return saved || {};
};

/**
 * Map flat DynamicForm values → nested TL_CREATE_TRADE keys for CheckPage.
 * Preserves dynamic step data + routeConfigs for edit round-trip.
 *
 * @param {object} session - Wizard session after mergeSessionStepWithRouteConfig
 * @returns {object}
 */
export const mapDynamicTlToCheckSession = (session = {}) => {
  const flat = getTlDynamicFlatData(session);
  if (!flat || Object.keys(flat).length === 0) return session;

  const property = flat.__property || null;
  const propertyId = flat.propertyId || property?.propertyId || "";
  const sameAsProperty = isSameAsPropertyOwnerYes(flat.isSameAsPropertyOwner);

  const structureType = asCodeObj(flat.structureType, "COMMON");
  const isAccessories = asCodeObj(
    flat.isAccessories === "ACCESSORY"
      ? "ACCESSORY"
      : flat.isAccessories === "NONACCESSORY"
        ? "NONACCESSORY"
        : flat.isAccessories,
    "TL"
  );

  // Soft-normalize accessories yes/no for convertToTrade (looks for YES in i18nKey).
  if (isAccessories) {
    if (String(flat.isAccessories).toUpperCase() === "ACCESSORY") {
      isAccessories.i18nKey = "TL_COMMON_YES";
      isAccessories.code = "ACCESSORY";
    } else if (String(flat.isAccessories).toUpperCase() === "NONACCESSORY") {
      isAccessories.i18nKey = "TL_COMMON_NO";
      isAccessories.code = "NONACCESSORY";
    }
  }

  let ownershipCategory =
    typeof flat.ownershipCategory === "object"
      ? flat.ownershipCategory
      : asCodeObj(flat.ownershipCategory);

  // Drop blank placeholder rows. The owners fieldArray is seeded with an empty
  // row while same-as-property-owner is hidden, and that empty row was sent to
  // user create (name/mobile missing → InvalidUserCreateException).
  let ownersList = pickFirstArrayItem(flat.owners)
    .map(normalizeOwnerRow)
    .filter(isFilledOwner);

  // When owners are still flat single fields (fieldArray not yet rendered), synthesize one.
  if (
    ownersList.length === 0 &&
    (flat.name || flat.mobilenumber || flat.mobileNumber || flat.fatherOrHusbandName)
  ) {
    const synthesized = normalizeOwnerRow({
      name: flat.name,
      gender: flat.gender,
      mobilenumber: flat.mobilenumber || flat.mobileNumber,
      fatherOrHusbandName: flat.fatherOrHusbandName,
      relationship: flat.relationship,
      emailId: flat.emailId,
      permanentAddress: flat.permanentAddress,
      isCorrespondenceAddress: flat.isCorrespondenceAddress,
    });
    if (isFilledOwner(synthesized)) ownersList.push(synthesized);
  }

  // Same-as-property-owner hides ownership + owners fields — copy from PT like legacy ATT.
  if (sameAsProperty && property) {
    if (!ownershipCategory?.code) {
      ownershipCategory = ownershipFromProperty(property);
    } else {
      ownershipCategory = {
        ...ownershipCategory,
        isSameAsPropertyOwner: true,
      };
    }
    if (ownersList.length === 0) {
      ownersList = ownersFromProperty(property, ownershipCategory)
        .map(normalizeOwnerRow)
        .filter(isFilledOwner);
    }
  }

  const units = pickFirstArrayItem(flat.tradeUnits || flat.units).map(normalizeUnitRow);
  if (
    units.length === 0 &&
    (flat.tradecategory || flat.tradetype || flat.tradesubtype)
  ) {
    units.push(
      normalizeUnitRow({
        tradecategory: flat.tradecategory,
        tradetype: flat.tradetype,
        tradesubtype: flat.tradesubtype,
        unit: flat.unit,
        uom: flat.uom,
      })
    );
  }

  const accessories = pickFirstArrayItem(flat.accessories).map(normalizeUnitRow);
  if (
    accessories.length === 0 &&
    flat.isAccessories === "ACCESSORY" &&
    (flat.accessory || flat.accessorycount)
  ) {
    accessories.push(
      normalizeUnitRow({
        accessory: flat.accessory,
        accessorycount: flat.accessorycount,
        unit: flat.unit,
        uom: flat.uom,
      })
    );
  }

  const cityCode =
    (typeof flat.city === "object" ? flat.city?.code : flat.city) ||
    property?.tenantId ||
    Digit.ULBService.getCurrentTenantId();

  const cityValue =
    typeof flat.city === "object" && flat.city?.code
      ? flat.city
      : { code: cityCode, name: cityCode };

  const localityValue =
    typeof flat.locality === "object" && flat.locality
      ? flat.locality
      : flat.locality
        ? { code: flat.locality, i18nkey: flat.locality }
        : property?.address?.locality;

  const permanentAddress =
    flat.permanentAddress ||
    ownersList[0]?.permanentAddress ||
    (sameAsProperty
      ? property?.owners?.[0]?.permanentAddress ||
        property?.owners?.[0]?.correspondenceAddress
      : undefined);

  const nested = {
    tenantId: cityCode,
    TradeDetails: {
      TradeName: flat.tradeName,
      StructureType: structureType,
      BuildingType: asCodeObj(flat.buildingType),
      VehicleType: asCodeObj(flat.vehicleType),
      CommencementDate: flat.commencementDate,
      TradeGSTNumber: flat.tradeGSTNumber,
      OperationalSqFtArea: flat.operationalSqFtArea,
      NumberOfEmployees: flat.numberOfEmployees,
      units,
      isAccessories,
      accessories,
    },
    financialYear:
      (typeof flat.financialYear === "object"
        ? flat.financialYear?.code || flat.financialYear?.name
        : flat.financialYear) || undefined,
    // Citizen accordion create is PERMANENT-only (matches billing slabs).
    licenseType: "PERMANENT",
    address: {
      pincode: flat.pincode || property?.address?.pincode,
      city: cityValue,
      locality: localityValue,
      street: flat.street || property?.address?.street,
      doorNo: flat.doorNo || property?.address?.doorNo,
      landmark: flat.landmark || property?.address?.landmark,
    },
    ownershipCategory: ownershipCategory || {},
    owners: {
      owners: ownersList,
      permanentAddress,
      isCorrespondenceAddress: flat.isCorrespondenceAddress,
      documents: {
        ProofOfIdentity: asUploadDoc(flat.proofOfIdentity, "OWNERIDPROOF"),
        ProofOfOwnership: asUploadDoc(flat.proofOfOwnership, "OWNERSHIPPROOF"),
        OwnerPhotoProof: asUploadDoc(flat.ownerPhotoProof, "OWNERPHOTO"),
      },
    },
    cpt: propertyId
      ? {
          details: property || {
            propertyId,
            tenantId: cityCode,
            address: {
              pincode: flat.pincode,
              city: cityCode,
              locality: localityValue,
              street: flat.street,
              doorNo: flat.doorNo,
              landmark: flat.landmark,
            },
          },
        }
      : session.cpt,
    cptId: propertyId ? { id: propertyId } : session.cptId,
    knowyourproperty: propertyId
      ? { KnowProperty: { code: "YES", i18nKey: "TL_COMMON_YES" } }
      : session.knowyourproperty,
    __dynamicForm: true,
  };

  if (property) {
    try {
      sessionStorage.setItem("KnowProperty", "TL_COMMON_YES");
      sessionStorage.setItem("cpt", JSON.stringify(property));
      if (Digit?.SessionStorage?.set) {
        Digit.SessionStorage.set("cpt", property);
      }
    } catch (e) {
      /* ignore */
    }
  }

  if (flat.isSameAsPropertyOwner != null) {
    try {
      sessionStorage.setItem(
        "isSameAsPropertyOwner",
        String(sameAsProperty)
      );
    } catch (e) {
      /* ignore */
    }
  }

  const fyCode =
    typeof flat.financialYear === "object"
      ? flat.financialYear?.code || flat.financialYear?.name
      : flat.financialYear;
  if (fyCode) {
    try {
      sessionStorage.setItem("CurrentFinancialYear", String(fyCode));
    } catch (e) {
      /* ignore */
    }
  }

  return {
    ...session,
    ...nested,
  };
};
