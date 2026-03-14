import React from "react";
import type { ChannelPairingGroup } from "../../lib/controllers/channel-pairing.ts";

// ─── Types ───────────────────────────────────────────────────

export type ChannelPairingsProps = {
  loading: boolean;
  pairings: ChannelPairingGroup[];
  error: string | null;
  onRefresh: () => void;
  onApprove: (channel: string, code: string) => void;
};

// ─── Component ───────────────────────────────────────────────

export function ChannelPairings({ loading, pairings, error, onRefresh, onApprove }: ChannelPairingsProps) {
  const groups = pairings ?? [];
  const totalPending = groups.reduce((sum, g) => sum + g.requests.length, 0);

  return (
    <section className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="card-title">渠道配对请求</div>
          <div className="card-sub">来自飞书、Telegram 等渠道的用户配对审批</div>
        </div>
        <button className="btn" disabled={loading} onClick={onRefresh}>
          {loading ? "加载中..." : "刷新"}
        </button>
      </div>

      {error && (
        <div className="callout danger" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      <div className="list" style={{ marginTop: 16 }}>
        {totalPending === 0 ? (
          <div className="muted">暂无待审批的渠道配对请求。</div>
        ) : (
          groups.map((group) => (
            <div key={group.channel}>
              <div className="muted" style={{ marginBottom: 8, marginTop: 4 }}>
                📢 {group.channel}
                <span style={{ opacity: 0.6 }}> ({group.requests.length})</span>
              </div>
              {group.requests.map((req) => (
                <div className="list-item" key={req.code}>
                  <div className="list-main">
                    <div className="list-title">用户 ID: {req.id}</div>
                    <div className="list-sub">
                      配对码: {req.code} · 时间: {req.createdAt}
                      {req.meta ? ` · ${JSON.stringify(req.meta)}` : ""}
                    </div>
                  </div>
                  <div className="list-meta">
                    <button
                      className="btn btn--sm primary"
                      onClick={() => onApprove(group.channel, req.code)}
                    >
                      批准
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
