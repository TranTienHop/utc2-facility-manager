/**
 * Trang dashboard/asset-view.html & asset-update.html
 */
(function assetFormPageScope() {
  const assetI18n = () => window.AppAssetI18n || {};
  const assetT = (key, params) => {
    const fn = assetI18n().t;
    return typeof fn === "function" ? fn(key, params) : key;
  };

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  const ganTuyChonCode = (id, options, placeholder) => {
    const select = document.getElementById(id);
    if (!(select instanceof HTMLSelectElement)) return;
    const htmlOptions = options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("");
    select.innerHTML = `${placeholder ? `<option value="">${esc(placeholder)}</option>` : ""}${htmlOptions}`;
  };
  const ASSET_SELECTED_KEY = "assetSelectedPayload";
  const payloadRaw = sessionStorage.getItem(ASSET_SELECTED_KEY);
  let payload = null;
  try {
    payload = payloadRaw ? JSON.parse(payloadRaw) : null;
  } catch {
    payload = null;
  }
  if (!payload) {
    window.location.replace("assets.html");
  } else {
    const fieldMap = {
      assetNameInput: "assetName",
      assetRoomInput: "roomId",
      assetStatusInput: "status",
      assetPurchaseDateInput: "purchaseDate",
      assetFundInput: "fundSource",
      assetNoteInput: "note",
      assetCategoryInput: "itemCategory",
      assetQuantityInput: "quantity",
      assetProviderInput: "provider",
      assetCountryInput: "country",
      assetCardInput: "cardNumber",
      assetTypeInput: "assetType",
      assetManufactureYearInput: "manufactureYear",
      assetUnitPriceInput: "unitPrice",
      assetOriginalPriceInput: "originalPrice",
      assetUsageTimeInput: "usageTime",
      assetUsageYearInput: "usageYear",
    };

    const tuDoiTuongTaiSan = (a) =>
      a && typeof a === "object"
        ? {
            id: a.id != null ? String(a.id) : payload.id != null ? String(payload.id) : "",
            assetName: a.assetName || a.asset_name || "",
            provider: a.provider || "",
            country: a.country || "",
            cardNumber: a.cardNumber || a.card_number || "",
            roomId: a.roomId != null ? String(a.roomId) : "",
            roomCode: a.roomCode || a.room_code || "",
            classroom: a.classroom || "",
            assetType: a.assetType || a.asset_type || "",
            itemCategory: a.itemCategory || a.item_category || "",
            manufactureYear: a.manufactureYear != null ? String(a.manufactureYear) : "",
            unitPrice: a.unitPrice != null ? String(a.unitPrice) : "",
            quantity: a.quantity != null ? String(a.quantity) : "",
            originalPrice: a.originalPrice != null ? String(a.originalPrice) : "",
            fundSource: a.fundSource || a.fund_source || "",
            usageTime: a.usageTime != null ? String(a.usageTime) : "",
            purchaseDate: a.purchaseDate || a.purchase_date || "",
            usageYear: a.usageYear != null ? String(a.usageYear) : "",
            note: a.note || "",
            status: a.status || "IN_USE",
          }
        : null;

    const taiDanhSachPhong = async (selectedRoomId = "", selectedRoomCode = "") => {
      const roomSelect = document.getElementById("assetRoomInput");
      if (!(roomSelect instanceof HTMLSelectElement)) return;
      try {
        const api = window.FmApi || window.CoSoApi;
        if (!api?.layDanhSachPhong) return;
        const rooms = await api.layDanhSachPhong();
        if (!Array.isArray(rooms)) return;
        const options = rooms
          .map((room) => {
            const id = room.id != null ? String(room.id) : "";
            const roomCode = String(room.roomCode || "").trim();
            const buildingCode = String(room.buildingCode || "").trim();
            if (!id || !roomCode) return "";
            const labelFn = assetI18n().roomSelectLabel;
            const label =
              typeof labelFn === "function"
                ? labelFn(roomCode, buildingCode)
                : `${roomCode}${buildingCode ? ` - Nhà ${buildingCode}` : ""}`;
            return `<option value="${esc(id)}" data-room-code="${esc(roomCode)}">${esc(label)}</option>`;
          })
          .filter(Boolean)
          .join("");
        const roomPh = assetI18n().placeholderRoom?.() || "-- Chọn phòng --";
        roomSelect.innerHTML = `<option value="">${esc(roomPh)}</option>${options}`;
        if (selectedRoomId && [...roomSelect.options].some((o) => o.value === selectedRoomId)) {
          roomSelect.value = selectedRoomId;
        } else if (selectedRoomCode) {
          const opt = [...roomSelect.options].find((o) => (o.getAttribute("data-room-code") || "") === selectedRoomCode);
          if (opt) roomSelect.value = opt.value;
        }
      } catch (e) {
        console.warn("[Tài sản] Không tải được danh sách phòng:", e);
      }
    };

    const taiTuyChonDanhMucChoForm = async () => {
      const api = window.FmApi || window.CoSoApi;
      if (!api?.layDanhSachDanhMuc) return;
      try {
        const [assets, funds] = await Promise.all([
          api.layDanhSachDanhMuc({ type: "ASSET" }),
          api.layDanhSachDanhMuc({ type: "FUND_SOURCE" }),
        ]);
        const toOpts = (list) =>
          (Array.isArray(list) ? list : []).map((c) => ({
            value: String(c.code || c.categoryCode || ""),
            label: String(c.name || c.categoryName || c.code || ""),
          }));
        ganTuyChonCode(
          "assetCategoryInput",
          toOpts(assets),
          assetI18n().placeholderCategory?.() || "-- Chọn danh mục --",
        );
        ganTuyChonCode(
          "assetFundInput",
          toOpts(funds),
          assetI18n().placeholderFund?.() || "-- Chọn nguồn kinh phí --",
        );
      } catch (err) {
        console.warn("[Tài sản] Không tải danh mục cho form:", err);
      }
    };

    const applyAssetDetailFields = (p) => {
      Object.entries(fieldMap).forEach(([fieldId, dataKey]) => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        const v = p[dataKey];
        input.value = v != null && v !== "" ? String(v) : "";
      });
      void taiDanhSachPhong(String(p.roomId || ""), String(p.roomCode || p.classroom || ""));
    };

    let latestPayload = payload;
    void taiTuyChonDanhMucChoForm().then(() => applyAssetDetailFields(payload));

    window.addEventListener("fm-i18n-applied", () => {
      window.FmI18n?.apply?.(document);
      const p = latestPayload || payload;
      void taiTuyChonDanhMucChoForm().then(() => {
        applyAssetDetailFields(p);
      });
    });

    const idTaiSan = payload.id != null ? String(payload.id) : "";
    if (idTaiSan && window.CoSoApi?.layTaiSanTheoId) {
      void (async () => {
        try {
          const raw = await window.CoSoApi.layTaiSanTheoId(idTaiSan);
          const p2 = tuDoiTuongTaiSan(raw);
          if (p2) {
            latestPayload = { ...payload, ...p2 };
            applyAssetDetailFields(latestPayload);
            try {
              sessionStorage.setItem(ASSET_SELECTED_KEY, JSON.stringify(latestPayload));
            } catch (_) {}
          }
        } catch (e) {
          console.warn("[Tài sản] GET theo id:", e);
        }
      })();
    }

    const isView = window.location.pathname.includes('asset-view');
    const form = document.getElementById("assetViewForm") || document.getElementById("assetUpdateForm");
    const backBtn = document.getElementById("assetViewBackBtn") || document.getElementById("assetUpdateBackBtn");

    if (isView && form) {
      const fields = form.querySelectorAll("input, select, textarea");
      fields.forEach((field) => {
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          field.readOnly = true;
        } else if (field instanceof HTMLSelectElement) {
          field.disabled = true;
        }
      });
    }

    backBtn?.addEventListener("click", () => {
      window.location.href = "assets.html";
    });

    const updateForm = document.getElementById("assetUpdateForm");
    updateForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      let payloadSubmit = payload;
      try {
        const raw = sessionStorage.getItem(ASSET_SELECTED_KEY);
        if (raw) payloadSubmit = JSON.parse(raw);
      } catch (_) {}
      const maTaiSan =
        payloadSubmit.id != null ? String(payloadSubmit.id) : payloadSubmit.cardNumber || "";
      const than = {};
      Object.entries(fieldMap).forEach(([fieldId, jsonKey]) => {
        const el = document.getElementById(fieldId);
        if (el) than[jsonKey] = el.value.trim();
      });
      than.roomId = than.roomId ? Number(than.roomId) : null;
      const roomSelect = document.getElementById("assetRoomInput");
      if (roomSelect instanceof HTMLSelectElement) {
        const selectedOption = roomSelect.selectedOptions?.[0];
        than.classroom = selectedOption?.getAttribute("data-room-code") || "";
      }
      void (async () => {
        try {
          if (maTaiSan && window.CoSoApi?.capNhatTaiSan) await window.CoSoApi.capNhatTaiSan(maTaiSan, than);
        } catch (e) {
          window.alert("Cập nhật trên máy chủ thất bại.");
        }
        window.alert(assetT("assets.updateSuccess"));
        window.location.href = "assets.html";
      })();
    });
  }
})();
