"use client";

import { type ChartSpec, splitChartReply } from "@/lib/ai/charts";
import { sanitizeText } from "@/lib/utils";
import { MessageResponse } from "../ai-elements/message";

const seriesColors = ["#1C4F9C", "#1E6A46", "#C6A15B", "#8E5A3C"];

export function ReplyBody({ text }: { text: string }) {
  const parts = splitChartReply(sanitizeText(text));
  return (
    <>
      {parts.map((part) =>
        part.type === "chart" && part.chart ? (
          <ReplyChart
            chart={part.chart}
            key={`${part.chart.title}-${part.chart.x.join("-")}`}
          />
        ) : (
          <MessageResponse key={part.text?.slice(0, 48)}>
            {part.text ?? ""}
          </MessageResponse>
        )
      )}
    </>
  );
}

function ReplyChart({ chart }: { chart: ChartSpec }) {
  const width = 640;
  const height = 280;
  const pad = { bottom: 36, left: 44, right: 16, top: chart.unit ? 28 : 16 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const values = chart.series.flatMap((series) =>
    series.data.filter((value) => Number.isFinite(value))
  );
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const y = (value: number) =>
    pad.top + plotHeight - ((value - min) / span) * plotHeight;

  return (
    <figure className="my-3 w-full max-w-[640px] rounded-xl border border-border/40 bg-card px-3 py-3">
      <figcaption className="px-1 pb-2">
        <div className="font-medium text-[13px]">{chart.title}</div>
        {chart.unit ? (
          <div className="text-[11px] text-muted-foreground">{chart.unit}</div>
        ) : null}
      </figcaption>
      <svg
        aria-label={chart.title}
        className="h-auto w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0, 0.5, 1].map((step) => {
          const value = min + span * step;
          const yPos = y(value);
          return (
            <g key={step}>
              <line
                stroke="currentColor"
                strokeOpacity="0.12"
                x1={pad.left}
                x2={width - pad.right}
                y1={yPos}
                y2={yPos}
              />
              <text
                fill="currentColor"
                fontSize="11"
                opacity="0.55"
                textAnchor="end"
                x={pad.left - 8}
                y={yPos + 4}
              >
                {formatTick(value)}
              </text>
            </g>
          );
        })}
        {chart.type === "line"
          ? chart.series.map((series, seriesIndex) => {
              const points = chart.x
                .map((_label, index) => {
                  const value = series.data[index];
                  if (!Number.isFinite(value)) {
                    return null;
                  }
                  const xPos =
                    pad.left +
                    (chart.x.length === 1
                      ? plotWidth / 2
                      : (index / (chart.x.length - 1)) * plotWidth);
                  return `${xPos},${y(value)}`;
                })
                .filter(Boolean)
                .join(" ");
              return (
                <polyline
                  fill="none"
                  key={series.name}
                  points={points}
                  stroke={seriesColors[seriesIndex % seriesColors.length]}
                  strokeWidth="2.5"
                />
              );
            })
          : chart.x.map((label, index) => {
              const groupWidth = plotWidth / chart.x.length;
              const barWidth = Math.min(
                28,
                (groupWidth * 0.7) / chart.series.length
              );
              const groupStart =
                pad.left +
                index * groupWidth +
                (groupWidth - barWidth * chart.series.length) / 2;
              return chart.series.map((series, seriesIndex) => {
                const value = series.data[index];
                if (!Number.isFinite(value)) {
                  return null;
                }
                const yPos = y(Math.max(value, min));
                const barHeight = Math.max(0, y(min) - yPos);
                return (
                  <rect
                    fill={seriesColors[seriesIndex % seriesColors.length]}
                    height={barHeight}
                    key={`${label}-${series.name}`}
                    rx="2"
                    width={barWidth - 2}
                    x={groupStart + seriesIndex * barWidth}
                    y={yPos}
                  />
                );
              });
            })}
        {chart.x.map((label, index) => {
          const xPos =
            pad.left +
            (chart.x.length === 1
              ? plotWidth / 2
              : chart.type === "line"
                ? (index / (chart.x.length - 1)) * plotWidth
                : ((index + 0.5) / chart.x.length) * plotWidth);
          return (
            <text
              fill="currentColor"
              fontSize="11"
              key={label}
              opacity="0.7"
              textAnchor="middle"
              x={xPos}
              y={height - 12}
            >
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 px-1 pt-1 text-[11px] text-muted-foreground">
        {chart.series.map((series, index) => (
          <span className="inline-flex items-center gap-1.5" key={series.name}>
            <span
              className="inline-block size-2 rounded-full"
              style={{
                background: seriesColors[index % seriesColors.length],
              }}
            />
            {series.name}
          </span>
        ))}
      </div>
    </figure>
  );
}

function formatTick(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 100) / 10}k`;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
