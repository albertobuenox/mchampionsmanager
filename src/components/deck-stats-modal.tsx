"use client";

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  RESOURCE_META,
  computeDeckStats,
  type DeckChecklistItem,
  type DeckFlag,
  type StatsCard,
} from "@/lib/deck-stats";

function niceMax(n: number, step = 3) {
  if (n <= 0) return step;
  return Math.ceil(n / step) * step;
}

/** Soften a hex color toward a pale paper tone (inactive Highcharts style). */
function muteColor(hex: string, amount = 0.72) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return "#d9d3c8";
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (232 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

type Tip = {
  title: string;
  rows: Array<{ color: string; label: string; value: string }>;
  x: number;
  y: number;
};

function ChartTooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-20 min-w-[140px] rounded border border-[#cfc6b6] bg-white px-2.5 py-2 text-left shadow-md"
      style={{
        left: tip.x,
        top: tip.y,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
    >
      <p className="mb-1 text-[11px] font-semibold text-[#1a1612]">{tip.title}</p>
      <ul className="space-y-0.5">
        {tip.rows.map((row) => (
          <li key={row.label} className="flex items-center gap-1.5 text-[11px] text-[#3a342c]">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: row.color }}
            />
            <span>
              {row.label}: <strong>{row.value}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function useLocalTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  function onMove(e: MouseEvent<Element>, next: Omit<Tip, "x" | "y">) {
    const target = e.currentTarget.closest(".relative") as HTMLElement | null;
    const rect = (target || (e.currentTarget as Element).parentElement)?.getBoundingClientRect();
    if (!rect) return;
    setTip({
      ...next,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }
  function clear() {
    setTip(null);
  }
  return { tip, onMove, clear };
}

function ResourceChart({
  data,
}: {
  data: ReturnType<typeof computeDeckStats>["resources"];
}) {
  const { tip, onMove, clear } = useLocalTip();
  const [active, setActive] = useState<string | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.total)), 3);
  const w = 320;
  const h = 220;
  const pad = { t: 16, r: 12, b: 36, l: 28 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const barW = Math.min(42, iw / data.length - 16);
  const ticks = Array.from({ length: max / 3 + 1 }, (_, i) => i * 3);

  return (
    <div className="relative" onMouseLeave={clear}>
      <ChartTooltip tip={tip} />
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Iconos de recurso">
        {ticks.map((t) => {
          const y = pad.t + ih - (t / max) * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#e8e4dc" strokeWidth={1} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#8a8174">
                {t}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = pad.l + (iw / data.length) * (i + 0.5);
          const basicH = (d.basic / max) * ih;
          const aspectH = (d.aspect / max) * ih;
          const yAspect = pad.t + ih - basicH - aspectH;
          const yBasic = pad.t + ih - basicH;
          const meta = RESOURCE_META[d.kind];
          const dim = active != null && active !== d.kind;
          const accent = active === d.kind;
          return (
            <g
              key={d.kind}
              className="cursor-pointer"
              opacity={dim ? 0.35 : 1}
              onMouseEnter={(e) => {
                setActive(d.kind);
                onMove(e, {
                  title: meta.label,
                  rows: [
                    { color: "#555555", label: "Básico", value: String(d.basic) },
                    { color: meta.color, label: "Aspecto", value: String(d.aspect) },
                    { color: meta.color, label: "# iconos", value: String(d.total) },
                  ],
                });
              }}
              onMouseMove={(e) =>
                onMove(e, {
                  title: meta.label,
                  rows: [
                    { color: "#555555", label: "Básico", value: String(d.basic) },
                    { color: meta.color, label: "Aspecto", value: String(d.aspect) },
                    { color: meta.color, label: "# iconos", value: String(d.total) },
                  ],
                })
              }
              onMouseLeave={() => setActive(null)}
            >
              {d.basic > 0 ? (
                <rect
                  x={cx - barW / 2}
                  y={yBasic}
                  width={barW}
                  height={basicH}
                  fill="#555555"
                  rx={2}
                  stroke={accent ? "#1a1612" : "none"}
                  strokeWidth={accent ? 1.5 : 0}
                />
              ) : null}
              {d.aspect > 0 ? (
                <rect
                  x={cx - barW / 2}
                  y={yAspect}
                  width={barW}
                  height={aspectH}
                  fill={meta.color}
                  rx={2}
                  stroke={accent ? "#1a1612" : "none"}
                  strokeWidth={accent ? 1.5 : 0}
                />
              ) : null}
              {/* Hit area */}
              <rect
                x={cx - barW / 2 - 4}
                y={pad.t}
                width={barW + 8}
                height={ih}
                fill="transparent"
              />
              <text x={cx} y={h - 14} textAnchor="middle" fontSize={accent ? 16 : 14}>
                {meta.icon}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CostChart({ data }: { data: ReturnType<typeof computeDeckStats>["costs"] }) {
  const { tip, onMove, clear } = useLocalTip();
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.count)), 2);
  const w = 320;
  const h = 220;
  const pad = { t: 16, r: 16, b: 32, l: 28 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-[#8a8174]">Sin costes numéricos</p>;
  }
  const pts = data.map((d, i) => {
    const x = pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = pad.t + ih - (d.count / max) * ih;
    return { ...d, x, y };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const ticks = Array.from({ length: max / 2 + 1 }, (_, i) => i * 2);

  return (
    <div className="relative" onMouseLeave={clear}>
      <ChartTooltip tip={tip} />
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Coste de cartas">
        {ticks.map((t) => {
          const y = pad.t + ih - (t / max) * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#e8e4dc" strokeWidth={1} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#8a8174">
                {t}
              </text>
            </g>
          );
        })}
        {active != null ? (
          <line
            x1={pts[active].x}
            x2={pts[active].x}
            y1={pad.t}
            y2={pad.t + ih}
            stroke="#cfc6b6"
            strokeDasharray="3 3"
          />
        ) : null}
        <path d={path} fill="none" stroke="#4a90c8" strokeWidth={2} />
        {pts.map((p, i) => {
          const isOn = active === i;
          return (
            <g
              key={p.cost}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                setActive(i);
                onMove(e, {
                  title: `Coste ${p.cost}`,
                  rows: [{ color: "#4a90c8", label: "# cartas", value: String(p.count) }],
                });
              }}
              onMouseMove={(e) =>
                onMove(e, {
                  title: `Coste ${p.cost}`,
                  rows: [{ color: "#4a90c8", label: "# cartas", value: String(p.count) }],
                })
              }
              onMouseLeave={() => setActive(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isOn ? 7 : 4.5}
                fill="#4a90c8"
                stroke="#fff"
                strokeWidth={isOn ? 2 : 1.5}
              />
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
              <text
                x={p.x}
                y={h - 12}
                textAnchor="middle"
                fontSize={isOn ? 12 : 10}
                fontWeight={isOn ? 700 : 400}
                fill={isOn ? "#1a1612" : "#5c564c"}
              >
                {p.cost}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FactionChart({
  data,
}: {
  data: ReturnType<typeof computeDeckStats>["factions"];
}) {
  const { tip, onMove, clear } = useLocalTip();
  const [active, setActive] = useState<string | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.count)), 3);
  const w = 320;
  const h = 220;
  const pad = { t: 16, r: 12, b: 40, l: 28 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const barW = Math.min(48, iw / Math.max(data.length, 1) - 12);
  const ticks = Array.from({ length: max / 3 + 1 }, (_, i) => i * 3);

  if (!data.length) {
    return <p className="py-10 text-center text-sm text-[#8a8174]">Sin datos de aspecto</p>;
  }

  return (
    <div className="relative" onMouseLeave={clear}>
      <ChartTooltip tip={tip} />
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Aspectos">
        {ticks.map((t) => {
          const y = pad.t + ih - (t / max) * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#e8e4dc" strokeWidth={1} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#8a8174">
                {t}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = pad.l + (iw / data.length) * (i + 0.5);
          const bh = (d.count / max) * ih;
          const y = pad.t + ih - bh;
          const dim = active != null && active !== d.aspect;
          const isOn = active === d.aspect;
          return (
            <g
              key={d.aspect}
              className="cursor-pointer"
              opacity={dim ? 0.35 : 1}
              onMouseEnter={(e) => {
                setActive(d.aspect);
                onMove(e, {
                  title: d.aspect,
                  rows: [{ color: d.color, label: "# cartas", value: String(d.count) }],
                });
              }}
              onMouseMove={(e) =>
                onMove(e, {
                  title: d.aspect,
                  rows: [{ color: d.color, label: "# cartas", value: String(d.count) }],
                })
              }
              onMouseLeave={() => setActive(null)}
            >
              <rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={bh}
                fill={d.color}
                rx={2}
                stroke={isOn ? "#1a1612" : "none"}
                strokeWidth={isOn ? 1.5 : 0}
              />
              <rect x={cx - barW / 2 - 4} y={pad.t} width={barW + 8} height={ih} fill="transparent" />
              <text
                x={cx}
                y={h - 12}
                textAnchor="middle"
                fontSize={isOn ? 11 : 9}
                fontWeight={isOn ? 700 : 400}
                fill={isOn ? "#1a1612" : "#5c564c"}
              >
                {d.aspect.length > 8 ? `${d.aspect.slice(0, 7)}…` : d.aspect}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TypePie({ data }: { data: ReturnType<typeof computeDeckStats>["types"] }) {
  const { tip, onMove, clear } = useLocalTip();
  const [active, setActive] = useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0);
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;

  if (!total) {
    return <p className="py-10 text-center text-sm text-[#8a8174]">Sin tipos</p>;
  }

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const sweep = (d.count / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const mid = start + sweep / 2;
    const large = sweep > Math.PI ? 1 : 0;
    return {
      ...d,
      start,
      end,
      mid,
      large,
      pct: Math.round((d.count / total) * 100),
    };
  });

  function slicePath(start: number, end: number, radius: number, explode = 0) {
    const mid = (start + end) / 2;
    const ox = explode * Math.cos(mid);
    const oy = explode * Math.sin(mid);
    const x1 = cx + ox + radius * Math.cos(start);
    const y1 = cy + oy + radius * Math.sin(start);
    const x2 = cx + ox + radius * Math.cos(end);
    const y2 = cy + oy + radius * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return {
      d: `M ${cx + ox} ${cy + oy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`,
      ox,
      oy,
      mid,
    };
  }

  return (
    <div className="relative" onMouseLeave={() => { clear(); setActive(null); }}>
      <ChartTooltip tip={tip} />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto h-auto w-full max-w-[280px]"
        role="img"
        aria-label="Tipos de carta"
      >
        {slices.map((s) => {
          const isOn = active === s.type;
          const dim = active != null && !isOn;
          const { d, ox, oy, mid } = slicePath(s.start, s.end, r, isOn ? 8 : 0);
          const labelR = r + (isOn ? 36 : 30);
          const lx = cx + ox + labelR * Math.cos(mid);
          const ly = cy + oy + labelR * Math.sin(mid);
          const edgeX = cx + ox + (r + (isOn ? 4 : 0)) * Math.cos(mid);
          const edgeY = cy + oy + (r + (isOn ? 4 : 0)) * Math.sin(mid);
          const fill = dim ? muteColor(s.color) : s.color;
          return (
            <g
              key={s.type}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                setActive(s.type);
                onMove(e, {
                  title: s.label,
                  rows: [{ color: s.color, label: "# cartas", value: String(s.count) }],
                });
              }}
              onMouseMove={(e) =>
                onMove(e, {
                  title: s.label,
                  rows: [{ color: s.color, label: "# cartas", value: String(s.count) }],
                })
              }
              onMouseLeave={() => setActive(null)}
            >
              <path
                d={d}
                fill={fill}
                stroke="#fff"
                strokeWidth={isOn ? 2 : 1.5}
                style={{ transition: "d 120ms ease, fill 120ms ease" }}
              />
              <line
                x1={edgeX}
                y1={edgeY}
                x2={lx}
                y2={ly}
                stroke={isOn ? "#1a1612" : "#b8b0a4"}
                strokeWidth={1}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isOn ? 13 : 11}
                fontWeight={isOn ? 700 : 500}
                fill={isOn ? "#1a1612" : dim ? "#b0a89c" : "#6b6358"}
                style={{ transition: "font-size 120ms ease, fill 120ms ease" }}
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HorizBars({
  items,
  maxOverride,
}: {
  items: Array<{ label: string; value: number; color: string; sub?: string }>;
  maxOverride?: number;
}) {
  const { tip, onMove, clear } = useLocalTip();
  const [active, setActive] = useState<string | null>(null);
  const max = maxOverride || Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="relative space-y-2" onMouseLeave={clear}>
      <ChartTooltip tip={tip} />
      {items.map((item) => {
        const isOn = active === item.label;
        const dim = active != null && !isOn;
        const pct = Math.min(100, (item.value / max) * 100);
        return (
          <button
            key={item.label}
            type="button"
            className={`flex w-full items-center gap-2 text-left transition ${dim ? "opacity-40" : ""}`}
            onMouseEnter={(e) => {
              setActive(item.label);
              onMove(e, {
                title: item.label,
                rows: [
                  { color: item.color, label: item.sub || "Valor", value: String(item.value) },
                ],
              });
            }}
            onMouseMove={(e) =>
              onMove(e, {
                title: item.label,
                rows: [
                  { color: item.color, label: item.sub || "Valor", value: String(item.value) },
                ],
              })
            }
            onMouseLeave={() => setActive(null)}
          >
            <span
              className={`w-24 shrink-0 truncate text-[11px] ${isOn ? "font-bold text-[#1a1612]" : "text-[#5c564c]"}`}
            >
              {item.label}
            </span>
            <div className="h-3 min-w-0 flex-1 rounded bg-[#efeae2]">
              <div
                className="h-3 rounded transition-all"
                style={{
                  width: `${pct}%`,
                  background: item.color,
                  boxShadow: isOn ? "inset 0 0 0 1px #1a1612" : undefined,
                }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-[#1a1612]">
              {item.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MetricStrip({ stats }: { stats: ReturnType<typeof computeDeckStats> }) {
  const items = [
    {
      label: "Cartas",
      value: String(stats.drawSize),
      hint: "Mazo de robo",
    },
    {
      label: "Coste medio",
      value: stats.avgCost == null ? "—" : stats.avgCost.toFixed(2),
      hint: "Sin coste X",
    },
    {
      label: "Iconos/carta",
      value: stats.iconsPerCard.toFixed(2),
      hint: "Densidad de pago",
    },
    {
      label: "≤1 coste",
      value: `${Math.round(stats.lowCostShare * 100)}%`,
      hint: "Arranque",
    },
    {
      label: "ATK aliados",
      value: String(stats.allyAtk),
      hint: `${stats.allyCount} aliados`,
    },
    {
      label: "THW aliados",
      value: String(stats.allyThw),
      hint: `${stats.allyCount} aliados`,
    },
    {
      label: "Score",
      value: String(stats.score),
      hint: "0–100 heurística",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((m) => (
        <div
          key={m.label}
          className="rounded-lg border border-[#e7dfd2] bg-white px-2.5 py-2 text-center shadow-sm"
          title={m.hint}
        >
          <p className="text-[10px] uppercase tracking-wide text-[#8a8174]">{m.label}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#1a1612]">{m.value}</p>
        </div>
      ))}
    </div>
  );
}

function FlagsPanel({ flags, score }: { flags: DeckFlag[]; score: number }) {
  const tone =
    score >= 70 ? "text-[#2f7a32]" : score >= 45 ? "text-[#a16207]" : "text-[#b91c1c]";
  const badge = (level: DeckFlag["level"]) =>
    level === "green"
      ? "border-[#b7d7b8] bg-[#eef7ee] text-[#1f5c22]"
      : level === "red"
        ? "border-[#e8bcbc] bg-[#fdf2f2] text-[#8f1f1f]"
        : "border-[#ead9a8] bg-[#fff8e8] text-[#7a5a10]";

  return (
    <div className="rounded-lg border border-[#e7dfd2] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1612]">Diagnóstico del mazo</h3>
          <p className="text-[11px] text-[#8a8174]">
            Reglas fijas (sin IA). Semáforo de fortalezas y debilidades.
          </p>
        </div>
        <p className={`text-2xl font-bold tabular-nums ${tone}`}>
          {score}
          <span className="ml-1 text-xs font-medium text-[#8a8174]">/ 100</span>
        </p>
      </div>
      {flags.length === 0 ? (
        <p className="text-sm text-[#8a8174]">Sin señales claras — mazo pequeño o datos incompletos.</p>
      ) : (
        <ul className="space-y-2">
          {flags.map((f) => (
            <li
              key={f.id}
              className={`rounded-lg border px-3 py-2 ${badge(f.level)}`}
            >
              <p className="text-[12px] font-semibold">
                {f.level === "green" ? "🟢" : f.level === "red" ? "🔴" : "🟡"} {f.title}
              </p>
              <p className="mt-0.5 text-[11px] opacity-90">{f.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#e7dfd2] bg-white p-3 shadow-sm">
      <h3 className="text-sm font-semibold text-[#1a1612]">{title}</h3>
      {subtitle ? <p className="text-[11px] text-[#8a8174]">{subtitle}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ChecklistPanel({ items }: { items: DeckChecklistItem[] }) {
  const sections = useMemo(() => {
    const map = new Map<string, DeckChecklistItem[]>();
    for (const item of items) {
      const list = map.get(item.section) || [];
      list.push(item);
      map.set(item.section, list);
    }
    return [...map.entries()];
  }, [items]);

  const tone = (level: DeckChecklistItem["level"]) =>
    level === "green"
      ? "border-[#b7d7b8] bg-[#eef7ee]"
      : level === "red"
        ? "border-[#e8bcbc] bg-[#fdf2f2]"
        : level === "amber"
          ? "border-[#ead9a8] bg-[#fff8e8]"
          : "border-[#d9e2ef] bg-[#f5f8fc]";

  const mark = (level: DeckChecklistItem["level"]) =>
    level === "green" ? "🟢" : level === "red" ? "🔴" : level === "amber" ? "🟡" : "ℹ️";

  return (
    <div className="rounded-lg border border-[#e7dfd2] bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#1a1612]">Checklist de viabilidad</h3>
        <p className="text-[11px] text-[#8a8174]">
          Solo consultas y heurísticas sobre tus cartas (sin IA ni simulación).
        </p>
      </div>
      {sections.length === 0 ? (
        <p className="text-sm text-[#8a8174]">Sin datos para la checklist.</p>
      ) : (
        <div className="space-y-4">
          {sections.map(([section, rows]) => (
            <div key={section}>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8174]">
                {section}
              </h4>
              <ul className="space-y-2">
                {rows.map((item) => (
                  <li
                    key={item.id}
                    className={`rounded-lg border px-3 py-2 ${tone(item.level)}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[12px] font-semibold text-[#1a1612]">
                        {mark(item.level)} {item.question}
                      </p>
                      {item.metric ? (
                        <span className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[#5c554c]">
                          {item.metric}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#4a433a]">{item.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeckStatsModal({
  open,
  onClose,
  cards,
  deckName,
}: {
  open: boolean;
  onClose: () => void;
  cards: StatsCard[];
  deckName: string;
}) {
  const stats = useMemo(() => computeDeckStats(cards), [cards]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-stats-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl border border-[#ddd4c4] bg-[#f8f4ec] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e7dfd2] bg-[#f8f4ec]/95 px-5 py-3 backdrop-blur">
          <div>
            <h2 id="deck-stats-title" className="text-base font-semibold text-[#1a1612]">
              Estadísticas del mazo
            </h2>
            <p className="text-xs text-[#8a8174]">{deckName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#cfc6b6] bg-white px-3 py-1.5 text-sm font-medium text-[#1a1612] hover:bg-[#f3efe6]"
          >
            Cerrar
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <ChartCard title="Iconos de recurso" subtitle="Pasa el cursor para el detalle">
              <ResourceChart data={stats.resources} />
            </ChartCard>
            <ChartCard title="Coste de cartas" subtitle="Coste X ignorado · hover para detalle">
              <CostChart data={stats.costs} />
            </ChartCard>
            <ChartCard title="Aspectos" subtitle="Solo mazo de robo · hover para detalle">
              <FactionChart data={stats.factions} />
            </ChartCard>
            <ChartCard title="Tipos de carta" subtitle="Solo mazo de robo · hover para detalle">
              <TypePie data={stats.types} />
            </ChartCard>
          </div>

          <MetricStrip stats={stats} />

          <div className="grid gap-4 sm:grid-cols-2">
            <ChartCard
              title="Composición táctica"
              subtitle="Aliados · Eventos · Permanentes · Recursos"
            >
              <HorizBars
                items={stats.composition.map((c) => ({
                  label: c.label,
                  value: c.count,
                  color: c.color,
                  sub: "# cartas",
                }))}
              />
            </ChartCard>
            <ChartCard
              title="Jugabilidad por coste"
              subtitle="% del mazo con coste ≤ N (sin X)"
            >
              <HorizBars
                items={stats.playability.map((p) => ({
                  label: p.resources === 0 ? "Coste 0" : `Coste ≤ ${p.resources}`,
                  value: Math.round(p.share * 100),
                  color: "#4a90c8",
                  sub: "% cartas",
                }))}
                maxOverride={100}
              />
            </ChartCard>
            <ChartCard title="Poder en mesa (aliados)" subtitle="Suma ATK / THW × copias">
              <HorizBars
                items={[
                  { label: "ATK total", value: stats.allyAtk, color: "#c41218", sub: "ATK" },
                  { label: "THW total", value: stats.allyThw, color: "#2f5f9e", sub: "THW" },
                  { label: "Aliados", value: stats.allyCount, color: "#3b82c4", sub: "# cartas" },
                ]}
              />
            </ChartCard>
            <ChartCard title="Traits más frecuentes" subtitle="Top del mazo de robo">
              {stats.topTraits.length ? (
                <HorizBars
                  items={stats.topTraits.slice(0, 8).map((t, i) => ({
                    label: t.trait,
                    value: t.count,
                    color: ["#c9a227", "#3d6ea8", "#46991b", "#b12020", "#87868f", "#d074ac", "#2ea7b8", "#8b6914"][
                      i % 8
                    ],
                    sub: "# cartas",
                  }))}
                />
              ) : (
                <p className="py-6 text-center text-sm text-[#8a8174]">Sin traits en el mazo</p>
              )}
            </ChartCard>
          </div>

          <FlagsPanel flags={stats.flags} score={stats.score} />

          <ChecklistPanel items={stats.checklist} />
        </div>
      </div>
    </div>
  );
}

