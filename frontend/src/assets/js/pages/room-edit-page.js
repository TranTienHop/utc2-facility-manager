/**
 * Trang dashboard/room-edit.html — form gọn: lớp, sức chứa, GV (+ ngày/ca chỉ xem).
 */
(function roomEditPageScope() {
  const { mapRoomApiToProfile, fillK65ClassSelects, getRoomUpdates, setRoomUpdate } =
    window.AppRoomHelpers || {};
  const xacDinhHocKyTuNgay = window.AppRoomApi?.xacDinhHocKyTuNgay;
  const luuGhiDeHienThiPhong = window.AppRoomApi?.luuGhiDeHienThiPhong;

  const form = document.getElementById("roomEditForm");
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room") || "NA-001";
  const idPhongTuUrl = params.get("id") || "";
  const buildingParam = params.get("building") || "";
  const filterDate = params.get("date") || "";
  const filterShift = params.get("shift") || "";

  const roomCodeLabel = document.getElementById("roomEditCodeLabel");
  if (roomCodeLabel) roomCodeLabel.textContent = roomCode;

  const roomCodeReadonly = document.getElementById("roomCodeReadonly");
  if (roomCodeReadonly) roomCodeReadonly.value = roomCode;

  const roomFloorInput = document.getElementById("roomFloorInput");
  if (roomFloorInput instanceof HTMLInputElement) {
    roomFloorInput.readOnly = true;
    roomFloorInput.title = "Không thể đổi tầng khi cập nhật phòng";
  }

  const roomEditDateInput = document.getElementById("roomEditDateInput");
  if (roomEditDateInput instanceof HTMLInputElement) {
    roomEditDateInput.readOnly = true;
    if (filterDate) roomEditDateInput.value = filterDate;
  }

  const roomEditShiftSelect = document.getElementById("roomEditShiftSelect");
  if (roomEditShiftSelect instanceof HTMLSelectElement) {
    if (filterShift) roomEditShiftSelect.value = filterShift;
    roomEditShiftSelect.disabled = true;
  }

  if (buildingParam) {
    const buildingHint = document.getElementById("roomEditBuildingHint");
    const roomEditBuildingLabel = document.getElementById("roomEditBuildingLabel");
    if (buildingHint) buildingHint.hidden = false;
    if (roomEditBuildingLabel) roomEditBuildingLabel.textContent = `Nhà ${buildingParam}`;
  }

  if (form) {
    fillK65ClassSelects(form);
    form.addEventListener("input", () => form.classList.remove("submitted"));
    form.addEventListener("change", () => form.classList.remove("submitted"));
  }

  let snapshotFloor = "";

  const thamSoApiPhong = () => {
    const q = {};
    if (filterDate) q.date = filterDate;
    if (filterShift) q.shift = filterShift;
    if (typeof xacDinhHocKyTuNgay === "function") {
      q.semester = xacDinhHocKyTuNgay(filterDate);
    }
    return q;
  };

  const ensureK65OrLegacy = (id, v) => {
    const s = document.getElementById(id);
    if (!s || v == null || v === "") return;
    if ([...s.options].some((o) => o.value === v)) {
      s.value = v;
      return;
    }
    s.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`);
    s.value = v;
  };

  const applyRoomEditForm = (p) => {
    if (roomFloorInput) {
      roomFloorInput.value = p.floor != null ? String(p.floor) : "";
      snapshotFloor = p.floor != null ? String(p.floor) : snapshotFloor;
    }
    const classUsing = document.getElementById("roomClassUsingInput");
    const capacity = document.getElementById("roomCapacityInput");
    const teacher = document.getElementById("roomTeacherInput");
    if (classUsing) {
      ensureK65OrLegacy("roomClassUsingInput", p.className);
      if (!classUsing.value && p.className) classUsing.value = p.className;
    }
    if (capacity) capacity.value = p.capacity != null ? String(p.capacity) : "";
    if (teacher) teacher.value = p.teacher || "";
  };

  const docPrefill = () => {
    try {
      const raw = sessionStorage.getItem("roomEditPrefill");
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (String(p?.roomCode || "").trim() !== roomCode) return null;
      return p;
    } catch (_) {
      return null;
    }
  };

  const prefill = docPrefill();
  if (prefill) {
    applyRoomEditForm({
      floor: prefill.floor,
      className: prefill.className,
      teacher: prefill.teacher,
      capacity: prefill.capacity,
    });
    if (roomEditDateInput instanceof HTMLInputElement && prefill.date) {
      roomEditDateInput.value = prefill.date;
    }
    if (roomEditShiftSelect instanceof HTMLSelectElement && prefill.shift) {
      roomEditShiftSelect.value = prefill.shift;
    }
  }

  void (async () => {
    const api = window.CoSoApi || window.FmApi;
    if (!api) return;
    try {
      const q = thamSoApiPhong();
      let raw = null;
      if (idPhongTuUrl && typeof api.layPhongTheoId === "function") {
        raw = await api.layPhongTheoId(idPhongTuUrl, q);
      } else if (typeof api.layDanhSachPhong === "function") {
        const ds = await api.layDanhSachPhong({
          ...q,
          building: buildingParam || undefined,
        });
        raw = (Array.isArray(ds) ? ds : []).find(
          (r) => String(r.roomCode || r.room_code || "").trim() === roomCode
        );
      }
      const fromApi = mapRoomApiToProfile(raw);
      if (fromApi) applyRoomEditForm(fromApi);
    } catch (e) {
      console.warn("[Phòng] Tải form sửa API:", e);
    } finally {
      try {
        sessionStorage.removeItem("roomEditPrefill");
      } catch (_) {
        /* ignore */
      }
    }
  })();

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("submitted");
      form.reportValidity();
      return;
    }

    let b = buildingParam;
    if (!b) {
      try {
        b = sessionStorage.getItem("departmentsActiveBuilding") || "";
      } catch (_) {
        b = "";
      }
    }

    const className = document.getElementById("roomClassUsingInput")?.value.trim() || "";
    const capacity = document.getElementById("roomCapacityInput")?.value.trim() || "";
    const teacher = document.getElementById("roomTeacherInput")?.value.trim() || "";
    const floor = snapshotFloor || roomFloorInput?.value.trim() || "";

    const prev = getRoomUpdates()[roomCode] || {};
    setRoomUpdate(roomCode, {
      ...prev,
      buildingCode: b || prev.buildingCode,
      className,
      capacity,
      teacher,
      floor,
    });

    const idPhongCapNhat =
      idPhongTuUrl || (window.maPhongTuDinhDanh && window.maPhongTuDinhDanh[roomCode]) || "";

    const jsonCapNhatPhong = {
      buildingCode: b || undefined,
      classUsing: className,
      classStudying: className,
      capacity: Number(capacity) || 0,
      teacherName: teacher,
    };

    void (async () => {
      try {
        if (!idPhongCapNhat || !window.CoSoApi?.capNhatPhong) {
          window.alert("Không xác định được phòng trên máy chủ.");
          return;
        }
        await window.CoSoApi.capNhatPhong(idPhongCapNhat, jsonCapNhatPhong);
      } catch (err) {
        console.warn("[Phòng] Cập nhật API:", err);
        window.alert("Cập nhật phòng thất bại.");
        return;
      }

      try {
        sessionStorage.setItem("departmentsListNeedsReload", "1");
        if (b) sessionStorage.setItem("departmentsActiveBuilding", b);
        if (filterDate && filterShift && luuGhiDeHienThiPhong) {
          luuGhiDeHienThiPhong(roomCode, filterDate, filterShift, {
            className,
            teacher,
            capacity,
          });
        }
      } catch (_) {
        /* ignore */
      }

      window.alert("Cập nhật phòng thành công!");
      const back = new URL("../dashboard/departments.html", window.location.href);
      if (b) back.searchParams.set("building", b);
      if (filterDate) back.searchParams.set("date", filterDate);
      if (filterShift) back.searchParams.set("shift", filterShift);
      window.location.href = back.pathname + back.search;
    })();
  });
})();
