# MySQL

Schema: [`schema.sql`](schema.sql) — tạo database, bảng, seed `users` / `categories` / `rooms` / `assets` (409 dòng `BF-*` backfill theo phòng) / `requests`, **RBAC menu + phân quyền** (nguồn duy nhất, không seed từ Java).

Thời khóa biểu: [`seed_tkb.sql`](seed_tkb.sql) — 2353 slot HK1/HK2 2025-2026 + cập nhật `rooms` (lớp, giáo viên). **Không cần file Excel** trên máy mới nếu dùng seed này.

Không seed: `asset_transfers`.

## Import thủ công

```bash
mysql -u root -p --default-character-set=utf8mb4 < database/mysql/schema.sql
mysql -u root -p --default-character-set=utf8mb4 < database/mysql/seed_tkb.sql
```

Windows + Docker (giữ đúng UTF-8 tiếng Việt):

```powershell
docker exec facility-mysql bash -c "mysql -uroot -p1234567891 --default-character-set=utf8mb4 < /docker-entrypoint-initdb.d/01_schema.sql"
docker exec facility-mysql bash -c "mysql -uroot -p1234567891 --default-character-set=utf8mb4 < /docker-entrypoint-initdb.d/02_seed_tkb.sql"
```

File lưu UTF-8. Tránh pipe `Get-Content ... | mysql` trên PowerShell — dễ làm hỏng dấu tiếng Việt.

## Docker Compose

Service `mysql` mount:

- `01_schema.sql` — schema + seed cơ bản
- `02_seed_tkb.sql` — thời khóa biểu

Chạy tự động khi volume MySQL còn trống (`docker compose up -d` trên máy mới → có TKB luôn).

**Lưu ý:** `schema.sql` có `DROP DATABASE IF EXISTS asset_management` — chỉ dùng cho dev / reset DB. Muốn áp schema mới: xóa volume MySQL hoặc import tay lại.

## Cập nhật TKB học kỳ mới

Sửa trực tiếp [`seed_tkb.sql`](seed_tkb.sql) (bảng `room_usage_slots` + `UPDATE rooms` ở cuối file), rồi import lại hoặc commit vào Git.
