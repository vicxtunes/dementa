"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

// ApexCharts touches `window` at import time — load it client-only.
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div style={{ minHeight: 120 }} />,
});

const FONT = "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif";
const FOREST = "#072F1F";
const LIME = "#B4F105";
const ORANGE = "#F97316";
const MUTED = "#6C7E75";
const GRID = "#E9EFEF";

/** Grouped vertical bar chart (Spark "Revenue" card). */
export function BarChart({
  categories,
  series,
  height = 260,
}: {
  categories: string[];
  series: { name: string; data: number[] }[];
  height?: number;
}) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: FONT,
    },
    colors: [FOREST, LIME],
    states: { hover: { filter: { type: "none" } } },
    plotOptions: { bar: { horizontal: false, columnWidth: "48%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    legend: { show: false },
    grid: {
      borderColor: GRID,
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      labels: { style: { colors: MUTED, fontSize: "11px", fontWeight: 500 } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: MUTED, fontSize: "11px" } } },
    fill: { opacity: 1 },
    tooltip: { theme: "dark" },
  };
  return <ReactApexChart type="bar" options={options} series={series} height={height} />;
}

/** Donut chart with centred total (Spark "Total View Performance" card). */
export function DonutChart({
  labels,
  series,
  totalLabel = "Total",
  height = 250,
}: {
  labels: string[];
  series: number[];
  totalLabel?: string;
  height?: number;
}) {
  const total = series.reduce((a, b) => a + b, 0);
  const options: ApexOptions = {
    chart: { type: "donut", height, fontFamily: FONT },
    labels,
    colors: [LIME, FOREST, ORANGE],
    states: { hover: { filter: { type: "none" } } },
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["#fff"] },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: { show: true, fontSize: "12px", fontWeight: 500, color: MUTED, offsetY: -8 },
            value: {
              show: true,
              fontSize: "26px",
              fontWeight: 800,
              color: "#0B130F",
              offsetY: 8,
              formatter: (val: string) => `${val}`,
            },
            total: {
              show: true,
              label: totalLabel,
              fontSize: "11px",
              fontWeight: 500,
              color: MUTED,
              formatter: () => `${total}`,
            },
          },
        },
      },
    },
    tooltip: { theme: "dark" },
  };
  return <ReactApexChart type="donut" options={options} series={series} height={height} />;
}

/** Tiny area sparkline for a stat card footer. */
export function Sparkline({
  data,
  color = "up",
  height = 45,
}: {
  data: number[];
  color?: "up" | "down";
  height?: number;
}) {
  const options: ApexOptions = {
    chart: { type: "area", height, sparkline: { enabled: true }, fontFamily: FONT },
    stroke: { curve: "smooth", width: 2 },
    fill: { opacity: 0.12, type: "solid" },
    colors: [color === "up" ? "#22C55E" : "#EF4444"],
    tooltip: {
      fixed: { enabled: false },
      x: { show: false },
      y: { title: { formatter: () => "" } },
      marker: { show: false },
    },
  };
  return (
    <ReactApexChart
      type="area"
      options={options}
      series={[{ name: "", data }]}
      height={height}
    />
  );
}
