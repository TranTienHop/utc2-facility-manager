/**
 * Trang dashboard/category-update.html
 */
(function categoryUpdatePageScope() {

  const root = document.getElementById("categoryEditFormRoot");
  const codeLabel = document.getElementById("categoryEditCodeLabel");
  const typeLabel = document.getElementById("categoryEditTypeLabel");
  const form = document.getElementById("categoryEditForm");
  const cancelBtn = document.getElementById("categoryEditCancelBtn");
  const raw = sessionStorage.getItem("categoryEditDraft");
  if (!raw || !root) {
    window.location.replace("categories.html");
  } else {
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
    if (!payload) {
      window.location.replace("categories.html");
    } else {
      const configKey = payload.configKey || "default";
      const vk = String(configKey).replace(/-/g, "_");
      const labels = Array.isArray(payload.labels) ? payload.labels : [];
      const values = Array.isArray(payload.values) ? payload.values : [];
      const h = payload.returnHash || "";
      const codeDisplay =
        values[1] != null && String(values[1]).trim() !== ""
          ? String(values[1])
          : values[0] != null
            ? String(values[0])
            : "—";
      if (codeLabel) codeLabel.textContent = codeDisplay;
      if (typeLabel) {
        const tk = `categories.views.${vk}.title`;
        typeLabel.setAttribute("data-i18n", tk);
        typeLabel.textContent = window.FmI18n?.t?.(tk) || payload.pageTitle || "—";
      }

      const goBackToCategories = () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = `categories.html${h}`;
        }
      };

      const n = Math.max(labels.length, values.length, 0);
      root.textContent = "";
      for (let i = 0; i < n; i += 1) {
        const wrap = document.createElement("div");
        wrap.className = "field";
        const lab = document.createElement("label");
        lab.htmlFor = `catEditField_${i}`;
        const hasLabel = labels[i] != null && labels[i] !== "";
        if (hasLabel) {
          lab.setAttribute("data-i18n", `categories.views.${vk}.columns.${i}`);
          lab.textContent = String(labels[i]);
        } else {
          const kFb = "categories.edit.fieldFallback";
          lab.setAttribute("data-i18n", kFb);
          lab.setAttribute("data-i18n-params", JSON.stringify({ n: i + 1 }));
          lab.textContent = window.FmI18n?.t?.(kFb, { n: i + 1 }) || `Trường ${i + 1}`;
        }
        const inp = document.createElement("input");
        inp.type = "text";
        inp.id = `catEditField_${i}`;
        inp.name = `field_${i}`;
        inp.value = values[i] != null ? String(values[i]) : "";
        const labelForReadonly = hasLabel ? String(labels[i]) : "";
        if (
          /^mã\b/i.test(labelForReadonly) ||
          /^code\b/i.test(labelForReadonly) ||
          /^(Số|STT)\b/i.test(labelForReadonly) ||
          /^id$/i.test(labelForReadonly.trim())
        ) {
          inp.readOnly = true;
        }
        wrap.appendChild(lab);
        wrap.appendChild(inp);
        root.appendChild(wrap);
      }
      window.FmI18n?.apply?.(document.querySelector("main.content"));

      window.addEventListener("fm-i18n-applied", () => {
        window.FmI18n?.apply?.(document.querySelector("main.content"));
      });

      cancelBtn?.addEventListener("click", goBackToCategories);
      form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const newData = [];
        for (let i = 0; i < n; i += 1) {
          const el = document.getElementById(`catEditField_${i}`);
          newData.push(el ? el.value.trim() : "");
        }
        const rowId = String(values[0] ?? "");
        const than = {
          code: newData[1] || "",
          name: newData[2] || "",
          type: configKey === "nguon-kinh-phi" ? "FUND_SOURCE" : "ASSET",
        };
        void (async () => {
          try {
            if (rowId && window.CoSoApi?.capNhatDanhMuc) await window.CoSoApi.capNhatDanhMuc(rowId, than);
          } catch (err) {
            console.warn("[Danh mục] Cập nhật API thất bại:", err);
          }
        })();
        try {
          sessionStorage.removeItem("categoryEditDraft");
        } catch (_) {}
        window.alert(window.FmI18n?.t?.("categories.successUpdateAlert") || "Cập nhật danh mục thành công!");
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        window.location.href = `categories.html${h}`;
      });
    }
  }
})();
