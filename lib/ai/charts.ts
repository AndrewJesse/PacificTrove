export type ChartSeries = {
  data: number[];
  name: string;
};

export type ChartSpec = {
  series: ChartSeries[];
  title: string;
  type: "bar" | "line";
  unit?: string;
  x: string[];
};

const fencePattern = /```chart\s*([\s\S]*?)```/g;

export function splitChartReply(text: string) {
  const parts: Array<{
    chart?: ChartSpec;
    text?: string;
    type: "chart" | "text";
  }> = [];
  let cursor = 0;
  for (const match of text.matchAll(fencePattern)) {
    const index = match.index ?? 0;
    const before = text.slice(cursor, index);
    if (before.trim()) {
      parts.push({ text: before, type: "text" });
    }
    const chart = parseChart(match[1] ?? "");
    if (chart) {
      parts.push({ chart, type: "chart" });
    }
    cursor = index + match[0].length;
  }
  const rest = text.slice(cursor);
  if (rest.trim()) {
    parts.push({ text: rest, type: "text" });
  }
  if (parts.length === 0) {
    parts.push({ text, type: "text" });
  }
  return parts;
}

export function parseChart(raw: string): ChartSpec | null {
  try {
    const value = JSON.parse(raw) as Partial<ChartSpec>;
    if (value.type !== "bar" && value.type !== "line") {
      return null;
    }
    if (!Array.isArray(value.x) || value.x.length === 0) {
      return null;
    }
    if (!Array.isArray(value.series) || value.series.length === 0) {
      return null;
    }
    const x = value.x.map((item) => String(item));
    const series = value.series
      .filter((item) => item && Array.isArray(item.data) && item.name)
      .map((item) => ({
        data: item.data.map((point) => Number(point)).slice(0, x.length),
        name: String(item.name),
      }))
      .filter((item) => item.data.some((point) => Number.isFinite(point)));
    if (series.length === 0) {
      return null;
    }
    return {
      series,
      title: String(value.title ?? "Chart"),
      type: value.type,
      unit: value.unit ? String(value.unit) : undefined,
      x,
    };
  } catch {
    return null;
  }
}
