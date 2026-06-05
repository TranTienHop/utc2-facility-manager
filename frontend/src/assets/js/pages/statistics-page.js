/**
 * Trang dashboard/statistics.html
 */
(function statisticsPageScope() {

  const statisticsKpiTotalQty = document.getElementById("statisticsKpiTotalQty");
  const statisticsKpiInUse = document.getElementById("statisticsKpiInUse");
  const statisticsKpiLiquidated = document.getElementById("statisticsKpiLiquidated");
  const statisticsSummaryBody = document.getElementById("statisticsSummaryBody");
  const statisticsStatusMessage = document.getElementById("statisticsStatusMessage");

  const statT = (key, fallback) => {
    const plain = window.FmI18n?.tPlain?.(key);
    if (plain != null && plain !== key) return plain;
    const v = window.FmI18n?.t?.(key);
    if (!v || v === key) return fallback;
    return window.FmI18n?.plainText?.(v) ?? String(v).replace(/<rt[^>]*>[\s\S]*?<\/rt>/gi, "").replace(/<[^>]+>/g, "");
  };

  const mapStatusCode = (raw) => String(raw || "IN_USE").trim().toUpperCase();

  const buildingLabel = (a) => {
    const b = a.building || a.buildingName || a.building_code || "";
    const s = String(b).trim();
    return s || statT("statistics.buildingUnknown", "Khác");
  };

  const chuanHoaMaToa = (raw) =>
    String(raw || "")
      .trim()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toUpperCase();

  /** Loại KHAC và tài sản không xác định tòa khỏi thống kê. */
  const isExcludedBuildingKey = (buildingKey) => {
    const s = String(buildingKey || "").trim();
    if (!s) return true;
    if (chuanHoaMaToa(s) === "KHAC") return true;
    const unknown = statT("statistics.buildingUnknown", "Khác");
    if (s === unknown || /^kh[aá]c$/i.test(s)) return true;
    return false;
  };

  const layHangThongKe = () => allRows.filter((r) => !isExcludedBuildingKey(r.buildingKey));

  const isInUseStatus = (code) => code === "IN_USE" || code === "ACTIVE";
  const isLiquidatedStatus = (code) => code === "LIQUIDATED";

  const soLuongTaiSan = (a) => {
    const n = Number(a.quantity);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  const chuanHoaTaiSan = (list) =>
    (Array.isArray(list) ? list : []).map((a) => {
      const statusCode = mapStatusCode(a.status);
      return {
        buildingKey: buildingLabel(a),
        statusCode,
        quantity: soLuongTaiSan(a),
      };
    });

  let allRows = [];
  let buildingChart = null;
  let statusChart = null;

  const statisticsChartBuilding = document.getElementById("statisticsChartBuilding");
  const statisticsChartStatus = document.getElementById("statisticsChartStatus");
  const statisticsChartBuildingEmpty = document.getElementById("statisticsChartBuildingEmpty");
  const statisticsChartStatusEmpty = document.getElementById("statisticsChartStatusEmpty");
  const statisticsSummaryFoot = document.getElementById("statisticsSummaryFoot");
  const statisticsTotalQty = document.getElementById("statisticsTotalQty");
  const statisticsTotalInUse = document.getElementById("statisticsTotalInUse");

  const STAT_CHART_PRIMARY = "#4a6fe3";
  const STAT_CHART_IN_USE = "#22a06b";
  const STAT_CHART_PENDING = "#00c9c8";
  const STAT_CHART_LIQUIDATED = "#8b2fc9";

  const destroyCharts = () => {
    buildingChart?.destroy();
    statusChart?.destroy();
    buildingChart = null;
    statusChart = null;
  };

  const barValuePlugin = {
    id: "statisticsBarValues",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data?.length) return;
      ctx.save();
      ctx.fillStyle = "#4a4a6a";
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      meta.data.forEach((bar, index) => {
        const value = chart.data.datasets[0].data[index];
        if (value == null) return;
        ctx.fillText(String(value), bar.x, bar.y - 6);
      });
      ctx.restore();
    },
  };

  const donutLegendLabels = (chart, labels, values) => {
    const total = values.reduce((sum, v) => sum + v, 0);
    const { data } = chart;
    return labels.map((label, i) => {
      const value = values[i];
      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
      const box = data.datasets[0].backgroundColor[i];
      return {
        text: `${label} (${value}) — ${pct}%`,
        fillStyle: box,
        strokeStyle: box,
        lineWidth: 0,
        hidden: false,
        index: i,
      };
    });
  };

  const setChartEmpty = (canvas, emptyEl, isEmpty) => {
    if (emptyEl) {
      emptyEl.classList.toggle("is-visible", isEmpty);
      emptyEl.hidden = isEmpty;
      if (isEmpty) {
        emptyEl.textContent = statT("statistics.emptySummary", "Không có dữ liệu.");
      }
    }
    if (canvas) {
      canvas.hidden = false;
      canvas.style.visibility = isEmpty ? "hidden" : "visible";
    }
  };

  const renderBuildingChart = (groups) => {
    if (typeof Chart === "undefined" || !statisticsChartBuilding) return;
    buildingChart?.destroy();
    buildingChart = null;
    if (!groups.length) {
      setChartEmpty(statisticsChartBuilding, statisticsChartBuildingEmpty, true);
      return;
    }
    setChartEmpty(statisticsChartBuilding, statisticsChartBuildingEmpty, false);
    const labels = groups.map((g) => g.building);
    const values = groups.map((g) => g.quantity);
    buildingChart = new Chart(statisticsChartBuilding, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: STAT_CHART_PRIMARY,
            borderRadius: 4,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} ${statT("statistics.unitPieces", "(cái)")}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#4a4a6a", font: { weight: "600" } },
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: "rgba(0,0,0,0.06)" },
          },
        },
      },
      plugins: [barValuePlugin],
    });
  };

  const gopTheoTrangThai = (rows) => {
    let inUseQty = 0;
    let pendingQty = 0;
    let liquidatedQty = 0;
    for (const r of rows) {
      if (isLiquidatedStatus(r.statusCode)) liquidatedQty += r.quantity;
      else if (isInUseStatus(r.statusCode)) inUseQty += r.quantity;
      else pendingQty += r.quantity;
    }
    return { inUseQty, pendingQty, liquidatedQty };
  };

  const renderStatusChart = (rows) => {
    if (typeof Chart === "undefined" || !statisticsChartStatus) return;
    statusChart?.destroy();
    statusChart = null;
    const { inUseQty, pendingQty, liquidatedQty } = gopTheoTrangThai(rows);
    const values = [inUseQty, pendingQty, liquidatedQty];
    const total = values.reduce((a, b) => a + b, 0);
    if (!total) {
      setChartEmpty(statisticsChartStatus, statisticsChartStatusEmpty, true);
      return;
    }
    setChartEmpty(statisticsChartStatus, statisticsChartStatusEmpty, false);
    const labels = [
      statT("statistics.statusInUse", "Đang sử dụng"),
      statT("statistics.statusPending", "Chờ xử lý"),
      statT("statistics.statusLiquidated", "Thanh lý"),
    ];
    const colors = [STAT_CHART_IN_USE, STAT_CHART_PENDING, STAT_CHART_LIQUIDATED];
    statusChart = new Chart(statisticsChartStatus, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 14,
              padding: 14,
              color: "#333",
              font: { size: 12 },
              generateLabels: (chart) => donutLegendLabels(chart, labels, values),
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed;
                const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                return `${ctx.label}: ${v} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  };

  const setStatusMessage = (text, isError = false) => {
    if (!statisticsStatusMessage) return;
    if (!text) {
      statisticsStatusMessage.hidden = true;
      statisticsStatusMessage.textContent = "";
      statisticsStatusMessage.classList.remove("is-error");
      return;
    }
    statisticsStatusMessage.hidden = false;
    statisticsStatusMessage.textContent = text;
    statisticsStatusMessage.classList.toggle("is-error", isError);
  };

  const tinhKpi = (rows) => {
    let totalQty = 0;
    let inUseQty = 0;
    let liquidatedQty = 0;
    for (const r of rows) {
      totalQty += r.quantity;
      if (isInUseStatus(r.statusCode)) inUseQty += r.quantity;
      if (isLiquidatedStatus(r.statusCode)) liquidatedQty += r.quantity;
    }
    return { totalQty, inUseQty, liquidatedQty };
  };

  const gopTheoToa = (rows) => {
    const map = new Map();
    for (const r of rows) {
      const cur = map.get(r.buildingKey) || { quantity: 0, inUseQty: 0 };
      cur.quantity += r.quantity;
      if (isInUseStatus(r.statusCode)) cur.inUseQty += r.quantity;
      map.set(r.buildingKey, cur);
    }
    return Array.from(map.entries())
      .map(([building, agg]) => ({ building, ...agg }))
      .sort((a, b) => a.building.localeCompare(b.building, "vi"));
  };

  const render = () => {
    const rows = layHangThongKe();
    const kpi = tinhKpi(rows);
    const groups = gopTheoToa(rows);

    if (statisticsKpiTotalQty) statisticsKpiTotalQty.textContent = String(kpi.totalQty);
    if (statisticsKpiInUse) statisticsKpiInUse.textContent = String(kpi.inUseQty);
    if (statisticsKpiLiquidated) statisticsKpiLiquidated.textContent = String(kpi.liquidatedQty);

    renderBuildingChart(groups);
    renderStatusChart(rows);

    if (!statisticsSummaryBody) return;
    if (!groups.length) {
      statisticsSummaryBody.innerHTML = `<tr><td colspan="3" class="statistics-placeholder">${statT("statistics.emptySummary", "Không có dữ liệu.")}</td></tr>`;
      if (statisticsSummaryFoot) statisticsSummaryFoot.hidden = true;
      return;
    }
    const escHtml = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    statisticsSummaryBody.innerHTML = groups
      .map(
        (g) =>
          `<tr><td>${escHtml(g.building)}</td><td>${g.quantity}</td><td>${g.inUseQty}</td></tr>`
      )
      .join("");
    if (statisticsSummaryFoot) statisticsSummaryFoot.hidden = false;
    if (statisticsTotalQty) statisticsTotalQty.textContent = String(kpi.totalQty);
    if (statisticsTotalInUse) statisticsTotalInUse.textContent = String(kpi.inUseQty);
    window.FmI18n?.apply?.(statisticsSummaryFoot || document);
  };

  const taiThongKe = async () => {
    setStatusMessage("");
    destroyCharts();
    setChartEmpty(statisticsChartBuilding, statisticsChartBuildingEmpty, true);
    setChartEmpty(statisticsChartStatus, statisticsChartStatusEmpty, true);
    if (statisticsSummaryBody) {
      statisticsSummaryBody.innerHTML = `<tr><td colspan="3" class="statistics-placeholder">${statT("statistics.loading", "Đang tải…")}</td></tr>`;
    }
    if (statisticsSummaryFoot) statisticsSummaryFoot.hidden = true;
    const api = window.FmApi || window.CoSoApi;
    if (!api?.layDanhSachTaiSan) {
      setStatusMessage(statT("statistics.loadError", "Không tải được dữ liệu tài sản."), true);
      return;
    }
    try {
      const list = await api.layDanhSachTaiSan();
      allRows = chuanHoaTaiSan(list);
      render();
    } catch (err) {
      console.warn("[Thống kê] Lỗi API:", err);
      setStatusMessage(statT("statistics.loadError", "Không tải được dữ liệu tài sản."), true);
      if (statisticsSummaryBody) {
        statisticsSummaryBody.innerHTML = `<tr><td colspan="3" class="statistics-placeholder">—</td></tr>`;
      }
    }
  };

  void taiThongKe();

  window.addEventListener("fm-i18n-applied", () => {
    window.FmI18n?.apply?.(document.querySelector("main.content") || document);
    render();
  });
})();
