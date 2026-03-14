/**
 * RanchScene3D.tsx — Low-poly 3D ranch scene using React Three Fiber.
 * State-driven agent behaviors matching RanchScene2D's visual status system.
 */
import React, { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { GatewayAgentRow, SessionActivityResult } from "../../lib/types.ts";

// ─── Constants ──────────────────────────────────────────────────────

const GRASS_COLOR = new THREE.Color("#68b840");
const DIRT_COLOR = new THREE.Color("#c8a868");
const WATER_COLOR = new THREE.Color("#4890d0");

const PALETTES_3D = [
  { body: "#f5f5f0", spot: "#4a4a4a" },
  { body: "#d4915c", spot: "#fff8e7" },
  { body: "#8B7355", spot: "#F5DEB3" },
  { body: "#e8d5b7", spot: "#8B6914" },
  { body: "#c9b8a3", spot: "#5c4033" },
  { body: "#888888", spot: "#cccccc" },
  { body: "#f0e68c", spot: "#cd853f" },
  { body: "#bc8f8f", spot: "#800000" },
];

// ── Visual status system (mirrors RanchScene2D) ──
type RanchVisualStatus = "thinking" | "tool_calling" | "speaking" | "idle" | "error" | "spawning";

const PROCESSING_CYCLE: { status: RanchVisualStatus; duration: number; toolName: string | null }[] = [
  { status: "thinking",     duration: 3000, toolName: null },
  { status: "tool_calling", duration: 2000, toolName: "execute" },
  { status: "speaking",     duration: 2000, toolName: null },
];
const CYCLE_TOTAL = PROCESSING_CYCLE.reduce((s, c) => s + c.duration, 0);

function getProcessingSubState(agentIdx: number): { status: RanchVisualStatus; toolName: string | null } {
  const offset = agentIdx * 1300;
  const t = ((Date.now() + offset) % CYCLE_TOTAL);
  let acc = 0;
  for (const phase of PROCESSING_CYCLE) {
    acc += phase.duration;
    if (t < acc) return { status: phase.status, toolName: phase.toolName };
  }
  return PROCESSING_CYCLE[0];
}

// ── 3D zone positions (x, z) mapped to visual status ──
const ZONE_3D: Record<RanchVisualStatus, [number, number]> = {
  thinking:     [-3, -3],   // Cerca del granero
  tool_calling: [6, -4],    // Junto al molino
  speaking:     [0, 1],     // Centro (cartel)
  idle:         [4, 2],     // Cerca del estanque
  error:        [-2, 4],    // Campo
  spawning:     [-3, -2],   // Puerta del granero
};

const ACTIVITY_LABELS: Record<RanchVisualStatus, string> = {
  thinking: "思考中",
  tool_calling: "使用工具",
  speaking: "汇报中",
  idle: "摸鱼中",
  error: "出错了",
  spawning: "上班中",
};

const STATUS_COLORS: Record<RanchVisualStatus, string> = {
  thinking: "#3b82f6",
  tool_calling: "#f97316",
  speaking: "#a855f7",
  idle: "#64748b",
  error: "#ef4444",
  spawning: "#22c55e",
};

// ─── Ground ─────────────────────────────────────────────────────────

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={GRASS_COLOR} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[1.2, 20]} />
        <meshStandardMaterial color={DIRT_COLOR} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 1.2]} />
        <meshStandardMaterial color={DIRT_COLOR} roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Barn ───────────────────────────────────────────────────────────

function Barn({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2.5, 1.6, 2]} />
        <meshStandardMaterial color="#c8a060" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <coneGeometry args={[1.8, 0.8, 4]} />
        <meshStandardMaterial color="#c03030" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 1.01]}>
        <boxGeometry args={[0.6, 0.9, 0.05]} />
        <meshStandardMaterial color="#6a4020" />
      </mesh>
      <mesh position={[-0.7, 0.9, 1.01]}>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#88c8e8" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0.7, 0.9, 1.01]}>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#88c8e8" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

// ─── Windmill ───────────────────────────────────────────────────────

function Windmill({ position }: { position: [number, number, number] }) {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (bladesRef.current) bladesRef.current.rotation.z -= delta * 0.8;
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 2.4, 6]} />
        <meshStandardMaterial color="#e8d8c0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[0.4, 0.5, 6]} />
        <meshStandardMaterial color="#a07020" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.2, 0.35]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#a09080" metalness={0.3} />
      </mesh>
      <group ref={bladesRef} position={[0, 2.2, 0.4]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (Math.PI / 2) * i]}>
            <boxGeometry args={[0.15, 1.0, 0.02]} />
            <meshStandardMaterial color="#c8b8a0" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── Small House ────────────────────────────────────────────────────

