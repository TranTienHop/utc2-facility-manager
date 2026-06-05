/**
 * Trang dashboard/room-detail.html
 */
(function roomDetailPageScope() {
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
    sortRoomRowsByFloor,
    xacDinhHocKyTuNgay,
    taiPhongTuMayChu,
    isRoomCodeTakenInBuilding,
  } = window.AppRoomApi;
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room") || "NA-001";
  const idPhongTuUrl = params.get("id") || "";
  const filterDate = params.get("date")?.trim() || "";
  const filterShift = params.get("shift")?.trim() || "";
  const filterBuilding = params.get("building")?.trim() || "";

  const nhanCaChiTiet = (shift) => {
    const s = String(shift || "").toUpperCase();
    if (s === "MORNING") return "Sáng";
    if (s === "AFTERNOON") return "Chiều";
    if (s === "EVENING") return "Tối";
    return shift || "";
  };

  const hienThiBoLocLich = () => {
    const el = document.getElementById("roomScheduleContext");
    if (!el) return;
    if (!filterDate && !filterShift) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    const parts = [];
    if (filterShift) parts.push(`Ca ${nhanCaChiTiet(filterShift)}`);
    if (filterDate) {
      const [y, m, d] = filterDate.split("-");
      parts.push(d && m && y ? `${d}/${m}/${y}` : filterDate);
    }
    el.hidden = false;
    el.textContent = `Lịch theo bộ lọc: ${parts.join(" · ")}`;
  };

  const chuoiCoNghia = (v) => {
    const s = v != null ? String(v).trim() : "";
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower === "trống" || lower === "trong" || s === "--" || s === "-") return "";
    return s;
  };

  const apDungLopGvTuLich = (profile, rawRow) => {
    const next = { ...profile };
    if (!filterDate && !filterShift) {
      return { profile: next, showTeacherClass: true };
    }
    const lopRaw = chuoiCoNghia(
      rawRow?.classStudying ||
        rawRow?.class_studying ||
        rawRow?.classUsing ||
        rawRow?.class_using ||
        "",
    );
    const gvRaw = chuoiCoNghia(
      rawRow?.teacherName || rawRow?.teacher_name || rawRow?.teacher || "",
    );
    if (!lopRaw && !gvRaw) {
      next.classStudying = "";
      next.classUsing = "";
      next.className = "";
      next.teacher = "";
      return { profile: next, showTeacherClass: false };
    }
    if (lopRaw) next.classStudying = lopRaw;
    if (gvRaw) next.teacher = gvRaw;
    return { profile: next, showTeacherClass: true };
  };

  const chonSoLuongThietBi = (tuTongHop, tuPhong) => {
    const n = Number(tuTongHop);
    if (tuTongHop != null && tuTongHop !== "" && !Number.isNaN(n) && n > 0) return String(n);
    return tuPhong != null && tuPhong !== "" ? String(tuPhong) : "";
  };

  const datAnHienOLich = (show) => {
    ["roomTeacher", "roomClass"].forEach((id) => {
      const el = document.getElementById(id);
      const box = el?.closest(".info-box");
      if (box) box.hidden = !show;
    });
  };

  const applyRoomDetail = (profile, summary = null, { showTeacherClass = true } = {}) => {
    const roomCodeLabel = document.getElementById("roomCodeLabel");
    if (roomCodeLabel) roomCodeLabel.textContent = roomCode;
    hienThiBoLocLich();
    datAnHienOLich(showTeacherClass);
    const mapped = summary || {};
    const mappings = [
      ["roomTeacher", profile.teacher],
      ["roomClass", profile.classStudying || profile.classUsing || profile.className],
      ["roomDesks", chonSoLuongThietBi(mapped.desks, profile.desks)],
      ["roomChairs", chonSoLuongThietBi(mapped.chairs, profile.chairs)],
      ["roomSpeakers", chonSoLuongThietBi(mapped.speakers, profile.speakers)],
      ["roomAirConditioner", chonSoLuongThietBi(mapped.airConditioners, profile.airConditioner)],
      ["roomMicrophone", chonSoLuongThietBi(mapped.microphones, profile.microphone)],
      ["roomGlassDoor", profile.glassDoor],
      ["roomCeilingFan", profile.ceilingFan],
      ["roomCurtain", profile.curtain],
    ];
    mappings.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value != null ? String(value) : "";
    });
  };
  const thamSoLichPhong = () => {
    if (!filterDate && !filterShift) return null;
    const p = {};
    if (filterDate) p.date = filterDate;
    if (filterShift) p.shift = filterShift;
    p.semester = xacDinhHocKyTuNgay(filterDate);
    return p;
  };

  void (async () => {
    try {
      const api = window.CoSoApi;
      if (!api) {
        applyRoomDetail(getRoomProfile(roomCode));
        return;
      }
      const lichParams = thamSoLichPhong();
      let raw = null;
      if (idPhongTuUrl && typeof api.layPhongTheoId === "function") {
        raw = await api.layPhongTheoId(idPhongTuUrl, lichParams || undefined);
      } else if (typeof api.layDanhSachPhong === "function") {
        const thamSoDs = lichParams ? { ...lichParams } : {};
        if (filterBuilding) thamSoDs.building = filterBuilding;
        const ds = await api.layDanhSachPhong(Object.keys(thamSoDs).length ? thamSoDs : undefined);
        raw = ds.find((r) => String(r.roomCode || r.room_code || "").trim() === roomCode);
      }

      let fromApi = mapRoomApiToProfile(raw);
      const lichRow = filterDate || filterShift ? raw : raw;
      const { profile: profileLich, showTeacherClass } = apDungLopGvTuLich(
        fromApi || getRoomProfile(roomCode),
        lichRow,
      );
      let summary = null;
      try {
        const idPhong = idPhongTuUrl || raw?.id || "";
        if (idPhong && typeof api.layTongHopTaiSanTheoPhong === "function") {
          summary = await api.layTongHopTaiSanTheoPhong(idPhong);
        }
      } catch (e) {
        console.warn("[Phòng] Tổng hợp tài sản theo phòng API:", e);
      }
      applyRoomDetail(profileLich, summary, { showTeacherClass });
    } catch (e) {
      console.warn("[Phòng] Chi tiết API:", e);
      applyRoomDetail(getRoomProfile(roomCode));
    }
  })();
})();
