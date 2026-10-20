import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import india from "@/data/india.geo.json";
import { useAdvisor } from "@/lib/advisor";
import { formatCr } from "@/lib/score";

const W = 420;
const H = 460;

export function IndiaMap() {
  const { ranked, hoverCity, setHoverCity } = useAdvisor();
  const [tip, setTip] = useState<string | null>(null);
  const geo = india as unknown as FeatureCollection;
  const { path, proj } = useMemo(() => {
    const proj = geoMercator().fitSize([W, H], geo);
    return { path: geoPath(proj)(geo.features[0]) ?? "", proj };
  }, [geo]);
  const maxP = Math.max(...ranked.map((r) => r.city.professionalsM));
  const maxS = Math.max(...ranked.map((r) => r.score));
  const minS = Math.min(...ranked.map((r) => r.score));
  const active = tip ?? hoverCity;

  return (
    <figure className="rounded-[14px] border bg-card p-4">
      <figcaption className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[17px]">Where they sit</h3>
        <span className="text-[12px] text-muted-foreground">Circle size = talent pool · Colour = score</span>
      </figcaption>
      <p className="sr-only">
        Map of India. {ranked.map((r) => `${r.city.name}: rank ${r.rank}, score ${r.score}, total cost ${formatCr(r.costCr)}.`).join(" ")}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
        <path d={path} fill="var(--sunken)" stroke="var(--border)" strokeWidth={1.2} />
        {[...ranked].reverse().map((r) => {
          const [x, y] = proj([r.city.lng, r.city.lat]) ?? [0, 0];
          const base = 7 + 14 * Math.sqrt(r.city.professionalsM / maxP);
          const rad = active === r.city.id ? base * 1.25 : base;
          const top = r.rank === 1;
          const op = 0.35 + 0.6 * ((r.score - minS) / (maxS - minS || 1));
          const left = ["mumbai", "pune", "bengaluru"].includes(r.city.id);
          const dy = r.city.id === "mumbai" ? -8 : r.city.id === "pune" ? 14 : 4;
          return (
            <g
              key={r.city.id}
              onMouseEnter={() => { setTip(r.city.id); setHoverCity(r.city.id); }}
              onMouseLeave={() => { setTip(null); setHoverCity(null); }}
              style={{ cursor: "pointer" }}
            >
              {top && <circle cx={x} cy={y} r={10} fill="none" stroke="var(--accent-c)" strokeWidth={2} className="marker-pulse" />}
              <circle
                cx={x}
                cy={y}
                r={rad}
                fill={top ? "var(--accent-c)" : "var(--steel)"}
                fillOpacity={top ? 0.9 : op}
                stroke="var(--card)"
                strokeWidth={1.5}
                style={{ transition: "r 150ms ease-out" }}
              />
              <text
                x={left ? x - rad - 4 : x + rad + 4}
                y={y + dy}
                textAnchor={left ? "end" : "start"}
                fontSize={13}
                fontWeight={600}
                fill="var(--foreground)"
                stroke="var(--card)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {r.city.name}
              </text>
              {tip === r.city.id && (
                <g transform={`translate(${Math.min(x, W - 150)}, ${Math.max(y - 64, 4)})`}>
                  <rect width={146} height={52} rx={10} fill="var(--card)" stroke="var(--border)" />
                  <text x={10} y={20} fontSize={13} fontWeight={600} fill="var(--foreground)">#{r.rank} · score {r.score}</text>
                  <text x={10} y={40} fontSize={12} fill="var(--muted-foreground)" className="num">{formatCr(r.costCr)} / yr</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
