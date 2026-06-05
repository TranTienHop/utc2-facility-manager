/**
 * Trang dashboard/room-add.html
 */
(function roomAddPageScope() {
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
  const form = document.getElementById("roomAddForm");
  const params = new URLSearchParams(window.location.search);
  let building = params.get("building");
  if (!building) {
    try {
      building = sessionStorage.getItem("departmentsActiveBuilding");
    } catch (_) {
      building = null;
    }
  }
  if (!building) building = "E1";
  try {
    sessionStorage.setItem("departmentsActiveBuilding", building);
  } catch (_) {}
  const hidden = document.getElementById("roomTargetBuilding");
  if (hidden) hidden.value = building;
  const addLbl = document.getElementById("roomAddBuildingLabel");
  if (addLbl) addLbl.textContent = `Tòa nhà ${building}`;
  if (form) {
    fillK65ClassSelects(form);
    form.addEventListener("input", () => form.classList.remove("submitted"));
    form.addEventListener("change", () => form.classList.remove("submitted"));
  }
  // Khóa nhập tay số lượng thiết bị ở màn thêm phòng.
  [
    "roomDesksInput",
    "roomChairsInput",
    "roomSpeakersInput",
    "roomAirConditionerInput",
    "roomMicrophoneInput",
    "roomCeilingFanInput",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el instanceof HTMLInputElement) {
      el.readOnly = true;
      el.value = "0";
      el.title = "Được tổng hợp tự động từ Quản lý tài sản";
    }
  });
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("submitted");
      form.reportValidity();
      return;
    }
    const roomCode = document.getElementById("roomCodeInput")?.value.trim() || "";
    const className = document.getElementById("roomClassUsingInput")?.value.trim() || "";
    const classStudying = document.getElementById("roomClassInput")?.value.trim() || "";
    const floor = document.getElementById("roomFloorInput")?.value.trim() || "";
    const capacity = document.getElementById("roomCapacityInput")?.value.trim() || "";
    const status = getRadioValueByName("roomStatus");
    if (isRoomCodeTakenInBuilding(building, roomCode)) {
      window.alert("Mã phòng này đã có trong tòa đã chọn. Vui lòng nhập mã khác.");
      return;
    }
    setRoomUpdate(roomCode, {
      buildingCode: building,
      className,
      classStudying,
      floor,
      capacity,
      status,
      teacher: document.getElementById("roomTeacherInput")?.value.trim() || "",
      desks: document.getElementById("roomDesksInput")?.value.trim() || "",
      chairs: document.getElementById("roomChairsInput")?.value.trim() || "",
      speakers: document.getElementById("roomSpeakersInput")?.value.trim() || "",
      airConditioner: document.getElementById("roomAirConditionerInput")?.value.trim() || "",
      microphone: document.getElementById("roomMicrophoneInput")?.value.trim() || "",
      glassDoor: getRadioValueByName("roomGlassDoor"),
      ceilingFan: document.getElementById("roomCeilingFanInput")?.value.trim() || "",
      curtain: getRadioValueByName("roomCurtain"),
    });
    addRoomRowToBuilding(building, [roomCode, floor, className, "-", status, capacity]);
    const jsonPhong = {
      buildingCode: building,
      roomCode,
      floor: Number(floor) || 0,
      classUsing: className,
      capacity: Number(capacity) || 0,
      status,
      teacherName: document.getElementById("roomTeacherInput")?.value.trim() || "",
      classStudying,
      glassDoorStatus: getRadioValueByName("roomGlassDoor"),
      curtainStatus: getRadioValueByName("roomCurtain"),
    };
    void (async () => {
      try {
        if (window.CoSoApi?.taoPhong) await window.CoSoApi.taoPhong(jsonPhong);
      } catch (e) {
        console.warn("[Phòng] Thêm API:", e);
      }
    })();
    window.alert("Thêm phòng thành công!");
    window.location.href = "../dashboard/departments.html";
  });
})();
