/**
 * Trang dashboard/assets.html
 */
(function assetsPageScope() {
  const { setupTableControls } = window.AppTableControls || {};
  const assetPageTitle = document.getElementById("assetPageTitle");
  const assetTabs = document.getElementById("assetTabs");
  const assetTabList = document.getElementById("assetTabList");
  const assetTabDetail = document.getElementById("assetTabDetail");
  const assetTabTransfer = document.getElementById("assetTabTransfer");
  const assetListSection = document.getElementById("assetListSection");
  const assetDetailSection = document.getElementById("assetDetailSection");
  const assetTransferSection = document.getElementById("assetTransferSection");
  const assetTableBody = document.getElementById("assetTableBody");
  const assetDetailForm = document.getElementById("assetDetailForm");

  const thoatThuocTinh = (chuoi) =>
    String(chuoi ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  const dinhDangTienVn = (so) => {
    if (so == null || so === "") return "";
    const n = Number(so);
    if (Number.isNaN(n)) return String(so);
    return n.toLocaleString("vi-VN") + " đ";
  };
  const taoMaTaiSanNoiBo = () => {
    const random4 = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `AUTO-${Date.now()}-${random4}`;
  };
  const ganTuyChonCode = (id, options, placeholder) => {
    const select = document.getElementById(id);
    if (!(select instanceof HTMLSelectElement)) return;
    const htmlOptions = options
      .map((o) => `<option value="${thoatThuocTinh(o.value)}">${thoatThuocTinh(o.label)}</option>`)
      .join("");
    const placeholderOption = placeholder ? `<option value="">${thoatThuocTinh(placeholder)}</option>` : "";
    select.innerHTML = `${placeholderOption}${htmlOptions}`;
  };
  const assetI18n = () => window.AppAssetI18n || {};
  const assetT = (key, params) => {
    const fn = assetI18n().t;
    return typeof fn === "function" ? fn(key, params) : key;
  };

  const taiTuyChonDanhMucChoFormTaiSan = async () => {
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

  const ganTenNguoiBanGiaoTuPhien = () => {
    const el = document.getElementById("transferGiverInput");
    const user = window.AppAuth?.getUser?.();
    if (el && user) {
      el.value = String(user.fullName || user.username || "").trim();
    }
  };

  const taoHangTaiSanTuDto = (a) => {
          const id = a.id != null ? String(a.id) : "";
          const card = a.cardNumber || a.card_number || "";
          const ten = a.assetName || a.asset_name || "";
          const nhaCungCap = a.provider || "";
          const nuoc = a.country || "";
          const khoa = a.department || "";
          const loaiTs = a.assetType || a.asset_type || "";
          const dm = a.itemCategory || a.item_category || "";
          const namSx = a.manufactureYear != null ? String(a.manufactureYear) : "";
          const dg = a.unitPrice != null ? String(a.unitPrice) : "";
          const sl = a.quantity != null ? String(a.quantity) : "";
          const nguyenGia = a.originalPrice != null ? String(a.originalPrice) : "";
          const nguon = a.fundSource || a.fund_source || "";
          const tgSd = a.usageTime != null ? String(a.usageTime) : "";
          const ngayMua = a.purchaseDate || a.purchase_date || "";
          const namSd = a.usageYear != null ? String(a.usageYear) : "";
          const ghiChu = a.note || "";
          const nguoiMua = a.buyer || "";
          const phong = a.roomCode || a.room_code || a.classroom || "";
          const toa = String(a.building || a.buildingName || timNhaTheoMaPhong(phong) || "")
            .trim()
            .toUpperCase();
          const roomId = a.roomId != null ? String(a.roomId) : "";
          const tt = String(a.status || "IN_USE").toUpperCase();
          const dangHoatDong = tt === "IN_USE" || tt === "ACTIVE";
          const tenHienThi = window.FmAssetName?.translate
            ? window.FmAssetName.translate(ten, dm, card)
            : ten;
          const pillOn = assetT("assets.statusPillOnTitle");
          const pillOff = assetT("assets.statusPillOffTitle");
          return `<tr
            data-asset-id="${thoatThuocTinh(id)}"
            data-status="${thoatThuocTinh(tt)}"
            data-asset-name="${thoatThuocTinh(ten)}"
            data-provider="${thoatThuocTinh(nhaCungCap)}"
            data-country="${thoatThuocTinh(nuoc)}"
            data-card-number="${thoatThuocTinh(card)}"
            data-department="${thoatThuocTinh(khoa)}"
            data-building="${thoatThuocTinh(toa)}"
            data-room-id="${thoatThuocTinh(roomId)}"
            data-room-code="${thoatThuocTinh(phong)}"
            data-classroom="${thoatThuocTinh(phong)}"
            data-asset-type="${thoatThuocTinh(loaiTs)}"
            data-item-category="${thoatThuocTinh(dm)}"
            data-manufacture-year="${thoatThuocTinh(namSx)}"
            data-unit-price="${thoatThuocTinh(dg)}"
            data-quantity="${thoatThuocTinh(sl)}"
            data-original-price="${thoatThuocTinh(nguyenGia)}"
            data-fund-source="${thoatThuocTinh(nguon)}"
            data-usage-time="${thoatThuocTinh(tgSd)}"
            data-purchase-date="${thoatThuocTinh(ngayMua)}"
            data-usage-year="${thoatThuocTinh(namSd)}"
            data-note="${thoatThuocTinh(ghiChu)}"
            data-buyer="${thoatThuocTinh(nguoiMua)}"
            data-quantity="${thoatThuocTinh(sl)}"
          >
            <td>${thoatThuocTinh(dm)}</td>
            <td>${thoatThuocTinh(tenHienThi)}</td>
            <td>${thoatThuocTinh(sl)}</td>
            <td>${thoatThuocTinh(phong || toa)}</td>
            <td><button type="button" class="status-pill asset-status-pill${dangHoatDong ? " on" : ""}" aria-pressed="${dangHoatDong}" data-asset-active="${dangHoatDong ? "1" : "0"}" title="${thoatThuocTinh(dangHoatDong ? pillOn : pillOff)}"></button></td>
            <td>
              <div class="room-action-buttons user-action-buttons">
                <button class="icon-btn asset-view-btn" type="button" title="${thoatThuocTinh(assetT("assets.actionView"))}">
                  <img src="/assets/icons/view_infor.svg" alt="${thoatThuocTinh(assetT("assets.actionView"))}" />
                </button>
                <button class="icon-btn asset-transfer-btn" type="button" title="${thoatThuocTinh(assetT("assets.actionTransfer"))}">
                  <img src="/assets/icons/dieu_chuyen_1.svg" alt="${thoatThuocTinh(assetT("assets.actionTransfer"))}" />
                </button>
                <button class="icon-btn asset-update-btn" type="button" title="${thoatThuocTinh(assetT("assets.actionUpdate"))}">
                  <img src="/assets/icons/update.svg" alt="${thoatThuocTinh(assetT("assets.actionUpdate"))}" />
                </button>
              </div>
            </td>
          </tr>`;
  };

  const assetListSearchInput = document.getElementById("assetListSearchInput");
  const assetListPageSizeSelect = document.getElementById("assetListPageSizeSelect");
  const assetFilterBuilding = document.getElementById("assetFilterBuilding");
  const assetFilterRoom = document.getElementById("assetFilterRoom");

  /** @type {{ roomCode: string, buildingCode: string }[]} */
  let danhSachPhongLoc = [];

  const nhanHienThiNha = (code) => {
    const fn = assetI18n().buildingDisplayLabel;
    return typeof fn === "function" ? fn(code) : String(code || "");
  };

  const timNhaTheoMaPhong = (roomCode) => {
    const ma = String(roomCode || "").trim().toUpperCase();
    if (!ma) return "";
    const hit = danhSachPhongLoc.find((p) => p.roomCode.toUpperCase() === ma);
    return hit?.buildingCode || "";
  };

  const sapXepMaNha = (a, b) => {
    const order = ["C1", "C2", "C3", "E1", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "EB8", "GDDN", "CANTIN", "KHAC"];
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b, "vi");
  };

  const ganTuyChonLocPhong = () => {
    if (!(assetFilterRoom instanceof HTMLSelectElement)) return;
    const nha = String(assetFilterBuilding?.value || "").trim().toUpperCase();
    const phongTrongNha = nha
      ? danhSachPhongLoc.filter((p) => p.buildingCode === nha)
      : [...danhSachPhongLoc];
    phongTrongNha.sort((a, b) => a.roomCode.localeCompare(b.roomCode, "vi"));
    const allLabel =
      (typeof window.FmI18n?.t === "function" && window.FmI18n.t("statistics.filterAll")) || "Tất cả";
    const opts = phongTrongNha.map(
      (p) =>
        `<option value="${thoatThuocTinh(p.roomCode)}">${thoatThuocTinh(p.roomCode)}</option>`,
    );
    assetFilterRoom.innerHTML = `<option value="">${thoatThuocTinh(allLabel)}</option>${opts.join("")}`;
    assetFilterRoom.value = "";
  };

  const ganTuyChonLocNha = () => {
    if (!(assetFilterBuilding instanceof HTMLSelectElement)) return;
    const codes = [...new Set(danhSachPhongLoc.map((p) => p.buildingCode).filter(Boolean))].sort(sapXepMaNha);
    const allLabel =
      (typeof window.FmI18n?.t === "function" && window.FmI18n.t("statistics.filterAll")) || "Tất cả";
    const opts = codes.map(
      (code) =>
        `<option value="${thoatThuocTinh(code)}">${thoatThuocTinh(nhanHienThiNha(code))}</option>`,
    );
    assetFilterBuilding.innerHTML = `<option value="">${thoatThuocTinh(allLabel)}</option>${opts.join("")}`;
    assetFilterBuilding.value = "";
    ganTuyChonLocPhong();
  };

  const taiDanhSachPhongChoBoLoc = async () => {
    const api = window.FmApi || window.CoSoApi;
    if (!api?.layDanhSachPhong) return;
    try {
      const list = await api.layDanhSachPhong();
      if (!Array.isArray(list)) return;
      danhSachPhongLoc = list
        .map((r) => ({
          roomCode: String(r.roomCode || r.room_code || "").trim(),
          buildingCode: String(r.buildingCode || r.building_code || "").trim().toUpperCase(),
        }))
        .filter((p) => p.roomCode && p.buildingCode);
      ganTuyChonLocNha();
    } catch (err) {
      console.warn("[Tài sản] Không tải danh sách phòng cho bộ lọc:", err);
    }
  };

  const locHangTaiSanTheoNhaPhong = (row) => {
    if (!(row instanceof HTMLTableRowElement)) return true;
    const nhaLoc = String(assetFilterBuilding?.value || "").trim().toUpperCase();
    const phongLoc = String(assetFilterRoom?.value || "").trim().toUpperCase();
    const nhaHang = String(row.dataset.building || "").trim().toUpperCase();
    const phongHang = String(row.dataset.roomCode || row.dataset.classroom || "")
      .trim()
      .toUpperCase();
    if (nhaLoc && nhaHang !== nhaLoc) return false;
    if (phongLoc && phongHang !== phongLoc) return false;
    return true;
  };

  const hienTrangThaiBang = (html, className) => {
    if (!assetTableBody) return;
    const cls = className ? ` class="${className}"` : "";
    assetTableBody.innerHTML = `<tr${cls} data-table-placeholder="1"><td colspan="6" style="text-align:center;padding:24px">${html}</td></tr>`;
    refreshAssetTable();
  };

  let refreshAssetTable = () => {};
  if (assetTableBody && typeof setupTableControls === "function") {
    refreshAssetTable = setupTableControls({
      tableBody: assetTableBody,
      searchInput: assetListSearchInput,
      pageSizeSelect: assetListPageSizeSelect,
      searchColumnIndexes: [0, 1, 2, 3],
      customFilter: locHangTaiSanTheoNhaPhong,
      isDataRow: (row) => !row.hasAttribute("data-table-placeholder"),
    });
  }

  assetFilterBuilding?.addEventListener("change", () => {
    ganTuyChonLocPhong();
    refreshAssetTable();
  });
  assetFilterRoom?.addEventListener("change", () => {
    refreshAssetTable();
  });

  const taiBangTaiSanTuApi = async () => {
    if (!assetTableBody) return;
    const api = window.FmApi || window.CoSoApi;
    if (!api?.layDanhSachTaiSan) {
      hienTrangThaiBang(
        "Không tìm thấy API (kiểm tra file api-client.js và thứ tự script).",
        "table-load-error",
      );
      console.error("[Tài sản] Thiếu FmApi.layDanhSachTaiSan");
      return;
    }
    hienTrangThaiBang(assetT("assets.loading"), "table-loading-row");
    try {
      const list = await api.layDanhSachTaiSan();
      if (!Array.isArray(list)) {
        hienTrangThaiBang("Dữ liệu API không hợp lệ.", "table-load-error");
        return;
      }
      if (!list.length) {
        hienTrangThaiBang(assetT("assets.emptyList"), "table-empty-row");
        return;
      }
      assetTableBody.innerHTML = list.map(taoHangTaiSanTuDto).join("");
      refreshAssetTable();
    } catch (err) {
      console.warn("[Tài sản] Không tải được từ API:", err);
      hienTrangThaiBang(
        `Không tải được từ API. (${thoatThuocTinh(err?.message || err)})`,
        "table-load-error",
      );
    }
  };
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

  const switchAssetTab = (tabName) => {
    const isList = tabName === "list";
    const isDetail = tabName === "detail";
    const isTransfer = tabName === "transfer";
    if (assetListSection) assetListSection.hidden = !isList;
    if (assetDetailSection) assetDetailSection.hidden = !isDetail;
    if (assetTransferSection) assetTransferSection.hidden = !isTransfer;
    assetTabList?.classList.toggle("tab-active", isList);
    assetTabDetail?.classList.toggle("tab-active", isDetail);
    assetTabTransfer?.classList.toggle("tab-active", isTransfer);
  };

  const applyAssetMode = () => {
    if (assetPageTitle) {
      assetPageTitle.setAttribute("data-i18n", "assets.pageTitle");
      assetPageTitle.textContent =
        (typeof window.FmI18n?.t === "function" && window.FmI18n.t("assets.pageTitle")) || "Quản lý tài sản";
    }
    if (assetTabs) assetTabs.hidden = false;
    switchAssetTab("list");
  };

  const fillAssetDetailForm = (row) => {
    if (!row) return;
    Object.entries(fieldMap).forEach(([fieldId, dataKey]) => {
      const input = document.getElementById(fieldId);
      if (!input) return;
      const value = row.dataset[dataKey] || "";
      input.value = value;
    });
    const selectedRoomId = row.dataset.roomId || "";
    const selectedRoomCode = row.dataset.roomCode || row.dataset.classroom || "";
    void taiDanhSachPhongChoTaiSan(selectedRoomId, selectedRoomCode);
  };

  const ASSET_SELECTED_KEY = "assetSelectedPayload";
  const toAssetPayloadFromRow = (row) => {
    const payload = {};
    Object.values(fieldMap).forEach((dataKey) => {
      payload[dataKey] = row.dataset[dataKey] || "";
    });
    payload.roomCode = row.dataset.roomCode || row.dataset.classroom || "";
    payload.classroom = row.dataset.classroom || "";
    if (row.dataset.assetId) payload.id = row.dataset.assetId;
    return payload;
  };

  const goToAssetPage = (pageName, row) => {
    if (!row) return;
    try {
      sessionStorage.setItem(ASSET_SELECTED_KEY, JSON.stringify(toAssetPayloadFromRow(row)));
    } catch (_) {}
    window.location.href = pageName;
  };

  const fillAssetTransferForm = (row) => {
    if (!row) return;
    const mappings = [
      ["transferCardInput", row.dataset.cardNumber || ""],
      ["transferNameInput", row.dataset.assetName || ""],
      ["transferCurrentRoomInput", row.dataset.classroom || row.dataset.building || ""],
      ["transferGiverInput", "admin"],
    ];
    mappings.forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
  };
  const taiDanhSachPhongChoTaiSan = async (selectedRoomId = "", selectedRoomCode = "") => {
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
          return `<option value="${thoatThuocTinh(id)}" data-room-code="${thoatThuocTinh(roomCode)}">${thoatThuocTinh(label)}</option>`;
        })
        .filter(Boolean)
        .join("");
      const roomPh = assetI18n().placeholderRoom?.() || "-- Chọn phòng --";
      roomSelect.innerHTML = `<option value="">${thoatThuocTinh(roomPh)}</option>${options}`;
      if (selectedRoomId && [...roomSelect.options].some((o) => o.value === selectedRoomId)) {
        roomSelect.value = selectedRoomId;
      } else if (selectedRoomCode) {
        const opt = [...roomSelect.options].find((o) => (o.getAttribute("data-room-code") || "") === selectedRoomCode);
        if (opt) roomSelect.value = opt.value;
      }
    } catch (error) {
      console.warn("[Tài sản] Không tải được danh sách phòng:", error);
    }
  };

  assetTabList?.addEventListener("click", () => switchAssetTab("list"));
  assetTabDetail?.addEventListener("click", () => {
    assetDetailForm?.reset();
    void taiTuyChonDanhMucChoFormTaiSan();
    void taiDanhSachPhongChoTaiSan();
    switchAssetTab("detail");
  });
  assetTabTransfer?.addEventListener("click", () => {
    switchAssetTab("transfer");
    ganTenNguoiBanGiaoTuPhien();
  });

  assetDetailForm?.addEventListener("submit", (event) => {
    event.preventDefault();
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
    if (!than.cardNumber) {
      than.cardNumber = taoMaTaiSanNoiBo();
      const hiddenCard = document.getElementById("assetCardInput");
      if (hiddenCard instanceof HTMLInputElement) hiddenCard.value = than.cardNumber;
    }
    void (async () => {
      try {
        if (window.CoSoApi?.taoTaiSan) await window.CoSoApi.taoTaiSan(than);
      } catch (e) {
        window.alert("Gửi thêm tài sản lên máy chủ thất bại.");
      }
      window.alert(assetT("assets.addSuccess"));
      assetDetailForm.reset();
      switchAssetTab("list");
      await taiBangTaiSanTuApi();
    })();
  });

  const setAssetPillVisual = (pill, active) => {
    pill.classList.toggle("on", active);
    pill.setAttribute("aria-pressed", active ? "true" : "false");
    pill.dataset.assetActive = active ? "1" : "0";
    pill.title = active ? assetT("assets.statusPillOnTitle") : assetT("assets.statusPillOffTitle");
  };

  const capNhatTrangThaiTaiSan = async (assetId, active) => {
    const api = window.FmApi || window.CoSoApi;
    if (!api?.capNhatTaiSan) throw new Error("API cập nhật tài sản chưa sẵn sàng");
    const status = active ? "IN_USE" : "MAINTENANCE";
    return api.capNhatTaiSan(assetId, { status });
  };

  assetTableBody?.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const pill = target.closest("button.asset-status-pill");
      if (pill && assetTableBody.contains(pill)) {
        event.preventDefault();
        event.stopPropagation();
        const row = pill.closest("tr");
        if (!row) return;
        const assetId = row.dataset.assetId || "";
        if (!assetId) return;

        const wasActive = pill.classList.contains("on");
        const willBeActive = !wasActive;
        setAssetPillVisual(pill, willBeActive);
        pill.disabled = true;

        void (async () => {
          try {
            await capNhatTrangThaiTaiSan(assetId, willBeActive);
            row.dataset.status = willBeActive ? "IN_USE" : "MAINTENANCE";
          } catch (e) {
            setAssetPillVisual(pill, wasActive);
            window.alert(
              willBeActive
                ? "Không thể đưa tài sản vào sử dụng. Kiểm tra backend (cổng 8080)."
                : "Không thể chuyển sang bảo trì. Kiểm tra backend (cổng 8080)."
            );
          } finally {
            pill.disabled = false;
          }
        })();
        return;
      }
    },
    true
  );

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const viewBtn = target.closest(".asset-view-btn");
    if (!viewBtn) return;
    const row = target.closest("tr");
    goToAssetPage("asset-view.html", row);
  });

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const updateBtn = target.closest(".asset-update-btn");
    if (!updateBtn) return;
    const row = target.closest("tr");
    goToAssetPage("asset-update.html", row);
  });

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const transferBtn = target.closest(".asset-transfer-btn");
    if (!transferBtn) return;
    const row = transferBtn.closest("tr");
    if (!row) return;
    fillAssetTransferForm(row);
    switchAssetTab("transfer");
  });

  document.getElementById("assetTransferForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const formData = new FormData(form);
    const sourceRoom = String(formData.get("sourceRoom") || "").trim();
    const targetRoom = String(formData.get("targetRoom") || "").trim();
    const transferQuantity = Number(formData.get("transferQuantity") || 0);
    const giverName = String(formData.get("giverName") || "").trim();
    const receiverName = String(formData.get("receiverName") || "").trim();
    const receivedDate = String(formData.get("receivedDate") || "").trim();
    const note = String(formData.get("note") || "").trim();

    if (!targetRoom || !transferQuantity || !receivedDate || !giverName || !receiverName) {
      window.alert("Vui lòng nhập đủ thông tin điều chuyển.");
      return;
    }
    if (sourceRoom && sourceRoom === targetRoom) {
      window.alert("Phòng đích phải khác phòng hiện tại.");
      return;
    }

    const activeRow = assetTableBody?.querySelector(
      `tr[data-card-number="${CSS.escape(String(formData.get("cardNumber") || ""))}"]`
    );
    if (!(activeRow instanceof HTMLTableRowElement)) {
      window.alert("Không tìm thấy tài sản để điều chuyển.");
      return;
    }
    const currentQuantity = Number(activeRow.dataset.quantity || 0);
    if (transferQuantity > currentQuantity) {
      window.alert("Số lượng điều chuyển không được vượt quá số lượng hiện có.");
      return;
    }

    void (async () => {
      try {
        const api = window.FmApi || window.CoSoApi;
        const assetId = activeRow.dataset.assetId || "";
        if (!assetId || !api?.taoPhieuDieuChuyenTaiSan) {
          throw new Error("Thiếu API điều chuyển tài sản.");
        }
        await api.taoPhieuDieuChuyenTaiSan(assetId, {
          targetRoomCode: targetRoom,
          transferQuantity,
          transferDate: receivedDate,
          giverName,
          receiverName,
          note,
        });
        window.alert(assetT("assets.transferSuccess"));
        form.reset();
        await taiBangTaiSanTuApi();
        switchAssetTab("list");
      } catch (error) {
        window.alert(`Điều chuyển thất bại: ${error?.message || error}`);
      }
    })();
  });

  document.getElementById("assetsExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const iso = new Date().toISOString();
    if (assetListSection && !assetListSection.hidden && assetTableBody) {
      Fm.download(`assets-list-${stamp}.json`, {
        exportedAt: iso,
        rows: Fm.tbodyToObjectsAuto(assetTableBody),
      });
      return;
    }
    if (assetDetailSection && !assetDetailSection.hidden && assetDetailForm) {
      Fm.download(`asset-detail-form-${stamp}.json`, {
        exportedAt: iso,
        form: Fm.formToPlainObject(assetDetailForm),
      });
      return;
    }
    if (assetTransferSection && !assetTransferSection.hidden) {
      const tf = document.getElementById("assetTransferForm");
      if (tf) {
        Fm.download(`asset-transfer-${stamp}.json`, {
          exportedAt: iso,
          form: Fm.formToPlainObject(tf),
        });
        return;
      }
    }
  });

  const bootAssetsPage = async () => {
    try {
      applyAssetMode();
      await taiDanhSachPhongChoBoLoc();
      await taiBangTaiSanTuApi();
      void taiTuyChonDanhMucChoFormTaiSan();
    } catch (err) {
      console.error("[assets-page] boot failed:", err);
      hienTrangThaiBang(`Lỗi khởi tạo trang: ${thoatThuocTinh(err?.message || err)}`, "table-load-error");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAssetsPage);
  } else {
    bootAssetsPage();
  }

  window.addEventListener("fm-i18n-applied", () => {
    ganTuyChonLocNha();
    void taiBangTaiSanTuApi();
    void taiTuyChonDanhMucChoFormTaiSan();
    const roomSelect = document.getElementById("assetRoomInput");
    if (roomSelect instanceof HTMLSelectElement && roomSelect.value) {
      const selectedId = roomSelect.value;
      const selectedCode =
        roomSelect.selectedOptions?.[0]?.getAttribute("data-room-code") || "";
      void taiDanhSachPhongChoTaiSan(selectedId, selectedCode);
    }
  });
})();
