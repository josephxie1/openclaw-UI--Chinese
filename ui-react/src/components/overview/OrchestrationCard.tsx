import React, { useMemo } from "react";
import { t } from "../../i18n/index.ts";
import type { SessionActivityResult, SessionActivityEntry } from "../../lib/types.ts";

// ── Tree Data Structure ────────────────────────────────────────

type TreeNode = {
  key: string;
  label: string;
  agentId: string;
  session: SessionActivityEntry;
  children: TreeNode[];
  depth: number;
};

// ── Layout constants ───────────────────────────────────────────

const NODE_W = 150;
const NODE_H = 60;
const H_GAP = 30;
const V_GAP = 50;

// ── Session key parsing ────────────────────────────────────────

// Segmentos que indican relación padre-hijo en session keys
const CHILD_SEGMENTS = [":subagent:", ":acp:"] as const;

function buildSessionTree(sessions: SessionActivityEntry[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();

  for (const session of sessions) {
    const { key } = session;
    nodeMap.set(key, {
      key,
      label: extractLabel(key),
      agentId: extractAgentId(key),
      session,
      children: [],
      depth: countDepth(key),
    });
  }

  const roots: TreeNode[] = [];
  for (const node of nodeMap.values()) {
    const parentKey = findParentKey(node.key);
    if (parentKey && nodeMap.has(parentKey)) {
      nodeMap.get(parentKey)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const stateOrder: Record<string, number> = { processing: 0, waiting: 1, idle: 2 };
  const sortFn = (a: TreeNode, b: TreeNode) =>
    (stateOrder[a.session.state] ?? 2) - (stateOrder[b.session.state] ?? 2);
  roots.sort(sortFn);
  for (const node of nodeMap.values()) node.children.sort(sortFn);

  return roots;
}

function extractAgentId(key: string): string {
  return key.match(/^agent:([^:]+)/)?.[1] ?? key;
}

/**
 * Extraemos etiqueta legible del session key:
 * "agent:dev:web:123"          → "dev (web)"
 * "agent:dev:subagent:abc123"  → "sub:abc12345"
 * "agent:dev:acp:abc123"       → "acp:abc12345"
 */
function extractLabel(key: string): string {
  const parts = key.split(":");

  // Última sección de tipo hijo
  for (let i = parts.length - 2; i >= 0; i--) {
    if (parts[i] === "subagent") {
      const id = parts[i + 1];
      return `sub:${id.length > 8 ? id.slice(0, 8) : id}`;
    }
    if (parts[i] === "acp") {
      const id = parts[i + 1];
      return `acp:${id.length > 8 ? id.slice(0, 8) : id}`;
    }
  }

  // Raíz: "agent:dev:web:123" → "dev (web)"
  if (parts.length >= 2 && parts[0] === "agent") {
    const agentId = parts[1];
    const sessionType = parts.length >= 3 ? parts[2] : "";
    if (sessionType && sessionType !== "main") {
      return `${agentId} (${sessionType})`;
    }
    return agentId;
  }

  return key;
}

function countDepth(key: string): number {
  let d = 0;
  for (const seg of CHILD_SEGMENTS) {
    const matches = key.match(new RegExp(seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
    d += matches?.length ?? 0;
  }
  return d;
}

function findParentKey(key: string): string | null {
  // Encontrar el último segmento hijo (:subagent: o :acp:)
  let lastIdx = -1;
  for (const seg of CHILD_SEGMENTS) {
    const idx = key.lastIndexOf(seg);
    if (idx > lastIdx) lastIdx = idx;
  }
  return lastIdx === -1 ? null : key.slice(0, lastIdx);
}

function fmtTokens(n: number | undefined): string {
  if (!n) return "0";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

// ── Layout algorithm ───────────────────────────────────────────

type LayoutNode = {
  node: TreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
};

function layoutTree(roots: TreeNode[]): { nodes: LayoutNode[]; width: number; height: number } {
  if (roots.length === 0) return { nodes: [], width: 0, height: 0 };

  const allLayouts: LayoutNode[] = [];
  let totalWidth = 0;

  for (const root of roots) {
    const layout = layoutSubtree(root, 0);
    // Desplazar horizontalmente
    offsetX(layout, totalWidth);
    allLayouts.push(layout);
    totalWidth += subtreeWidth(root) + H_GAP;
  }

  totalWidth -= H_GAP; // Quitar gap extra
  const height = maxDepth(roots) * (NODE_H + V_GAP) + NODE_H;

  return { nodes: allLayouts, width: totalWidth, height };
}

function layoutSubtree(node: TreeNode, depth: number): LayoutNode {
  if (node.children.length === 0) {
    return { node, x: 0, y: depth * (NODE_H + V_GAP), children: [] };
  }

  const childLayouts: LayoutNode[] = [];
  let childOffset = 0;

  for (const child of node.children) {
    const cl = layoutSubtree(child, depth + 1);
    offsetX(cl, childOffset);
    childLayouts.push(cl);
    childOffset += subtreeWidth(child) + H_GAP;
  }

  // Centrar padre sobre hijos
  const firstChild = childLayouts[0];
  const lastChild = childLayouts[childLayouts.length - 1];
  const parentX = (firstChild.x + lastChild.x) / 2;

  return {
    node,
    x: parentX,
    y: depth * (NODE_H + V_GAP),
    children: childLayouts,
  };
}

function subtreeWidth(node: TreeNode): number {
  if (node.children.length === 0) return NODE_W;
  let w = 0;
  for (const child of node.children) {
    w += subtreeWidth(child) + H_GAP;
  }
  return Math.max(NODE_W, w - H_GAP);
}

function maxDepth(nodes: TreeNode[]): number {
  let d = 0;
  for (const n of nodes) {
    const cd = 1 + (n.children.length > 0 ? maxDepth(n.children) : 0);
    if (cd > d) d = cd;
  }
  return d;
}

function offsetX(layout: LayoutNode, dx: number) {
  layout.x += dx;
  for (const child of layout.children) offsetX(child, dx);
}

// ── SVG Rendering ──────────────────────────────────────────────

const STATE_COLORS: Record<string, string> = {
  processing: "#30d158",
  waiting: "#ff9f0a",
  idle: "#636366",
};

function renderConnections(layout: LayoutNode): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  const parentCx = layout.x + NODE_W / 2;
  const parentCy = layout.y + NODE_H;

  for (const child of layout.children) {
    const childCx = child.x + NODE_W / 2;
    const childCy = child.y;
    const midY = (parentCy + childCy) / 2;

    lines.push(
      <path
        key={`${layout.node.key}-${child.node.key}`}
        d={`M ${parentCx} ${parentCy} C ${parentCx} ${midY}, ${childCx} ${midY}, ${childCx} ${childCy}`}
        fill="none"
        stroke="var(--border)"
        strokeWidth="2"
        className={`orch-svg__line orch-svg__line--${child.node.session.state}`}
      />,
    );

    // Punta de flecha
    lines.push(
      <circle
        key={`arrow-${layout.node.key}-${child.node.key}`}
        cx={childCx}
        cy={childCy - 1}
        r="3"
        fill="var(--border)"
      />,
    );

    lines.push(...renderConnections(child));
  }

  return lines;
}

function renderNodes(layout: LayoutNode): React.ReactNode[] {
  const { node, x, y } = layout;
  const { session } = node;
  const stateColor = STATE_COLORS[session.state] ?? STATE_COLORS.idle;
  const isProcessing = session.state === "processing";
  const isSubagent = node.depth > 0;

  const elements: React.ReactNode[] = [];

  // Glow para estado processing
  if (isProcessing) {
    elements.push(
      <rect
        key={`glow-${node.key}`}
        x={x - 2}
        y={y - 2}
        width={NODE_W + 4}
        height={NODE_H + 4}
        rx={10}
        fill="none"
        stroke={stateColor}
        strokeWidth="1"
        opacity={0.3}
        className="orch-svg__glow"
      />,
    );
  }

  // Fondo del nodo
  elements.push(
    <rect
      key={`bg-${node.key}`}
      x={x}
      y={y}
      width={NODE_W}
      height={NODE_H}
      rx={8}
      fill="var(--card)"
      stroke={isProcessing ? stateColor : "var(--border)"}
      strokeWidth={isProcessing ? 1.5 : 1}
      className="orch-svg__node"
    />,
  );

  // Punto de estado
  elements.push(
    <circle
      key={`dot-${node.key}`}
      cx={x + 14}
      cy={y + 15}
      r={4}
      fill={stateColor}
      className={isProcessing ? "orch-svg__dot-pulse" : ""}
    />,
  );

  // Nombre del agent
  elements.push(
    <text
      key={`name-${node.key}`}
      x={x + 24}
      y={y + 18}
      fontSize="12"
      fontWeight="600"
      fill="var(--text-strong)"
      className="orch-svg__text"
    >
      {node.label}
    </text>,
  );

  // Estado + tokens
  elements.push(
    <text
      key={`meta-${node.key}`}
      x={x + 14}
      y={y + 36}
      fontSize="10"
      fill="var(--muted)"
      className="orch-svg__text"
    >
      {t(`orchestration.${session.state}`)} · {fmtTokens(session.totalTokens)} tok
    </text>,
  );

  // Queue badge
  if ((session.queueDepth ?? 0) > 0) {
    elements.push(
      <React.Fragment key={`queue-${node.key}`}>
        <rect x={x + NODE_W - 38} y={y + 42} width={30} height={14} rx={4} fill="rgba(255,159,10,0.15)" />
        <text x={x + NODE_W - 34} y={y + 52} fontSize="9" fontWeight="600" fill="#ff9f0a" className="orch-svg__text">
          q:{session.queueDepth}
        </text>
      </React.Fragment>,
    );
  }

  // Renderizar hijos
  for (const child of layout.children) {
    elements.push(...renderNodes(child));
  }

  return elements;
}

// ── Main Card ──────────────────────────────────────────────────

interface OrchestrationCardProps {
  sessionActivity: SessionActivityResult | null;
}

export function OrchestrationCard({ sessionActivity }: OrchestrationCardProps) {
  const tree = useMemo(() => {
    if (!sessionActivity?.sessions?.length) return [];
    return buildSessionTree(sessionActivity.sessions);
  }, [sessionActivity]);

  const layout = useMemo(() => layoutTree(tree), [tree]);

  const stats = sessionActivity
    ? { processing: sessionActivity.processing, waiting: sessionActivity.waiting, idle: sessionActivity.idle }
    : null;

  const PADDING = 20;
  const svgW = Math.max(layout.width + PADDING * 2, 300);
  const svgH = layout.height + PADDING * 2;

  return (
    <div className="card orch-card">
      <div className="orch-card__header">
        <div className="orch-card__title">
          <svg className="orch-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="14" />
            <circle cx="6" cy="19" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="12" y1="14" x2="6" y2="16" />
            <line x1="12" y1="14" x2="18" y2="16" />
          </svg>
          {t("orchestration.title")}
        </div>
        {stats && (
          <div className="orch-card__stats">
            <span className="orch-stat orch-stat--processing">{stats.processing}</span>
            <span className="orch-stat orch-stat--waiting">{stats.waiting}</span>
            <span className="orch-stat orch-stat--idle">{stats.idle}</span>
          </div>
        )}
      </div>
      <div className="orch-card__body">
        {tree.length === 0 ? (
          <div className="orch-card__empty">{t("orchestration.empty")}</div>
        ) : (
          <div className="orch-svg-container">
            <svg
              width={svgW}
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="orch-svg"
            >
              <g transform={`translate(${PADDING}, ${PADDING})`}>
                {layout.nodes.map((l) => renderConnections(l))}
                {layout.nodes.map((l) => renderNodes(l))}
              </g>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
