/**
 * Trang dashboard/categories.html
 */
(function categoriesPageScope() {
  const { setupTableControls } = window.AppTableControls || {};
  const pageTitle = document.querySelector(".page-title");
  const listTab = document.getElementById("categoryTabList");
  const addTab = document.getElementById("categoryTabAdd");
  const extraTab = document.getElementById("categoryTabExtra");
  const listSection = document.getElementById("categoryListSection");
  const addSection = document.getElementById("categoryAddSection");
  const categoryForm = document.getElementById("categoryForm");
  const categoryTableHeadRow = document.getElementById("categoryTableHeadRow");
  const categoryTableBody = document.getElementById("categoryTableBody");
  const categoryNameLabel = document.querySelector('label[for="categoryNameInput"]');
  const categoryCodeLabel = document.querySelector('label[for="categoryCodeInput"]');
  const categoryNameInput = document.getElementById("categoryNameInput");
  const categoryCodeInput = document.getElementById("categoryCodeInput");
  const categoryCodeSelect = document.getElementById("categoryCodeSelect");
  const categoryNameError = document.getElementById("categoryNameError");
  const categoryResetBtn = document.getElementById("categoryResetBtn");
  const categoryMenuLinks = Array.from(document.querySelectorAll('.nav-submenu a[href*="categories.html"]'));
  let activeCategoryConfigKey = "default";
  let activeCategoryTab = "list";
  let refreshCategoryTable = () => {};
  /** Dữ liệu gốc từ API — dùng lại khi đổi ngôn ngữ. */
  let cachedCategoryList = [];
  let cachedCategoryConfigKey = "default";

  const translateCategoryDisplayName = (code, name, configKey) => {
    const c = String(code || "").trim().toUpperCase();
    const nameRaw = String(name || "").trim();
    if (c) {
      const prefix = configKey === "nguon-kinh-phi" ? "fundSourceNames" : "assetNames";
      const bundleKey = `${prefix}.${c}`;
      const fromKey = window.FmI18n?.tPlain?.(bundleKey);
      if (fromKey && fromKey !== bundleKey) return fromKey;
    }
    if (configKey !== "nguon-kinh-phi" && window.FmAssetName?.translate) {
      const fromAsset = window.FmAssetName.translate(nameRaw, c, null);
      if (fromAsset) return fromAsset;
    }
    return nameRaw;
  };

  const ensureI18nReady = async () => {
    if (!window.FmI18n?.loadBundle || !window.FmI18n?.getLocale) return;
    try {
      await window.FmI18n.loadBundle(window.FmI18n.getLocale());
    } catch (_) {
      /* ignore */
    }
  };

  const categoryConfigs = {
    default: {
      title: "Quản lý danh mục tài sản",
      listTabText: "Tất cả danh mục",
      addTabText: "Thêm danh mục",
      extraTabText: "",
      columns: ["ID", "Mã danh mục", "Tên danh mục", "Chức năng"],
      nameLabel: "Tên danh mục",
      codeLabel: "Mã danh mục",
      namePlaceholder: "Nhập tên danh mục",
      codePlaceholder: "Ví dụ: MM-TB",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [],
    },
    "nguon-kinh-phi": {
      title: "Quản lý nguồn kinh phí",
      listTabText: "Nguồn kinh phí",
      addTabText: "Thêm nguồn kinh phí",
      extraTabText: "",
      columns: ["ID", "Mã NKP", "Tên nguồn kinh phí", "Tổng ngân sách", "Tổng chi", "Tổng thanh lý", "Còn lại", "Chức năng"],
      nameLabel: "Tên nguồn kinh phí",
      codeLabel: "Mã nguồn kinh phí",
      namePlaceholder: "Vui lòng nhập tên nguồn kinh phí",
      codePlaceholder: "Vui lòng nhập mã nguồn kinh phí",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [],
    },
  };

  const mapDanhMucThanhHang = (list, configKey) => {
    const sorted = [...(Array.isArray(list) ? list : [])].sort((a, b) => {
      const idA = Number(a?.id);
      const idB = Number(b?.id);
      if (Number.isFinite(idA) && Number.isFinite(idB)) return idA - idB;
      return String(a?.id ?? "").localeCompare(String(b?.id ?? ""), undefined, { numeric: true });
    });
    const rows = sorted.map((c) => {
      const id = String(c.id != null ? c.id : "");
      const code = String(c.code || c.categoryCode || "");
      const nameRaw = String(c.name || c.categoryName || "");
      const name = translateCategoryDisplayName(code, nameRaw, configKey);
      if (configKey === "nguon-kinh-phi") {
        return [id, code, name, "—", "—", "—", "—", "Sửa/Xóa"];
      }
      return [id, code, name, "Sửa/Xóa"];
    });
    return rows;
  };

  const taiDanhMucTuApi = async (type, configKey = "default") => {
    const api = window.FmApi || window.CoSoApi;
    const cfg = categoryConfigs[configKey] || categoryConfigs.default;
    if (!api || typeof api.layDanhSachDanhMuc !== "function") return false;
    try {
      const thamSo = type ? { type } : {};
      const list = await api.layDanhSachDanhMuc(thamSo);
      cachedCategoryList = Array.isArray(list) ? list : [];
      cachedCategoryConfigKey = configKey;
      cfg.rows = mapDanhMucThanhHang(cachedCategoryList, configKey);
      return true;
    } catch (err) {
      console.warn("[Danh mục] Không tải được từ API:", err);
      cfg.rows = [];
      return false;
    }
  };

  const switchCategoryTab = (tabName) => {
    if (!listTab || !addTab || !listSection || !addSection) return;
    activeCategoryTab = tabName;
    const isList = tabName === "list";
    const isAdd = tabName === "add";
    const isExtra = tabName === "extra";

    listSection.hidden = !isList;
    addSection.hidden = isList;
    listTab.classList.toggle("tab-active", isList);
    addTab.classList.toggle("tab-active", isAdd);
    extraTab?.classList.toggle("tab-active", isExtra);
    const pag = listSection.nextElementSibling;
    if (pag && pag.classList.contains("table-pagination")) {
      pag.hidden = !isList;
    }
  };

  const getNextCategoryId = () => {
    if (!categoryTableBody) return 1;
    const ids = Array.from(categoryTableBody.querySelectorAll("tr td:first-child"))
      .map((cell) => Number(cell.textContent?.trim()))
      .filter((value) => Number.isFinite(value));
    if (ids.length === 0) return 1;
    return Math.max(...ids) + 1;
  };

  const buildCategoryCodeFromName = (name) =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("-")
      .slice(0, 10);

  const resetCategoryForm = () => {
    if (!categoryNameInput || !categoryCodeInput || !categoryNameError || !categoryCodeSelect) return;
    categoryNameInput.value = "";
    categoryCodeInput.value = "";
    categoryCodeSelect.value = "";
    const reqKey = "categories.validationRequired";
    categoryNameError.setAttribute("data-i18n", reqKey);
    categoryNameError.textContent = window.FmI18n?.t?.(reqKey) || "Hãy nhập danh mục của bạn !";
    categoryNameError.hidden = true;
  };

  const toMoneyNumber = (text) => Number((text || "").replace(/[^\d]/g, "")) || 0;
  const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

  const escapeCategoryAttr = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");

  const escapeCategoryText = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  /** Cột chức năng: cập nhật + xóa (ô vuông, icon; không có xem chi tiết) */
  const categoryActionButtonsHtml = (id, code) => {
    const a = escapeCategoryAttr(id);
    const b = escapeCategoryAttr(code);
    return `<td>
      <div class="category-icon-actions">
        <button class="category-icon-btn category-update-btn" type="button" data-category-id="${a}" data-category-code="${b}" data-i18n-title="categories.actions.updateTitle" title="Cập nhật">
          <img src="/assets/icons/update.svg" alt="" />
        </button>
        <button class="category-icon-btn category-delete-btn" type="button" data-category-id="${a}" data-category-code="${b}" data-i18n-title="categories.actions.deleteTitle" title="Xóa">
          <img src="/assets/icons/delete.svg" alt="" />
        </button>
      </div>
    </td>`;
  };

  const rawCategoryNameByCode = (code) => {
    const c = String(code || "").trim();
    const hit = cachedCategoryList.find(
      (item) => String(item.code || item.categoryCode || "").trim() === c,
    );
    return String(hit?.name || hit?.categoryName || "").trim();
  };

  const renderCategoryRows = (rows) => {
    if (!categoryTableBody) return;
    categoryTableBody.innerHTML = rows
      .map((row) => {
        if (!row || row.length === 0) return "";
        const cells = [...row];
        cells.pop();
        const id = cells[0] ?? "";
        const code = cells[1] ?? "";
        const rawName = rawCategoryNameByCode(code) || String(cells[2] ?? "");
        const displayName = translateCategoryDisplayName(code, rawName, cachedCategoryConfigKey);
        const dataTds = cells
          .map((c, i) => {
            const text = i === 2 ? displayName : c;
            return `<td>${escapeCategoryText(text)}</td>`;
          })
          .join("");
        return `<tr data-category-name="${escapeCategoryAttr(rawName)}">${dataTds}${categoryActionButtonsHtml(id, code)}</tr>`;
      })
      .join("");
  };

  const renderCategoryHead = (columns) => {
    if (!categoryTableHeadRow) return;
    const vk = String(activeCategoryConfigKey || "default").replace(/-/g, "_");
    categoryTableHeadRow.innerHTML = (columns || [])
      .map((fallback, i) => {
        const key = `categories.views.${vk}.columns.${i}`;
        const translated = window.FmI18n?.t?.(key);
        const text = translated && translated !== key ? translated : fallback;
        return `<th data-i18n="${key}">${escapeCategoryText(text)}</th>`;
      })
      .join("");
  };

  const populateBudgetTypeSelect = () => {
    if (!categoryCodeSelect || !categoryTableBody) return;
    const options = Array.from(categoryTableBody.querySelectorAll("tr"))
      .map((row) => {
        const cells = row.querySelectorAll("td");
        const code = cells[1]?.textContent?.trim() || "";
        const name = cells[2]?.textContent?.trim() || "";
        const value = code || name;
        const label = code ? `${code} - ${name}` : name;
        return { value, label };
      })
      .filter((item) => item.value);

    categoryCodeSelect.innerHTML = `
      <option value="" data-i18n="categories.budgetSelectPlaceholder">-- Chọn loại kinh phí --</option>
      ${options.map((item) => `<option value="${item.value}">${item.label}</option>`).join("")}
    `;
    window.FmI18n?.apply?.(categoryCodeSelect);
  };

  const setActiveCategoryMenuItem = (viewKey) => {
    categoryMenuLinks.forEach((link) => link.classList.remove("active"));
    const matchedLink = categoryMenuLinks.find((link) => {
      const href = link.getAttribute("href") || "";
      const slug = (href.split("#")[1] || "").trim();
      if (!viewKey || viewKey === "default") return slug === "" || slug === "default";
      return slug === viewKey;
    });
    if (matchedLink) {
      matchedLink.classList.add("active");
    }
  };

  const applyCategoryView = async () => {
    let viewKey = window.location.hash.replace("#", "").trim();
    if (viewKey && viewKey !== "default" && viewKey !== "nguon-kinh-phi") {
      viewKey = "default";
      try {
        const url = new URL(window.location.href);
        url.hash = "";
        window.history.replaceState(null, "", url);
      } catch (_) {}
    }
    if (!viewKey || viewKey === "default") {
      await ensureI18nReady();
      await taiDanhMucTuApi("ASSET", "default");
    } else if (viewKey === "nguon-kinh-phi") {
      await ensureI18nReady();
      await taiDanhMucTuApi("FUND_SOURCE", "nguon-kinh-phi");
    }
    const config = categoryConfigs[viewKey] || categoryConfigs.default;
    activeCategoryConfigKey = categoryConfigs[viewKey] ? viewKey : "default";
    const vk = String(activeCategoryConfigKey || "default").replace(/-/g, "_");
    const vp = (field) => `categories.views.${vk}.${field}`;
    const ct = (field, fb) => {
      const key = vp(field);
      const v = window.FmI18n?.t?.(key);
      return v && v !== key ? v : fb;
    };

    if (pageTitle) {
      pageTitle.setAttribute("data-i18n", vp("title"));
      pageTitle.textContent = ct("title", config.title);
    }
    if (listTab) {
      listTab.setAttribute("data-i18n", vp("listTab"));
      listTab.textContent = ct("listTab", config.listTabText);
    }
    if (addTab) {
      addTab.setAttribute("data-i18n", vp("addTab"));
      addTab.textContent = ct("addTab", config.addTabText);
    }
    if (extraTab) {
      const hasExtraTab = Boolean(config.extraTabText);
      extraTab.hidden = !hasExtraTab;
      if (hasExtraTab) {
        extraTab.setAttribute("data-i18n", vp("extraTab"));
        extraTab.textContent = ct("extraTab", config.extraTabText);
      } else {
        extraTab.removeAttribute("data-i18n");
        extraTab.textContent = "";
      }
    }
    if (categoryNameLabel) {
      categoryNameLabel.setAttribute("data-i18n", vp("nameLabel"));
      categoryNameLabel.textContent = ct("nameLabel", config.nameLabel);
    }
    if (categoryCodeLabel) {
      categoryCodeLabel.setAttribute("data-i18n", vp("codeLabel"));
      categoryCodeLabel.textContent = ct("codeLabel", config.codeLabel);
    }
    if (categoryNameInput) {
      categoryNameInput.setAttribute("data-i18n-placeholder", vp("namePlaceholder"));
      categoryNameInput.placeholder = ct("namePlaceholder", config.namePlaceholder);
    }
    if (categoryCodeInput) {
      categoryCodeInput.setAttribute("data-i18n-placeholder", vp("codePlaceholder"));
      categoryCodeInput.placeholder = ct("codePlaceholder", config.codePlaceholder);
      categoryCodeInput.hidden = false;
    }
    if (categoryCodeSelect) categoryCodeSelect.hidden = true;
    const submitBtn = categoryForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.setAttribute("data-i18n", vp("submitBtn"));
      submitBtn.textContent = ct("submitBtn", window.FmI18n?.t?.("buttons.add") || "Thêm");
    }
    if (categoryResetBtn) {
      categoryResetBtn.setAttribute("data-i18n", vp("resetBtn"));
      categoryResetBtn.textContent = ct("resetBtn", window.FmI18n?.t?.("userForm.btnReset") || "Nhập lại");
    }
    renderCategoryHead(config.columns);
    renderCategoryRows(config.rows);
    setActiveCategoryMenuItem(categoryConfigs[viewKey] ? viewKey : "");
    resetCategoryForm();
    switchCategoryTab("list");
    refreshCategoryTable();
    window.FmI18n?.apply?.(document.querySelector("main.content"));
  };

  const setupAddFormForCurrentTab = () => {
    const config = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
    const isBudgetView = activeCategoryConfigKey === "nguon-kinh-phi";
    const isExtra = activeCategoryTab === "extra";
    const vk = String(activeCategoryConfigKey || "default").replace(/-/g, "_");
    const vp = (field) => `categories.views.${vk}.${field}`;
    const ct = (field, fb) => {
      const key = vp(field);
      const v = window.FmI18n?.t?.(key);
      return v && v !== key ? v : fb;
    };

    if (!categoryNameInput || !categoryCodeInput || !categoryCodeSelect || !categoryNameLabel || !categoryCodeLabel) return;

    if (isBudgetView && isExtra) {
      categoryNameLabel.setAttribute("data-i18n", vp("extraNameLabel"));
      categoryNameLabel.textContent = ct("extraNameLabel", config.extraNameLabel);
      categoryCodeLabel.setAttribute("data-i18n", vp("extraCodeLabel"));
      categoryCodeLabel.textContent = ct("extraCodeLabel", config.extraCodeLabel);
      categoryNameInput.setAttribute("data-i18n-placeholder", vp("extraNamePlaceholder"));
      categoryNameInput.placeholder = ct("extraNamePlaceholder", config.extraNamePlaceholder);
      categoryCodeInput.hidden = true;
      categoryCodeSelect.hidden = false;
      populateBudgetTypeSelect();
      window.FmI18n?.apply?.(document.getElementById("categoryForm"));
      return;
    }

    categoryNameLabel.setAttribute("data-i18n", vp("nameLabel"));
    categoryNameLabel.textContent = ct("nameLabel", config.nameLabel);
    categoryCodeLabel.setAttribute("data-i18n", vp("codeLabel"));
    categoryCodeLabel.textContent = ct("codeLabel", config.codeLabel);
    categoryNameInput.setAttribute("data-i18n-placeholder", vp("namePlaceholder"));
    categoryNameInput.placeholder = ct("namePlaceholder", config.namePlaceholder);
    categoryCodeInput.setAttribute("data-i18n-placeholder", vp("codePlaceholder"));
    categoryCodeInput.placeholder = ct("codePlaceholder", config.codePlaceholder);
    categoryCodeInput.hidden = false;
    categoryCodeSelect.hidden = true;
    window.FmI18n?.apply?.(document.getElementById("categoryForm"));
  };

  listTab?.addEventListener("click", () => {
    switchCategoryTab("list");
  });
  addTab?.addEventListener("click", () => {
    switchCategoryTab("add");
    setupAddFormForCurrentTab();
  });
  extraTab?.addEventListener("click", () => {
    switchCategoryTab("extra");
    setupAddFormForCurrentTab();
  });

  categoryNameInput?.addEventListener("input", () => {
    if (!categoryCodeInput) return;
    const name = categoryNameInput.value;
    if (!categoryCodeInput.value.trim()) {
      categoryCodeInput.value = buildCategoryCodeFromName(name);
    }
    if (categoryNameError) {
      categoryNameError.hidden = name.trim().length > 0;
    }
  });

  categoryResetBtn?.addEventListener("click", () => resetCategoryForm());

  categoryTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const updateBtn = target.closest(".category-update-btn");
    const deleteBtn = target.closest(".category-delete-btn");
    const row = target.closest("tr");
    if (!row || (!updateBtn && !deleteBtn)) return;

    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return;
    const code = cells[1]?.textContent?.trim() || "";
    const displayName = cells[2]?.textContent?.trim() || "";
    const name = row.getAttribute("data-category-name") || displayName;

    if (updateBtn) {
      const config = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
      const labels = (config.columns || []).slice(0, -1);
      const dataTds = Array.from(cells).slice(0, -1);
      const values = dataTds.map((td, i) => {
        if (i === 2) return rawCategoryNameByCode(code) || td.textContent?.trim() || "";
        return td.textContent?.trim() || "";
      });
      try {
        sessionStorage.setItem(
          "categoryEditDraft",
          JSON.stringify({
            configKey: activeCategoryConfigKey,
            pageTitle: config.title,
            labels,
            values,
            returnHash: window.location.hash || "",
          })
        );
      } catch (_) {}
      window.location.href = "category-update.html";
      return;
    }
    if (deleteBtn) {
      const delMsg =
        window.FmI18n?.t?.("categories.confirmDelete", { name: displayName }) ||
        `Bạn có chắc muốn xóa danh mục "${displayName}"?`;
      if (!window.confirm(delMsg)) return;
      const idDanhMuc = cells[0]?.textContent?.trim() || "";
      if (idDanhMuc && window.CoSoApi?.xoaDanhMuc) {
        void (async () => {
          try {
            await window.CoSoApi.xoaDanhMuc(idDanhMuc);
            if (activeCategoryConfigKey === "nguon-kinh-phi") {
              await taiDanhMucTuApi("FUND_SOURCE", "nguon-kinh-phi");
            } else if (!activeCategoryConfigKey || activeCategoryConfigKey === "default") {
              await taiDanhMucTuApi("ASSET", "default");
            } else {
              row.remove();
            }
            const cfg = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
            renderCategoryRows(cfg.rows);
            refreshCategoryTable();
          } catch (e) {
            window.alert(window.FmI18n?.t?.("categories.deleteServerFail") || "Xóa danh mục trên máy chủ thất bại.");
          }
        })();
        return;
      }
      row.remove();
      refreshCategoryTable();
    }
  });

  categoryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!categoryTableBody || !categoryNameInput || !categoryCodeInput || !categoryNameError || !categoryCodeSelect) return;

    const categoryName = categoryNameInput.value.trim();
    const typedCode = categoryCodeInput.hidden ? categoryCodeSelect.value.trim() : categoryCodeInput.value.trim();
    const categoryCode = typedCode || buildCategoryCodeFromName(categoryName);

    if (!categoryName) {
      categoryNameError.hidden = false;
      const reqKey = "categories.validationRequired";
      categoryNameError.setAttribute("data-i18n", reqKey);
      categoryNameError.textContent = window.FmI18n?.t?.(reqKey) || "Hãy nhập danh mục của bạn !";
      categoryNameInput.focus();
      return;
    }

    categoryNameError.hidden = true;

    const dungApiDanhMuc =
      !activeCategoryConfigKey ||
      activeCategoryConfigKey === "default" ||
      activeCategoryConfigKey === "nguon-kinh-phi";

    if (dungApiDanhMuc) {
      const jsonDanhMuc = {
        code: categoryCode,
        name: categoryName,
        type: activeCategoryConfigKey === "nguon-kinh-phi" ? "FUND_SOURCE" : "ASSET",
      };
      void (async () => {
        try {
          if (window.CoSoApi?.taoDanhMuc) await window.CoSoApi.taoDanhMuc(jsonDanhMuc);
          if (activeCategoryConfigKey === "nguon-kinh-phi") {
            await taiDanhMucTuApi("FUND_SOURCE", "nguon-kinh-phi");
          } else {
            await taiDanhMucTuApi("ASSET", "default");
          }
          const cfg = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
          renderCategoryRows(cfg.rows);
          resetCategoryForm();
          switchCategoryTab("list");
          refreshCategoryTable();
        } catch (e) {
          console.warn("[Danh mục] Thêm API thất bại:", e);
          window.alert(window.FmI18n?.t?.("categories.loadError") || "Không lưu được danh mục. Kiểm tra backend đang chạy.");
        }
      })();
      return;
    }
  });

  refreshCategoryTable = setupTableControls({
    tableBody: categoryTableBody,
    searchInput: document.getElementById("categorySearchInput"),
    pageSizeSelect: document.getElementById("categoryPageSizeSelect"),
  });

  window.addEventListener("hashchange", () => {
    void applyCategoryView();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      void applyCategoryView();
    }
  });

  document.getElementById("categoriesExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const iso = new Date().toISOString();
    if (listSection && !listSection.hidden && categoryTableBody) {
      Fm.download(`categories-list-${stamp}.json`, {
        exportedAt: iso,
        rows: Fm.tbodyToObjectsAuto(categoryTableBody),
      });
      return;
    }
    if (categoryForm) {
      Fm.download(`categories-form-${stamp}.json`, {
        exportedAt: iso,
        form: Fm.formToPlainObject(categoryForm),
      });
    }
  });

  const refreshCategoryRowsI18n = () => {
    const cfg = categoryConfigs[cachedCategoryConfigKey] || categoryConfigs.default;
    if (!cachedCategoryList.length) return;
    cfg.rows = mapDanhMucThanhHang(cachedCategoryList, cachedCategoryConfigKey);
    renderCategoryRows(cfg.rows);
    refreshCategoryTable();
    window.FmI18n?.apply?.(categoryTableBody);
  };

  window.addEventListener("fm-i18n-applied", () => {
    refreshCategoryRowsI18n();
    const config = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
    renderCategoryHead(config.columns);
    window.FmI18n?.apply?.(document.querySelector("main.content"));
  });

  void applyCategoryView();
})();