function SmallHouse({ position, roofColor = "#48a838" }: { position: [number, number, number]; roofColor?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.2, 0.9, 1]} />
        <meshStandardMaterial color="#e8d8c0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <coneGeometry args={[0.9, 0.6, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── Tree3D ─────────────────────────────────────────────────────────

function Tree3D({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 6]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#38802a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#48a038" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Fence3D ────────────────────────────────────────────────────────

function Fence3D({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[2] + to[2]) / 2;
  const postCount = Math.max(2, Math.floor(length / 0.8));

  return (
    <group>
      {Array.from({ length: postCount }, (_, i) => {
        const t = i / (postCount - 1);
        return (
          <mesh key={i} position={[from[0] + dx * t, 0.25, from[2] + dz * t]} castShadow>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshStandardMaterial color="#a07020" roughness={0.9} />
          </mesh>
        );
      })}
      <mesh position={[cx, 0.35, cz]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.04, 0.06, length]} />
        <meshStandardMaterial color="#c09040" />
      </mesh>
      <mesh position={[cx, 0.15, cz]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.04, 0.06, length]} />
        <meshStandardMaterial color="#c09040" />
      </mesh>
    </group>
  );
}

// ─── Fence Gate (animated open/close) ───────────────────────────────

function FenceGate3D({ position, open }: { position: [number, number, number]; open: boolean }) {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  // Animación suave de apertura/cierre de la puerta
  const openProgress = useRef(0);

  useFrame((_, delta) => {
    const target = open ? 1 : 0;
    openProgress.current += (target - openProgress.current) * Math.min(delta * 3, 0.15);
    const angle = openProgress.current * (Math.PI / 2.5);
    if (leftRef.current) leftRef.current.rotation.y = -angle;
    if (rightRef.current) rightRef.current.rotation.y = angle;
  });

  return (
    <group position={position}>
      {/* Postes de la puerta */}
      <mesh position={[-0.5, 0.25, 0]} castShadow>
        <boxGeometry args={[0.1, 0.55, 0.1]} />
        <meshStandardMaterial color="#805020" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 0.25, 0]} castShadow>
        <boxGeometry args={[0.1, 0.55, 0.1]} />
        <meshStandardMaterial color="#805020" roughness={0.8} />
      </mesh>
      {/* Puerta izquierda (pivot desde el poste izquierdo) */}
      <group ref={leftRef} position={[-0.5, 0, 0]}>
        <mesh position={[0.25, 0.35, 0]}>
          <boxGeometry args={[0.45, 0.06, 0.04]} />
          <meshStandardMaterial color="#c09040" />
        </mesh>
        <mesh position={[0.25, 0.15, 0]}>
          <boxGeometry args={[0.45, 0.06, 0.04]} />
          <meshStandardMaterial color="#c09040" />
        </mesh>
      </group>
      {/* Puerta derecha (pivot desde el poste derecho) */}
      <group ref={rightRef} position={[0.5, 0, 0]}>
        <mesh position={[-0.25, 0.35, 0]}>
          <boxGeometry args={[0.45, 0.06, 0.04]} />
          <meshStandardMaterial color="#c09040" />
        </mesh>
        <mesh position={[-0.25, 0.15, 0]}>
          <boxGeometry args={[0.45, 0.06, 0.04]} />
          <meshStandardMaterial color="#c09040" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Pond3D ─────────────────────────────────────────────────────────

function Pond3D({ position }: { position: [number, number, number] }) {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = position[1] + 0.02 + Math.sin(state.clock.elapsedTime * 1.5) * 0.01;
    }
  });
  return (
    <group>
      <mesh position={[position[0], position[1] - 0.05, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 16]} />
        <meshStandardMaterial color="#808890" roughness={0.9} />
      </mesh>
      <mesh ref={waterRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 16]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} metalness={0.1} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ─── 3D Cow Character with State-Driven Animations ──────────────────

type CowCharacterProps = {
  targetPosition: [number, number, number];
  bodyColor: string;
  spotColor: string;
  name: string;
  visualStatus: RanchVisualStatus;
  activityLabel: string;
  toolName: string | null;
};

