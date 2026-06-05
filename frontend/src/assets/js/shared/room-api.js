/**
 * Phòng theo tòa — API + cache dùng chung (departments, room-add, room-detail, …).
 */
(function roomApiScope() {
let buildingRooms = {};

/** Các tòa E chỉ 1 tầng — không lấy chữ số trong mã phòng (P2E6 ≠ tầng 2). */
const SINGLE_FLOOR_BUILDINGS = new Set(["E3", "E4", "E5", "E6", "E8", "EB8"]);

const roomRowForUi = (row) => {
  const roomCode = String(row?.[0] ?? "").trim();
  const floor = String(row?.[1] ?? "").trim();
  const classStudying = String(row?.[2] ?? "").trim();
  const teacher = String(row?.[3] ?? "").trim();
  const capacity = String(row?.[4] ?? row?.[5] ?? "").trim();
  return [roomCode, floor, classStudying || "-", teacher || "--", capacity || ""];
};

const sortRoomRowsByFloor = (rows) =>
  [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
    const fa = Number(String(a?.[1] ?? "").replace(/\D/g, "")) || 0;
    const fb = Number(String(b?.[1] ?? "").replace(/\D/g, "")) || 0;
    if (fa !== fb) return fa - fb;
    return String(a?.[0] ?? "").localeCompare(String(b?.[0] ?? ""), undefined, { numeric: true });
  });

/** Mã phòng (số thẻ) → id DB để gọi DELETE/PUT /api/rooms/{id} (dùng chung các trang) */
window.maPhongTuDinhDanh = window.maPhongTuDinhDanh || Object.create(null);

const ROOM_SLOT_OVERRIDES_KEY = "roomSlotOverrides";

const khoaGhiDePhong = (roomCode, date, shift) =>
  `${String(roomCode || "").trim()}|${String(date || "").trim()}|${String(shift || "").trim()}`;

const layBangGhiDePhong = () => {
  try {
    const raw = sessionStorage.getItem(ROOM_SLOT_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

/** Ghi nhớ lớp/GV/sức chứa vừa cập nhật — hiển thị đúng khi lọc cùng ngày + ca. */
const luuGhiDeHienThiPhong = (roomCode, date, shift, payload) => {
  const ngay = String(date || "").trim();
  const ca = String(shift || "").trim();
  const ma = String(roomCode || "").trim();
  if (!ma || !ngay || !ca) return;
  const all = layBangGhiDePhong();
  all[khoaGhiDePhong(ma, ngay, ca)] = {
    className: String(payload?.className ?? "").trim(),
    teacher: String(payload?.teacher ?? "").trim(),
    capacity: payload?.capacity != null ? String(payload.capacity) : "",
  };
  try {
    sessionStorage.setItem(ROOM_SLOT_OVERRIDES_KEY, JSON.stringify(all));
  } catch (_) {
    /* ignore */
  }
};

const layGhiDeChoBoLoc = (roomCode, date, shift) => {
  const ngay = String(date || "").trim();
  const ca = String(shift || "").trim();
  if (!ngay || !ca) return null;
  return layBangGhiDePhong()[khoaGhiDePhong(roomCode, ngay, ca)] || null;
};

const apDungGhiDeLenHang = (hang, roomCode, date, shift) => {
  const g = layGhiDeChoBoLoc(roomCode, date, shift);
  if (!g) return hang;
  return [
    hang[0],
    hang[1],
    g.className || hang[2],
    g.teacher || hang[3],
    g.capacity !== "" && g.capacity != null ? g.capacity : hang[4],
  ];
};

const xacDinhHocKyTuNgay = (isoDate) => {
  const ref = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  const hk2Start = new Date("2026-03-02T00:00:00");
  const hk2End = new Date("2026-06-06T23:59:59");
  const hk1Start = new Date("2025-09-03T00:00:00");
  const hk1End = new Date("2026-01-10T23:59:59");
  if (ref >= hk2Start && ref <= hk2End) return "HK2-2025-2026";
  if (ref >= hk1Start && ref <= hk1End) return "HK1-2025-2026";
  return ref >= hk2Start ? "HK2-2025-2026" : "HK1-2025-2026";
};

const taiPhongTuMayChu = async (opts = {}) => {
  const api = window.FmApi || window.CoSoApi;
  if (!api || typeof api.layDanhSachPhong !== "function") {
    throw new Error("API phòng chưa sẵn sàng (thiếu api-client.js).");
  }
  try {
    const params = {};
    const isoDate = opts.date || "";
    params.semester = xacDinhHocKyTuNgay(isoDate);
    if (isoDate) params.date = isoDate;
    if (opts.shift) params.shift = opts.shift;
    const buildingCode =
      opts.building ||
      String(new URLSearchParams(window.location.search).get("building") || "").trim();
    if (buildingCode) params.building = buildingCode;
    const ds = await api.layDanhSachPhong(params);
    if (!Array.isArray(ds) || ds.length === 0) {
      const code =
        opts.building ||
        String(new URLSearchParams(window.location.search).get("building") || "").trim();
      if (code) buildingRooms[code] = [];
      return;
    }
    Object.keys(buildingRooms).forEach((k) => {
      buildingRooms[k] = [];
    });
    for (const r of ds) {
      const b = String(r.buildingCode || r.building || r.building_code || "").trim() || "KHAC";
      const code = String(r.roomCode || r.room_code || "").trim();
      if (!code) continue;
      if (r.id != null) window.maPhongTuDinhDanh[code] = String(r.id);
      if (!buildingRooms[b]) buildingRooms[b] = [];
      const coLocLich = Boolean(opts.date || opts.shift);
      const lopRaw =
        r.classStudying ||
        r.class_studying ||
        r.classUsing ||
        r.class_using ||
        "";
      const gvRaw =
        r.teacherName ||
        r.teacher_name ||
        r.teacher ||
        r.giangVien ||
        "";
      const lop =
        lopRaw && String(lopRaw).trim()
          ? String(lopRaw).trim()
          : coLocLich
            ? "Trống"
            : "-";
      const gv =
        gvRaw && String(gvRaw).trim()
          ? String(gvRaw).trim()
          : coLocLich
            ? "--"
            : "-";
      const floorUi = SINGLE_FLOOR_BUILDINGS.has(b)
        ? "1"
        : String(r.floor ?? r.tang ?? "");
      let hang = roomRowForUi([
        code,
        floorUi,
        lop,
        gv,
        String(r.capacity ?? r.sucChua ?? ""),
      ]);
      if (coLocLich && isoDate && opts.shift) {
        hang = apDungGhiDeLenHang(hang, code, isoDate, opts.shift);
      }
      buildingRooms[b].push(hang);
    }
    Object.keys(buildingRooms).forEach((k) => {
      buildingRooms[k] = sortRoomRowsByFloor(buildingRooms[k]);
    });
  } catch (err) {
    console.warn("[Phòng] Không tải được từ API:", err);
    const code =
      opts.building ||
      String(new URLSearchParams(window.location.search).get("building") || "").trim();
    if (code) buildingRooms[code] = [];
    throw err;
  }
};

const isRoomCodeTakenInBuilding = (buildingCode, roomCode) => {
  const staticRows = buildingRooms[buildingCode] || [];
  if (staticRows.some((r) => r[0] === roomCode)) return true;
  return false;
};


  window.AppRoomApi = {
    get buildingRooms() {
      return buildingRooms;
    },
    SINGLE_FLOOR_BUILDINGS,
    roomRowForUi,
    sortRoomRowsByFloor,
    xacDinhHocKyTuNgay,
    taiPhongTuMayChu,
    isRoomCodeTakenInBuilding,
    luuGhiDeHienThiPhong,
  };
})();
