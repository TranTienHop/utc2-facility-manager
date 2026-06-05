/**
 * Trang dashboard/departments.html
 */
(function departmentsPageScope() {
  const body = document.getElementById("roomTableBody");
  const roomApi = window.AppRoomApi;
  if (!roomApi) {
    if (body) {
      body.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:#b3261e">Không tải được module phòng (room-api.js).</td></tr>';
    }
    console.error("[Phòng] Thiếu window.AppRoomApi — kiểm tra thứ tự script room-api.js.");
    return;
  }
  const { setupTableControls } = window.AppTableControls || {};
  const {
    K65_CLASS_OPTIONS,
    getRoomProfile,
    mapRoomApiToProfile,
    getRadioValueByName,
    setRadioValueByName,
    fillK65ClassSelects,
    getRoomUpdates,
    setRoomUpdate,
    getRoomAdditions,
    setRoomAdditions,
    addRoomRowToBuilding,
  } = window.AppRoomHelpers || {};
  const {
    buildingRooms,
    roomRowForUi,
    sortRoomRowsByFloor,
    xacDinhHocKyTuNgay,
    taiPhongTuMayChu,
    isRoomCodeTakenInBuilding,
  } = roomApi;
  const departmentsTable = document.getElementById("departmentsTable");
  const departmentsTableHeadRow = document.getElementById("departmentsTableHeadRow");
  const departmentsSearchInput = document.getElementById("departmentsSearchInput");
  const departmentsShiftSelect = document.getElementById("departmentsShiftSelect");
  const departmentsDateInput = document.getElementById("departmentsDateInput");
  const deptPageTitle = document.querySelector(".departments-panel .page-title");
  const addRoomTabLink = document.querySelector('a.tab[href*="room-add"]');
  let refreshDepartmentTable = () => {};

  const DEPT_HK2_START = new Date("2026-03-02T00:00:00");
  const DEPT_HK2_END = new Date("2026-06-06T23:59:59");
  const DEPT_HK1_START = new Date("2025-09-03T00:00:00");
  const DEPT_HK1_END = new Date("2026-01-10T23:59:59");

  const layKhoangHocKyHienTai = () => {
    const now = new Date();
    if (now >= DEPT_HK2_START && now <= DEPT_HK2_END) {
      return { start: DEPT_HK2_START, end: DEPT_HK2_END };
    }
    if (now >= DEPT_HK1_START && now <= DEPT_HK1_END) {
      return { start: DEPT_HK1_START, end: DEPT_HK1_END };
    }
    return now >= DEPT_HK2_START
      ? { start: DEPT_HK2_START, end: DEPT_HK2_END }
      : { start: DEPT_HK1_START, end: DEPT_HK1_END };
  };

  /** Tiêu đề trang theo tòa đang chọn: «Quản lí nhà E1», «Quản lí nhà E3», ... */
  const giuTieuDeTrangPhong = (buildingCode) => {
    if (!deptPageTitle) return;
    const code = chuanHoaMaToa(buildingCode || maToaHienTai());
    deptPageTitle.removeAttribute("data-i18n");
    deptPageTitle.removeAttribute("data-i18n-params");
    if (!code) {
      deptPageTitle.textContent = "Quản lí phòng học";
      return;
    }
    if (code === "GDDN") {
      deptPageTitle.textContent = "Quản lí Giảng đường Đa Năng";
      return;
    }
    if (code === "CANTIN") {
      deptPageTitle.textContent = "Quản lí Căn Tin";
      return;
    }
    deptPageTitle.textContent = `Quản lí nhà ${code}`;
  };

  const chuanHoaMaToa = (code) => {
    const s = String(code || "").trim();
    if (!s) return "";
    if (s === "GDDN" || s === "CANTIN") return s;
    return s.toUpperCase();
  };

  const maToaHienTai = () => {
    const tuUrl = chuanHoaMaToa(new URLSearchParams(window.location.search).get("building"));
    if (tuUrl) return tuUrl;
    try {
      const stored = chuanHoaMaToa(sessionStorage.getItem("departmentsActiveBuilding"));
      if (stored) return stored;
    } catch (_) {
      /* ignore */
    }
    const tuHang = chuanHoaMaToa(
      document.querySelector("#roomTableBody tr[data-building]")?.getAttribute("data-building"),
    );
    if (tuHang) return tuHang;
    return "E1";
  };

  const dongBoBuildingTrenUrl = (code) => {
    const normalized = chuanHoaMaToa(code);
    if (!normalized || !window.history?.replaceState) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("building") === normalized) return;
      url.searchParams.set("building", normalized);
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch (_) {
      /* ignore */
    }
  };

  const deptT = (key, params) => {
    const v = window.FmI18n?.t?.(key, params);
    return v != null && v !== key ? v : key;
  };

  const formatIsoDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const tinhNgayMacDinh = () => {
    const { start, end } = layKhoangHocKyHienTai();
    const now = new Date();
    if (now < start) return formatIsoDate(start);
    if (now > end) return formatIsoDate(end);
    return formatIsoDate(now);
  };

  const khoiTaoBoLoc = (resetNgay = false) => {
    const ngayTuUrl = new URLSearchParams(window.location.search).get("date") || "";
    const caTuUrl = new URLSearchParams(window.location.search).get("shift") || "";
    if (departmentsDateInput) {
      departmentsDateInput.min = formatIsoDate(DEPT_HK1_START);
      departmentsDateInput.max = formatIsoDate(DEPT_HK2_END);
      if (ngayTuUrl) {
        departmentsDateInput.value = ngayTuUrl;
      } else if (resetNgay || !departmentsDateInput.value) {
        departmentsDateInput.value = tinhNgayMacDinh();
      }
      const v = departmentsDateInput.value;
      if (v && departmentsDateInput.min && v < departmentsDateInput.min) {
        departmentsDateInput.value = departmentsDateInput.min;
      }
      if (v && departmentsDateInput.max && v > departmentsDateInput.max) {
        departmentsDateInput.value = departmentsDateInput.max;
      }
    }
    if (departmentsShiftSelect) {
      if (caTuUrl) departmentsShiftSelect.value = caTuUrl;
      else if (!departmentsShiftSelect.value) departmentsShiftSelect.value = "MORNING";
    }
  };

  const buildingLabelForCode = (code) => {
    if (!code) return deptT("menu.building");
    if (code === "GDDN") return deptT("menu.venueLectureHall");
    if (code === "CANTIN") return deptT("menu.venueCanteen");
    return deptT("menu.buildingNamed", { name: code });
  };

  const renderDeptTableHead = () => {
    if (!departmentsTableHeadRow) return;
    departmentsTableHeadRow.innerHTML = `
    <th>${deptT("departments.colRoomCode")}</th>
    <th>${deptT("departments.colFloor")}</th>
    <th>${deptT("departments.colClassUsing")}</th>
    <th>${deptT("departments.colTeacher")}</th>
    <th>${deptT("departments.colCapacity")}</th>
    <th>${deptT("departments.colActions")}</th>
  `;
  };

  const setAddRoomLink = (buildingCode) => {
    const href = `../dashboard/room-add.html?building=${encodeURIComponent(buildingCode)}`;
    if (addRoomTabLink) addRoomTabLink.href = href;
    const addRoomBtn = document.getElementById("departmentsAddRoomLink");
    if (addRoomBtn) addRoomBtn.setAttribute("href", href);
    try {
      sessionStorage.setItem("departmentsActiveBuilding", buildingCode);
    } catch (_) {}
  };

  const roomActionCells = (roomCode) => `
          <td>
            <div class="room-action-buttons user-action-buttons">
              <button class="icon-btn room-view-btn" type="button" data-room-code="${roomCode}" title="${deptT("departments.viewRoom")}">
                <img src="/assets/icons/view_infor.svg" alt="${deptT("departments.viewRoom")}" />
              </button>
              <button class="icon-btn room-update-btn" type="button" data-room-code="${roomCode}" title="${deptT("departments.updateRoom")}">
                <img src="/assets/icons/update.svg" alt="${deptT("departments.updateRoom")}" />
              </button>
            </div>
          </td>`;

  const buildDepartmentRoomTr = (room, buildingCode) => {
    const uiRow = roomRowForUi(room);
    const roomFloor = uiRow[1] != null && String(uiRow[1]).trim() !== "" ? String(uiRow[1]).trim() : "";
    const roomClass =
      uiRow[2] != null && String(uiRow[2]).trim() !== "" && uiRow[2] !== "-"
        ? String(uiRow[2]).trim()
        : "Trống";
    const roomTeacher =
      uiRow[3] != null && String(uiRow[3]).trim() !== "" && uiRow[3] !== "-"
        ? String(uiRow[3]).trim()
        : "--";
    const roomCapacity =
      uiRow[4] != null && String(uiRow[4]).trim() !== ""
        ? String(uiRow[4]).trim()
        : room[5] != null && String(room[5]).trim() !== ""
          ? String(room[5]).trim()
          : "";
    const idPhong = (window.maPhongTuDinhDanh && window.maPhongTuDinhDanh[uiRow[0]]) || "";
    const roomCode = String(uiRow[0] || "").trim();
    return `
        <tr data-building="${buildingCode}" data-room-id="${idPhong}" data-room-code="${roomCode}">
          <td>${roomCode}</td>
          <td>${roomFloor}</td>
          <td>${roomClass}</td>
          <td>${roomTeacher}</td>
          <td>${roomCapacity}</td>
          ${roomActionCells(uiRow[0])}
        </tr>`;
  };

  const renderRooms = (buildingCode, displayText) => {
    if (!body) return;
    const code = chuanHoaMaToa(buildingCode) || buildingCode;
    if (departmentsTable) departmentsTable.setAttribute("data-dept-search-mode", "single");
    renderDeptTableHead();
    setAddRoomLink(code);
    dongBoBuildingTrenUrl(code);
    const rows = sortRoomRowsByFloor(buildingRooms[code] || []);
    if (rows.length === 0) {
      body.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px">Không có phòng.</td></tr>';
    } else {
      body.innerHTML = rows
        .map((room) => buildDepartmentRoomTr(room, code))
        .join("");
    }
    giuTieuDeTrangPhong(code);
    refreshDepartmentTable();
  };

  departmentsSearchInput?.addEventListener("input", () => {
    refreshDepartmentTable();
  });

  refreshDepartmentTable = setupTableControls({
    tableBody: body,
    searchInput: departmentsSearchInput,
    getRowSearchText: (row) => {
      const fromAttr = row.getAttribute("data-room-code");
      if (fromAttr) return fromAttr.trim().toLowerCase();
      return (row.children[0]?.textContent?.trim() || "").toLowerCase();
    },
  });

  const hienLoiTaiPhong = (err) => {
    if (!body) return;
    const msg =
      window.FmI18n?.tPlain?.("departments.loadError") ||
      "Không tải được danh sách phòng. Kiểm tra đăng nhập và backend (cổng 8080).";
    const detail = err?.message ? ` (${err.message})` : "";
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#b3261e">${msg}${detail}</td></tr>`;
    refreshDepartmentTable();
  };

  const taiLaiPhongTheoBoLoc = async () => {
    const building = maToaHienTai();
    const date = departmentsDateInput?.value || "";
    const shift = departmentsShiftSelect?.value || "";
    try {
      await taiPhongTuMayChu({
        building,
        date: date || undefined,
        shift: shift || undefined,
      });
    } catch (err) {
      hienLoiTaiPhong(err);
      return;
    }
    taiTheoUrl();
    if (departmentsSearchInput?.value.trim()) {
      refreshDepartmentTable();
    }
  };

  const onDateOrShiftFilterChange = () => {
    void taiLaiPhongTheoBoLoc();
  };
  departmentsDateInput?.addEventListener("change", onDateOrShiftFilterChange);
  departmentsDateInput?.addEventListener("input", onDateOrShiftFilterChange);
  departmentsShiftSelect?.addEventListener("change", () => {
    void taiLaiPhongTheoBoLoc();
  });

  const taiTheoUrl = () => {
    const code = maToaHienTai();
    setAddRoomLink(code);
    renderRooms(code, buildingLabelForCode(code));
  };

  window.addEventListener("fm-i18n-applied", () => {
    renderDeptTableHead();
    khoiTaoBoLoc(false);
    queueMicrotask(giuTieuDeTrangPhong);
  });

  giuTieuDeTrangPhong();

  window.addEventListener("pageshow", (event) => {
    if (event.persisted || sessionStorage.getItem("departmentsListNeedsReload") === "1") {
      try {
        sessionStorage.removeItem("departmentsListNeedsReload");
      } catch (_) {
        /* ignore */
      }
      void taiLaiPhongTheoBoLoc();
    }
  });

  void (async () => {
    khoiTaoBoLoc(true);
    await taiLaiPhongTheoBoLoc();
    giuTieuDeTrangPhong();
  })();

  body?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const viewBtn = target.closest(".room-view-btn");
    const updateBtn = target.closest(".room-update-btn");
    const roomCode =
      viewBtn?.getAttribute("data-room-code") ||
      updateBtn?.getAttribute("data-room-code") ||
      "";
    if (!roomCode) return;
    if (viewBtn) {
      const tr = viewBtn.closest("tr");
      const idPhong = tr?.getAttribute("data-room-id") || "";
      const q = new URLSearchParams({ room: roomCode });
      if (idPhong) q.set("id", idPhong);
      const ngayLoc = departmentsDateInput?.value?.trim() || "";
      const caLoc = departmentsShiftSelect?.value?.trim() || "";
      const toaLoc =
        tr?.getAttribute("data-building") || maToaHienTai() || "";
      if (ngayLoc) q.set("date", ngayLoc);
      if (caLoc) q.set("shift", caLoc);
      if (toaLoc) q.set("building", toaLoc);
      window.location.href = `../dashboard/room-detail.html?${q.toString()}`;
      return;
    }
    if (updateBtn) {
      const tr = updateBtn.closest("tr");
      const idPhong = tr?.getAttribute("data-room-id") || "";
      let b =
        tr?.getAttribute("data-building") ||
        maToaHienTai() ||
        "";
      if (!b) {
        try {
          b = sessionStorage.getItem("departmentsActiveBuilding") || "";
        } catch (_) {
          b = "";
        }
      }
      const ngayLoc = departmentsDateInput?.value?.trim() || "";
      const caLoc = departmentsShiftSelect?.value?.trim() || "";
      try {
        sessionStorage.setItem(
          "roomEditPrefill",
          JSON.stringify({
            roomCode,
            floor: tr?.cells[1]?.textContent?.trim() || "",
            className: tr?.cells[2]?.textContent?.trim() || "",
            teacher: tr?.cells[3]?.textContent?.trim() || "",
            capacity: tr?.cells[4]?.textContent?.trim() || "",
            date: ngayLoc,
            shift: caLoc,
          })
        );
      } catch (_) {
        /* ignore */
      }
      const q = new URLSearchParams({ room: roomCode });
      if (b) q.set("building", b);
      if (idPhong) q.set("id", idPhong);
      if (ngayLoc) q.set("date", ngayLoc);
      if (caLoc) q.set("shift", caLoc);
      window.location.href = `../dashboard/room-edit.html?${q.toString()}`;
      return;
    }
  });

  document.getElementById("departmentsExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    Fm.download(`phong-export-${stamp}.json`, {
      exportedAt: new Date().toISOString(),
      rows: Fm.tbodyToObjectsAuto(document.getElementById("roomTableBody")),
    });
  });
})();
