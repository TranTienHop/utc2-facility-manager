/**
 * Trang profile/users-add.html — chỉ thêm user mới.
 */
(function usersAddPageScope() {
  const userFormSubmitBtn = document.getElementById("userFormSubmitBtn");
  const userUsernameInput = document.getElementById("userUsernameInput");
  const userPasswordInput = document.getElementById("userPasswordInput");
  const userFullnameInput = document.getElementById("userFullnameInput");
  const userAddressInput = document.getElementById("userAddressInput");
  const userPhoneInput = document.getElementById("userPhoneInput");
  const userRoleInput = document.getElementById("userRoleInput");

  userFormSubmitBtn?.addEventListener("click", () => {
    if (!userUsernameInput || !userFullnameInput || !userRoleInput) return;

    const password = userPasswordInput?.value?.trim() || "";
    if (!userUsernameInput.value.trim()) {
      window.alert("Vui lòng nhập tài khoản.");
      return;
    }
    if (!password || password.length < 6) {
      window.alert("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    void (async () => {
      try {
        const api = window.CoSoApi || window.FmApi;
        const fileInput = document.getElementById("avatarInput");
        const hasFile = fileInput?.files?.length > 0;
        if (hasFile && api?.taoNguoiDungMultipart) {
          const fd = new FormData();
          fd.append("username", userUsernameInput.value.trim());
          fd.append("password", password);
          fd.append("fullName", userFullnameInput.value.trim());
          fd.append("address", userAddressInput?.value.trim() || "");
          fd.append("phoneNumber", userPhoneInput?.value.trim() || "");
          fd.append("role", userRoleInput.value.trim());
          fd.append("avatar", fileInput.files[0]);
          await api.taoNguoiDungMultipart(fd);
        } else if (api?.taoNguoiDung) {
          await api.taoNguoiDung({
            username: userUsernameInput.value.trim(),
            password,
            fullName: userFullnameInput.value.trim(),
            address: userAddressInput?.value.trim() || "",
            phoneNumber: userPhoneInput?.value.trim() || "",
            role: userRoleInput.value.trim(),
          });
        } else {
          throw new Error("API thêm user chưa sẵn sàng");
        }
      } catch (e) {
        console.warn("[User] Thêm API:", e);
        window.alert("Thêm user thất bại.");
        return;
      }

      try {
        sessionStorage.setItem("usersListNeedsReload", "1");
      } catch (_) {
        /* ignore */
      }

      window.alert("Thêm user thành công!");
      window.location.href = "/pages/profile/users.html";
    })();
  });

  document.getElementById("userFormExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const form = document.getElementById("userForm");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    Fm.download(`user-form-export-${stamp}.json`, {
      exportedAt: new Date().toISOString(),
      form: Fm.formToPlainObject(form),
    });
  });
})();
