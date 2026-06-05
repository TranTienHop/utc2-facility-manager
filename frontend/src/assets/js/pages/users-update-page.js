/**
 * Trang profile/users-update.html — chỉ cập nhật user (bắt buộc ?id=).
 */
(function usersUpdatePageScope() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id") || "";

  const userUsernameInput = document.getElementById("userUsernameInput");
  const userPasswordInput = document.getElementById("userPasswordInput");
  const userFullnameInput = document.getElementById("userFullnameInput");
  const userAddressInput = document.getElementById("userAddressInput");
  const userPhoneInput = document.getElementById("userPhoneInput");
  const userRoleInput = document.getElementById("userRoleInput");
  const avatarImage = document.getElementById("avatarImage");
  const avatarPlaceholder = document.getElementById("avatarPlaceholder");
  const userFormSubmitBtn = document.getElementById("userFormSubmitBtn");

  if (!userId) {
    window.alert("Không xác định được user cần cập nhật.");
    window.location.href = "/pages/profile/users.html";
    return;
  }

  let snapshotUsername = "";

  const ensureRoleOption = (role) => {
    if (!userRoleInput || !role) return;
    if ([...userRoleInput.options].some((o) => o.value === role)) {
      userRoleInput.value = role;
      return;
    }
    const opt = document.createElement("option");
    opt.value = role;
    opt.textContent = role;
    userRoleInput.appendChild(opt);
    userRoleInput.value = role;
  };

  const dienFormNguoiDung = (u) => {
    if (!u) return;
    const username = u.username || "";
    snapshotUsername = username;
    if (userUsernameInput) userUsernameInput.value = username;
    if (userPasswordInput) userPasswordInput.value = "";
    if (userPasswordInput) userPasswordInput.placeholder = "Để trống nếu không đổi";
    if (userFullnameInput) userFullnameInput.value = u.fullName || u.fullname || "";
    if (userAddressInput) userAddressInput.value = u.address || "";
    if (userPhoneInput) userPhoneInput.value = u.phoneNumber || u.phone_number || "";
    ensureRoleOption(u.role || "");
    const avatarUrl =
      window.UserAvatar?.resolve?.(u) ||
      u.avatarUrl ||
      u.avatar_url ||
      "/assets/images/avatar/avatar_1.jpg";
    if (avatarImage && avatarPlaceholder) {
      avatarImage.src = avatarUrl;
      avatarImage.style.display = "block";
      avatarPlaceholder.style.display = "none";
    }
  };

  void (async () => {
    const api = window.CoSoApi || window.FmApi;
    if (!api?.layNguoiDungTheoId) return;
    try {
      const u = await api.layNguoiDungTheoId(userId);
      dienFormNguoiDung(u);
    } catch (e) {
      console.warn("[User] GET theo id:", e);
      window.alert("Không tải được thông tin user.");
      window.location.href = "/pages/profile/users.html";
    }
  })();

  userFormSubmitBtn?.addEventListener("click", () => {
    if (!userFullnameInput || !userRoleInput) return;
    const password = userPasswordInput?.value?.trim() || "";
    if (password && password.length < 6) {
      window.alert("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    const payload = {
      userKey: snapshotUsername || userUsernameInput?.value?.trim() || "",
      username: snapshotUsername || userUsernameInput?.value?.trim() || "",
      fullname: userFullnameInput.value.trim(),
      role: userRoleInput.value.trim(),
      avatar: avatarImage?.src || "",
    };

    void (async () => {
      try {
        const api = window.CoSoApi || window.FmApi;
        const fileInput = document.getElementById("avatarInput");
        const hasFile = fileInput?.files?.length > 0;
        if (hasFile && api?.capNhatNguoiDungMultipart) {
          const fd = new FormData();
          if (password) fd.append("password", password);
          fd.append("fullName", userFullnameInput.value.trim());
          fd.append("address", userAddressInput?.value.trim() || "");
          fd.append("phoneNumber", userPhoneInput?.value.trim() || "");
          fd.append("role", userRoleInput.value.trim());
          fd.append("avatar", fileInput.files[0]);
          await api.capNhatNguoiDungMultipart(String(userId), fd);
        } else if (api?.capNhatNguoiDung) {
          const body = {
            fullName: userFullnameInput.value.trim(),
            address: userAddressInput?.value.trim() || "",
            phoneNumber: userPhoneInput?.value.trim() || "",
            role: userRoleInput.value.trim(),
          };
          if (password) body.password = password;
          await api.capNhatNguoiDung(String(userId), body);
        } else {
          throw new Error("API cập nhật user chưa sẵn sàng");
        }
      } catch (e) {
        console.warn("[User] Cập nhật API:", e);
        window.alert("Cập nhật user thất bại.");
        return;
      }

      try {
        sessionStorage.setItem("pendingUserUpdate", JSON.stringify(payload));
        sessionStorage.setItem("usersListNeedsReload", "1");
      } catch (_) {
        /* ignore */
      }

      window.alert("Cập nhật user thành công!");
      window.location.href = "/pages/profile/users.html";
    })();
  });
})();
