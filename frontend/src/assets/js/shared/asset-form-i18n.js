/**
 * AppAssetI18n — nhãn form tài sản, tòa nhà, phòng (dùng chung assets / view / update).
 */
(function assetFormI18nScope(window) {
  const SPECIAL_BUILDINGS = {
    GDDN: "menu.venueLectureHall",
    CANTIN: "menu.venueCanteen",
  };

  function t(key, params) {
    const v = window.FmI18n?.t?.(key, params);
    return v != null && v !== key ? v : key;
  }

  function tPlain(key, params) {
    const v = window.FmI18n?.tPlain?.(key, params);
    return v != null && v !== key ? v : t(key, params);
  }

  function buildingDisplayLabel(code) {
    const c = String(code || "").trim().toUpperCase();
    if (!c) return "";
    const spKey = SPECIAL_BUILDINGS[c];
    if (spKey) return t(spKey);
    return t("menu.buildingNamed", { name: c });
  }

  function roomSelectLabel(roomCode, buildingCode) {
    const code = String(roomCode || "").trim();
    if (!code) return "";
    const building = String(buildingCode || "").trim();
    if (!building) return code;
    return `${code} - ${buildingDisplayLabel(building)}`;
  }

  window.AppAssetI18n = {
    t,
    tPlain,
    buildingDisplayLabel,
    roomSelectLabel,
    placeholderCategory: () => tPlain("assets.placeholderSelectCategory"),
    placeholderRoom: () => tPlain("assets.placeholderSelectRoom"),
    placeholderFund: () => tPlain("assets.placeholderSelectFund"),
  };
})(window);