function CowCharacter3D({ targetPosition, bodyColor, spotColor, name, visualStatus, activityLabel, toolName }: CowCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  // Ref para la posición destino (evita que React sobreescriba la posición al re-renderizar)
  const targetRef = useRef(new THREE.Vector3(...targetPosition));
  const isWalkingRef = useRef(false);
  const initializedRef = useRef(false);

  // Actualizar target cuando cambia la prop
  useEffect(() => {
    targetRef.current.set(...targetPosition);
  }, [targetPosition[0], targetPosition[1], targetPosition[2]]);

  useFrame((clock) => {
    if (!groupRef.current) return;
    const t = clock.clock.elapsedTime;
    const pos = groupRef.current.position;

    // Inicializar la posición una sola vez
    if (!initializedRef.current) {
      pos.copy(targetRef.current);
      initializedRef.current = true;
    }

    // Smooth position lerp (no usa el prop, solo targetRef)
    const dx = targetRef.current.x - pos.x;
    const dz = targetRef.current.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    isWalkingRef.current = dist > 0.05;

    if (isWalkingRef.current) {
      // Lerp con velocidad adaptativa
      const speed = Math.min(0.08, dist * 0.04 + 0.01);
      pos.x += dx * speed;
      pos.z += dz * speed;

      // Rotar hacia la dirección de movimiento
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y += (angle - groupRef.current.rotation.y) * 0.1;

      // Animación de caminar: balanceo de patas
      pos.y = Math.abs(Math.sin(t * 8)) * 0.04;
      if (bodyGroupRef.current) {
        bodyGroupRef.current.rotation.z = Math.sin(t * 6) * 0.06;
      }
    } else {
      // Cuando llega al destino, resetear Y y animación
      pos.y += (0 - pos.y) * 0.1;

      // Per-state animations (solo cuando no está caminando)
      switch (visualStatus) {
        case "thinking":
          if (headRef.current) {
            headRef.current.rotation.x = Math.sin(t * 1.5) * 0.15;
            headRef.current.rotation.z = Math.sin(t * 0.8) * 0.05;
          }
          if (bodyGroupRef.current) {
            bodyGroupRef.current.position.y = Math.sin(t * 1.5) * 0.02;
            bodyGroupRef.current.rotation.z = 0;
          }
          break;
        case "tool_calling":
          pos.y = Math.abs(Math.sin(t * 6)) * 0.06;
          if (bodyGroupRef.current) {
            bodyGroupRef.current.rotation.z = Math.sin(t * 8) * 0.04;
          }
          break;
        case "speaking":
          if (headRef.current) {
            headRef.current.rotation.x = Math.sin(t * 4) * 0.1;
          }
          if (bodyGroupRef.current) {
            bodyGroupRef.current.position.y = Math.sin(t * 2) * 0.015;
            bodyGroupRef.current.rotation.z = 0;
          }
          break;
        case "error":
          pos.x = targetRef.current.x + Math.sin(t * 20) * 0.03;
          break;
        case "spawning": {
          const s = Math.min(1, clock.clock.elapsedTime * 1.5);
          const bounce = 1 + 0.1 * Math.sin(s * Math.PI * 3) * (1 - s);
          groupRef.current.scale.setScalar(bounce);
          break;
        }
        default: // idle
          if (bodyGroupRef.current) {
            bodyGroupRef.current.position.y = Math.sin(t * 1.2) * 0.015;
            bodyGroupRef.current.scale.y = 1 + Math.sin(t * 1.2) * 0.02;
            bodyGroupRef.current.rotation.z = 0;
          }
          break;
      }
    }
  });

  const stateColor = STATUS_COLORS[visualStatus];

  return (
    <group ref={groupRef}>
      <group ref={bodyGroupRef}>
        {/* Cuerpo */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.45, 0.3, 0.7]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        {/* Manchas */}
        <mesh position={[0.15, 0.3, 0.1]}>
          <boxGeometry args={[0.18, 0.15, 0.25]} />
          <meshStandardMaterial color={spotColor} roughness={0.8} />
        </mesh>
        {/* Cabeza */}
        <mesh ref={headRef} position={[0, 0.35, 0.35]} castShadow>
          <boxGeometry args={[0.3, 0.25, 0.25]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        {/* Hocico */}
        <mesh position={[0, 0.3, 0.5]}>
          <boxGeometry args={[0.2, 0.12, 0.1]} />
          <meshStandardMaterial color="#ffccaa" />
        </mesh>
        {/* Ojos */}
        <mesh position={[-0.08, 0.4, 0.48]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.08, 0.4, 0.48]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Cuernos */}
        <mesh position={[-0.12, 0.5, 0.35]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.03, 0.15, 4]} />
          <meshStandardMaterial color="#c4a060" />
        </mesh>
        <mesh position={[0.12, 0.5, 0.35]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.03, 0.15, 4]} />
          <meshStandardMaterial color="#c4a060" />
        </mesh>
        {/* Patas */}
        {([[-0.15, 0, 0.2], [0.15, 0, 0.2], [-0.15, 0, -0.2], [0.15, 0, -0.2]] as [number, number, number][]).map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <boxGeometry args={[0.08, 0.2, 0.08]} />
            <meshStandardMaterial color={bodyColor} roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Status indicator (3D) — floating ring */}
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.26, 16]} />
        <meshStandardMaterial
          color={stateColor}
          emissive={stateColor}
          emissiveIntensity={visualStatus === "idle" ? 0.1 : 0.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Thinking dots (3D) */}
      {visualStatus === "thinking" && (
        <Html position={[0, 0.85, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div style={{ display: "flex", gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: "#3b82f6",
                animation: `ranch-dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </Html>
      )}

      {/* Tool badge (3D) */}
      {visualStatus === "tool_calling" && (
        <Html position={[0, 0.9, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <span style={{
            fontSize: 9, fontWeight: 700, fontFamily: "monospace",
            color: "#fff", background: "#f97316", borderRadius: 4, padding: "1px 6px",
            whiteSpace: "nowrap",
          }}>
            ⚙️ {toolName ?? "tool"}
          </span>
        </Html>
      )}

      {/* Speaking bubble (3D) */}
      {visualStatus === "speaking" && (
        <Html position={[0, 0.9, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div style={{
            width: 18, height: 14, background: "#a855f7", borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 3, height: 3, borderRadius: "50%", background: "#fff",
                animation: `ranch-speak-dot 0.8s ease ${i * 0.12}s infinite`,
              }} />
            ))}
          </div>
        </Html>
      )}

      {/* Error badge (3D) */}
      {visualStatus === "error" && (
        <Html position={[0, 0.9, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", background: "#ef4444",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: 12,
          }}>!</div>
        </Html>
      )}

      {/* Name + status label */}
      <Html position={[0, 0.75, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(0,0,0,0.7)", color: "#fff",
          padding: "2px 6px", borderRadius: 3,
          fontSize: 10, fontFamily: "monospace", fontWeight: 700,
          whiteSpace: "nowrap", textAlign: "center", lineHeight: 1.4,
        }}>
          <div>{name}</div>
          <div style={{ fontSize: 8, color: stateColor }}>{activityLabel}</div>
        </div>
      </Html>

      {/* Sombra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.3, 8]} />
        <meshStandardMaterial color="black" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ─── Scene Content ──────────────────────────────────────────────────

function SceneContent({ agents, sessionActivity }: { agents: GatewayAgentRow[]; sessionActivity: SessionActivityResult | null }) {
  // Re-render periódico para cycling
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 800);
    return () => clearInterval(id);
  }, []);

  // Mapa de estado base
  const agentStateMap = useMemo(() => {
    const map = new Map<string, "processing" | "waiting" | "idle">();
    if (sessionActivity) {
      for (const s of sessionActivity.sessions) {
        const agentId = s.key.split(":")[1] ?? s.key;
        const cur = map.get(agentId);
        if (!cur || s.state === "processing") map.set(agentId, s.state);
      }
    }
    return map;
  }, [sessionActivity]);

  // Determinar si la puerta del corral debe estar abierta
  // La puerta se abre si algún animal está en zona tool_calling (cerca del corral)
  const gateOpen = useMemo(() => {
    for (const agent of agents) {
      const baseState = agentStateMap.get(agent.id) ?? "idle";
      if (baseState === "processing") {
        const idx = agents.indexOf(agent);
        const sub = getProcessingSubState(idx);
        if (sub.status === "tool_calling") return true;
      }
    }
    return false;
  }, [agents, agentStateMap]);

  // Tree positions
  const treePositions = useMemo<[number, number, number][]>(() => [
    [-8, 0, -8], [-6, 0, -9], [-3, 0, -8.5], [2, 0, -9], [5, 0, -8],
    [8, 0, -7], [9, 0, -4], [9, 0, 0], [9, 0, 4], [9, 0, 7],
    [-9, 0, -4], [-9, 0, 2], [-9, 0, 6], [-8, 0, 8],
    [-4, 0, 9], [0, 0, 9], [4, 0, 9], [7, 0, 8], [9, 0, 8],
  ], []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 8]} intensity={1.2} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-far={30} shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12} shadow-camera-bottom={-12} />

      <OrbitControls enableRotate enablePan enableZoom
        minPolarAngle={Math.PI / 8} maxPolarAngle={Math.PI / 2.5}
        minDistance={5} maxDistance={25} target={[0, 0, 0]}
        enableDamping dampingFactor={0.08} />

      <Ground />

      {/* Edificios */}
      <Barn position={[-3, 0, -4]} />
      <Windmill position={[6, 0, -5]} />
      <SmallHouse position={[-6, 0, 2]} roofColor="#48a838" />
      <SmallHouse position={[2, 0, 5]} roofColor="#d04040" />
      <SmallHouse position={[6, 0, 4]} roofColor="#4080d0" />

      <Pond3D position={[-4, 0.02, 4]} />

      {/* Cerca con puerta */}
      <Fence3D from={[2, 0, -6]} to={[8, 0, -6]} />
      <Fence3D from={[8, 0, -6]} to={[8, 0, -2]} />
      {/* Cerca inferior dividida en dos con puerta en el medio */}
      <Fence3D from={[8, 0, -2]} to={[5.5, 0, -2]} />
      <FenceGate3D position={[5, 0, -2]} open={gateOpen} />
      <Fence3D from={[4.5, 0, -2]} to={[2, 0, -2]} />
      <Fence3D from={[2, 0, -2]} to={[2, 0, -6]} />

      {/* Árboles */}
      {treePositions.map((pos, i) => (
        <Tree3D key={`tree-${i}`} position={pos} scale={0.7 + (i % 3) * 0.3} />
      ))}

      {/* Animales con state-driven behaviors */}
      {agents.map((agent, idx) => {
        const agentId = agent.id;
        const name = agent.identity?.name ?? agent.name ?? agentId;
        const baseState = agentStateMap.get(agentId) ?? "idle";
        const pal = PALETTES_3D[idx % PALETTES_3D.length];

        let visualStatus: RanchVisualStatus;
        let toolName: string | null = null;

        if (baseState === "processing") {
          const sub = getProcessingSubState(idx);
          visualStatus = sub.status;
          toolName = sub.toolName;
        } else if (baseState === "waiting") {
          visualStatus = "idle";
        } else {
          visualStatus = "idle";
        }

        const [zoneX, zoneZ] = ZONE_3D[visualStatus];
        const offsetX = (idx % 3) * 1.2 - 1.2;
        const offsetZ = Math.floor(idx / 3) * 1.0;
        const pos: [number, number, number] = [zoneX + offsetX, 0, zoneZ + offsetZ];

        const activityLabel = baseState === "waiting" ? "等待接单" : ACTIVITY_LABELS[visualStatus];

        return (
          <CowCharacter3D
            key={agentId}
            targetPosition={pos}
            bodyColor={pal.body}
            spotColor={pal.spot}
            name={name}
            visualStatus={visualStatus}
            activityLabel={activityLabel}
            toolName={toolName}
          />
        );
      })}

      {/* Luz ambiental hemisférica en lugar de Environment preset (evita carga async HDR) */}
      <hemisphereLight args={["#87ceeb", "#8db651", 0.6]} />
    </>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────

export type RanchScene3DProps = {
  agents: GatewayAgentRow[];
  sessionActivity: SessionActivityResult | null;
};

export function RanchScene3D({ agents, sessionActivity }: RanchScene3DProps) {
  return (
    <div className="ranch-scene ranch-scene--3d">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        shadows
        camera={{ fov: 40, position: [12, 10, 12], near: 0.1, far: 100 }}
        style={{ imageRendering: "auto" }}
      >
        <color attach="background" args={["#87ceeb"]} />
        <fog attach="fog" args={["#87ceeb", 20, 40]} />
        <SceneContent agents={agents} sessionActivity={sessionActivity} />
      </Canvas>
    </div>
  );
}
