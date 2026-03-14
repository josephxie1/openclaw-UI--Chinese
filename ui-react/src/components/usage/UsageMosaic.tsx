import React, { useMemo } from "react";
import { t } from "../../i18n/index.ts";
import {
  buildUsageMosaicStats,
  formatTokens,
} from "../../lib/views/usage-metrics.ts";
import type { UsageSessionEntry } from "../../lib/views/usageTypes.ts";

interface UsageMosaicProps {
  sessions: UsageSessionEntry[];
  timeZone: "local" | "utc";
  selectedHours: number[];
  onSelectHour: (hour: number, shiftKey: boolean) => void;
}

export function UsageMosaic({ sessions, timeZone, selectedHours, onSelectHour }: UsageMosaicProps) {
  const stats = useMemo(() => buildUsageMosaicStats(sessions, timeZone), [sessions, timeZone]);

  if (!stats.hasData) return null;

  const maxHour = Math.max(...stats.hourTotals, 1);

  return (
    <section className="card usage-mosaic">
      <div className="usage-mosaic-header">
        <div className="usage-mosaic-title">{t("usageView.activityHeatmap")}</div>
        <div className="usage-mosaic-sub">{t("usageView.clickToFilter")}</div>
      </div>
      <div className="usage-mosaic-grid">
        {/* Parte izquierda: resumen por franja del día */}
        <div className="usage-mosaic-section">
          <div className="usage-mosaic-section-title">
            <span>{t("usageView.byTimeOfDay")}</span>
            <span className="usage-mosaic-total">{formatTokens(stats.totalTokens)}</span>
          </div>
          <div className="usage-daypart-grid">
            {stats.weekdayTotals.map((wd) => (
              <div key={wd.label} className="usage-daypart-cell">
                <div className="usage-daypart-label">{wd.label}</div>
                <div className="usage-daypart-value">{formatTokens(wd.tokens)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Parte derecha: grilla de 24 horas */}
        <div className="usage-mosaic-section">
          <div className="usage-mosaic-section-title">{t("usageView.hourlyActivity")}</div>
          <div className="usage-hour-grid">
            {stats.hourTotals.map((tokens, hour) => {
              const intensity = tokens / maxHour;
              const isSelected = selectedHours.includes(hour);
              return (
                <div
                  key={hour}
                  className={`usage-hour-cell ${isSelected ? "selected" : ""}`}
                  style={{ background: `rgba(255, 77, 77, ${0.05 + intensity * 0.7})` }}
                  title={`${hour}:00 — ${formatTokens(tokens)}`}
                  onClick={(e) => onSelectHour(hour, e.shiftKey)}
                />
              );
            })}
          </div>
          <div className="usage-hour-labels">
            {["0:00", "4:00", "8:00", "12:00", "16:00", "20:00"].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div className="usage-hour-legend">
            <span /> {t("usageView.lessActive")} → {t("usageView.moreActive")}
          </div>
        </div>
      </div>
    </section>
  );
}
