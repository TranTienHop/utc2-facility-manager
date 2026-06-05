/**
 * Trang profile/contact-profile.html
 */
(function contactProfilePageScope() {

  const profileName = document.getElementById("profileName");
  const profileRole = document.getElementById("profileRole");
  const profilePhone = document.getElementById("profilePhone");
  const profileEmail = document.getElementById("profileEmail");
  const profileAddress = document.getElementById("profileAddress");
  const profileAvatarImage = document.getElementById("profileAvatarImage");
  const backToPreviousPageBtn = document.getElementById("backToPreviousPageBtn");

  const roleLabel = (role) => {
    const r = String(role || "").trim();
    if (!r) return "—";
    const map = {
      ADMIN: "Administrator",
      MANAGER: "Quản lý",
      STAFF: "Cán bộ quản lý tài sản",
      STUDENT: "Sinh viên",
    };
    return map[r.toUpperCase()] || r;
  };

  const emailFromUsername = (username) => {
    const name = String(username || "").trim();
    if (!name) return "—";
    return name.includes("@") ? name : `${name}@hotmail.com`;
  };

  const dienTuTrong = () => {
    if (profileName) profileName.textContent = "—";
    if (profileRole) profileRole.textContent = "—";
    if (profilePhone) profilePhone.textContent = "—";
    if (profileEmail) profileEmail.textContent = "—";
    if (profileAddress) profileAddress.textContent = "—";
    if (profileAvatarImage) {
      profileAvatarImage.src = "/assets/images/avatar/avatar_1.jpg";
      profileAvatarImage.alt = "avatar";
    }
  };

  const dienTuApi = (u) => {
    if (!u) return;
    const fullName = u.fullName || u.fullname || u.username || "—";
    const av =
      window.UserAvatar && typeof window.UserAvatar.resolve === "function"
        ? window.UserAvatar.resolve(u)
        : "/assets/images/avatar/avatar_1.jpg";
    if (profileName) profileName.textContent = String(fullName).toUpperCase();
    if (profileRole) profileRole.textContent = roleLabel(u.role);
    if (profilePhone) profilePhone.textContent = u.phoneNumber || u.phone_number || "—";
    if (profileEmail) profileEmail.textContent = emailFromUsername(u.username);
    if (profileAddress) profileAddress.textContent = u.address || "—";
    if (profileAvatarImage) {
      profileAvatarImage.src = av;
      profileAvatarImage.alt = `avatar ${fullName}`;
    }
  };

  const params = new URLSearchParams(window.location.search);
  const userKey = String(params.get("user") || "").trim();
  const userIdTuUrl = String(params.get("id") || "").trim();

  void (async () => {
    try {
      const api = window.FmApi || window.CoSoApi;
      if (userIdTuUrl && api?.layNguoiDungTheoId) {
        dienTuApi(await api.layNguoiDungTheoId(userIdTuUrl));
        return;
      }
      if (userKey && api?.layDanhSachNguoiDung) {
        const list = await api.layDanhSachNguoiDung();
        const found = list.find(
          (x) =>
            String(x.username || "") === userKey || String(x.id) === String(userKey).replace(/^id-/, ""),
        );
        if (found) {
          dienTuApi(found);
          return;
        }
      }
    } catch (e) {
      console.warn("[Contact profile]", e);
    }
    dienTuTrong();
  })();

  backToPreviousPageBtn?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "../profile/users.html";
  });
})();
