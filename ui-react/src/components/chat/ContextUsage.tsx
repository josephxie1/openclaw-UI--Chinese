import React, { useState } from "react";
import { t } from "../../i18n/index.ts";

// ─── Types ───────────────────────────────────────────────────

interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  totalTokens?: number;
}

interface ContextUsageProps {
  usage?: TokenUsage;
  maxTokens?: number;
  modelId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return String(n);
}

// ─── SVG Progress Ring ───────────────────────────────────────

const RADIUS = 10;
const VIEWBOX = 24;
const CENTER = 12;
const STROKE_WIDTH = 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ percent }: { percent: number }) {
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(percent, 1));

  return (
    <svg
      aria-label={t("chatView.contextUsageLabel")}
      height="18"
      role="img"
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      width="18"
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        fill="none"
        opacity="0.2"
        r={RADIUS}
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        fill="none"
        opacity="0.8"
        r={RADIUS}
        stroke="currentColor"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth={STROKE_WIDTH}
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
    </svg>
  );
}

// ─── Token Breakdown Row ─────────────────────────────────────

function TokenRow({ label, tokens }: { label: string; tokens?: number }) {
  if (!tokens) {
    return null;
  }
  return (
    <div className="context-usage__row">
      <span className="context-usage__row-label">{label}</span>
      <span className="context-usage__row-value">{formatTokenCount(tokens)}</span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────

export function ContextUsage({ usage, maxTokens, modelId }: ContextUsageProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!usage) {
    return null;
  }

  const total =
    usage.totalTokens ??
    (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0) + (usage.reasoningTokens ?? 0);

  if (total === 0) {
    return null;
  }

  const usedPercent = maxTokens ? total / maxTokens : 0;
  const percentText = maxTokens ? `${Math.round(usedPercent * 100)}%` : formatTokenCount(total);

  return (
    <div
      className="context-usage"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="context-usage__trigger">
        <span className="context-usage__pct">{percentText}</span>
        {maxTokens ? <ProgressRing percent={usedPercent} /> : null}
      </div>

      {isHovered && (
        <div className="context-usage__card">
          {maxTokens && (
            <div className="context-usage__header">
              <span>{percentText}</span>
              <span className="context-usage__header-detail">
                {formatTokenCount(total)} / {formatTokenCount(maxTokens)}
              </span>
            </div>
          )}
          <div className="context-usage__body">
            <TokenRow label="Input" tokens={usage.inputTokens} />
            <TokenRow label="Output" tokens={usage.outputTokens} />
            <TokenRow label="Reasoning" tokens={usage.reasoningTokens} />
            <TokenRow label="Cache" tokens={usage.cachedInputTokens} />
          </div>
          {modelId && (
            <div className="context-usage__footer">
              <span className="context-usage__model">{modelId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
