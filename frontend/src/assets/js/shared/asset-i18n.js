/**
 * FmAssetName — dịch tên tài sản theo mã danh mục / số thẻ / tên tiếng Việt gốc.
 */
(function assetI18nScope(window) {
  let viNameToCode = null;

  function t(key) {
    const v = window.FmI18n?.t?.(key);
    return v != null && v !== key ? v : null;
  }

  function isAssetCode(code) {
    if (!code || typeof code !== "string") return false;
    const c = code.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]*$/.test(c)) return false;
    return Boolean(t(`assetNames.${c}`));
  }

  function codeFromCardNumber(cardNumber) {
    const card = String(cardNumber || "").trim();
    if (!card) return null;
    const parts = card.split("-").map((p) => p.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const candidate = parts.slice(i).join("_").toUpperCase();
      if (isAssetCode(candidate)) return candidate;
      const single = parts[i].toUpperCase();
      if (isAssetCode(single)) return single;
    }
    return null;
  }

  function codeFromCategory(itemCategory) {
    const cat = String(itemCategory || "").trim().toUpperCase();
    return isAssetCode(cat) ? cat : null;
  }

  function buildViNameMap(bundle) {
    const names = bundle?.assetNames;
    if (!names || typeof names !== "object") return {};
    const map = {};
    Object.keys(names).forEach((code) => {
      const plain = window.FmI18n?.plainText?.(names[code]) || String(names[code] || "").trim();
      if (plain) map[plain] = code;
    });
    return map;
  }

  function ensureViNameMap() {
    if (viNameToCode || !window.FmI18n?.loadBundle) return;
    void window.FmI18n.loadBundle("vi")
      .then((bundle) => {
        viNameToCode = buildViNameMap(bundle);
      })
      .catch(() => {
        viNameToCode = {};
      });
  }

  function resolveCategoryCode(assetName, itemCategory, cardNumber) {
    return (
      codeFromCategory(itemCategory) ||
      codeFromCardNumber(cardNumber) ||
      viNameToCode?.[String(assetName || "").trim()] ||
      null
    );
  }

  function translate(assetName, itemCategory, cardNumber) {
    ensureViNameMap();
    const code = resolveCategoryCode(assetName, itemCategory, cardNumber);
    if (code) {
      const label = t(`assetNames.${code}`);
      if (label) return label;
    }
    return String(assetName || "").trim();
  }

  window.FmAssetName = {
    translate,
    resolveCategoryCode,
  };

  ensureViNameMap();
})(window);
