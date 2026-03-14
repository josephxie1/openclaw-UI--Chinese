import React from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { LitBridge } from "../components/LitBridge.tsx";
import { renderNodes, renderChannelPairings } from "../lib/views/nodes.ts";
import { loadNodes } from "../lib/controllers/nodes.ts";
import {
  approveDevicePairing,
  loadDevices,
  rejectDevicePairing,
  revokeDeviceToken,
  rotateDeviceToken,
} from "../lib/controllers/devices.ts";
import { approveChannelPairing, loadChannelPairings } from "../lib/controllers/channel-pairing.ts";
import {
  loadConfig,
  saveConfig,
  updateConfigFormValue,
  removeConfigFormValue,
} from "../lib/controllers/config.ts";
import {
  loadExecApprovals,
  saveExecApprovals,
  updateExecApprovalsFormValue,
  removeExecApprovalsFormValue,
} from "../lib/controllers/exec-approvals.ts";

export function NodesView() {
  const s = useAppStore;
  const loading = s((st) => st.nodesLoading);
  const nodes = s((st) => st.nodes);
  const devicesLoading = s((st) => st.devicesLoading);
  const devicesError = s((st) => st.devicesError);
  const devicesList = s((st) => st.devicesList);
  const configForm = s((st) => st.configForm);
  const configLoading = s((st) => st.configLoading);
  const configSaving = s((st) => st.configSaving);
  const configFormDirty = s((st) => st.configFormDirty);
  const configFormMode = s((st) => st.configFormMode);
  const channelPairingsLoading = s((st) => st.channelPairingsLoading);
  const channelPairings = s((st) => st.channelPairings);
  const channelPairingsError = s((st) => st.channelPairingsError);
  const execApprovalsLoading = s((st) => st.execApprovalsLoading);
  const execApprovalsSaving = s((st) => st.execApprovalsSaving);
  const execApprovalsDirty = s((st) => st.execApprovalsDirty);
  const execApprovalsSnapshot = s((st) => st.execApprovalsSnapshot);
  const execApprovalsForm = s((st) => st.execApprovalsForm);
  const execApprovalsSelectedAgent = s((st) => st.execApprovalsSelectedAgent);
  const execApprovalsTarget = s((st) => st.execApprovalsTarget);
  const execApprovalsTargetNodeId = s((st) => st.execApprovalsTargetNodeId);
  const configSnapshot = s((st) => st.configSnapshot);

  const nodesTemplate = React.useMemo(
    () =>
      renderNodes({
        loading,
        nodes,
        devicesLoading,
        devicesError,
        devicesList,
        configForm:
          configForm ??
          ((configSnapshot as Record<string, unknown> | null)?.config as Record<string, unknown> | null) ??
          null,
        configLoading,
        configSaving,
        configDirty: configFormDirty,
        configFormMode,
        execApprovalsLoading,
        execApprovalsSaving,
        execApprovalsDirty,
        execApprovalsSnapshot,
        execApprovalsForm,
        execApprovalsSelectedAgent,
        execApprovalsTarget,
        execApprovalsTargetNodeId,
        onRefresh: () => void loadNodes(getReactiveState() as never),
        onDevicesRefresh: () => void loadDevices(getReactiveState() as never),
        onDeviceApprove: (requestId: string) =>
          void approveDevicePairing(getReactiveState() as never, requestId),
        onDeviceReject: (requestId: string) =>
          void rejectDevicePairing(getReactiveState() as never, requestId),
        onDeviceRotate: (deviceId: string, role: string, scopes?: string[]) =>
          void rotateDeviceToken(getReactiveState() as never, { deviceId, role, scopes }),
        onDeviceRevoke: (deviceId: string, role: string) =>
          void revokeDeviceToken(getReactiveState() as never, { deviceId, role }),
        onLoadConfig: () => void loadConfig(getReactiveState() as never),
        onLoadExecApprovals: () => {
          const rs = getReactiveState();
          const target =
            rs.execApprovalsTarget === "node" && rs.execApprovalsTargetNodeId
              ? { kind: "node" as const, nodeId: rs.execApprovalsTargetNodeId }
              : { kind: "gateway" as const };
          void loadExecApprovals(rs as never, target);
        },
        onBindDefault: (nodeId: string | null) => {
          const rs = getReactiveState();
          if (nodeId) {
            updateConfigFormValue(rs as never, ["tools", "exec", "node"], nodeId);
          } else {
            removeConfigFormValue(rs as never, ["tools", "exec", "node"]);
          }
        },
        onBindAgent: (agentIndex: number, nodeId: string | null) => {
          const rs = getReactiveState();
          const basePath = ["agents", "list", agentIndex, "tools", "exec", "node"] as Array<string | number>;
          if (nodeId) {
            updateConfigFormValue(rs as never, basePath, nodeId);
          } else {
            removeConfigFormValue(rs as never, basePath);
          }
        },
        onSaveBindings: () => void saveConfig(getReactiveState() as never),
        onExecApprovalsTargetChange: (kind: "gateway" | "node", nodeId: string | null) => {
          const rs = getReactiveState();
          rs.execApprovalsTarget = kind;
          rs.execApprovalsTargetNodeId = nodeId;
          rs.execApprovalsSnapshot = null;
          rs.execApprovalsForm = null;
          rs.execApprovalsDirty = false;
          rs.execApprovalsSelectedAgent = null;
        },
        onExecApprovalsSelectAgent: (agentId: string) => {
          const rs = getReactiveState();
          rs.execApprovalsSelectedAgent = agentId;
        },
        onExecApprovalsPatch: (path: Array<string | number>, value: unknown) =>
          updateExecApprovalsFormValue(getReactiveState() as never, path, value),
        onExecApprovalsRemove: (path: Array<string | number>) =>
          removeExecApprovalsFormValue(getReactiveState() as never, path),
        onSaveExecApprovals: () => {
          const rs = getReactiveState();
          const target =
            rs.execApprovalsTarget === "node" && rs.execApprovalsTargetNodeId
              ? { kind: "node" as const, nodeId: rs.execApprovalsTargetNodeId }
              : { kind: "gateway" as const };
          void saveExecApprovals(rs as never, target);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, nodes, devicesLoading, devicesError, devicesList, configForm, configLoading, configSaving, configFormDirty, configFormMode, configSnapshot, execApprovalsLoading, execApprovalsSaving, execApprovalsDirty, execApprovalsSnapshot, execApprovalsForm, execApprovalsSelectedAgent, execApprovalsTarget, execApprovalsTargetNodeId],
  );

  const pairingsTemplate = React.useMemo(
    () =>
      renderChannelPairings({
        channelPairingsLoading,
        channelPairings,
        channelPairingsError,
        onChannelPairingsRefresh: () => void loadChannelPairings(getReactiveState() as never),
        onChannelPairingApprove: (channel: string, code: string) =>
          void approveChannelPairing(getReactiveState() as never, channel, code),
      }),
    [channelPairingsLoading, channelPairings, channelPairingsError],
  );

  return (
    <>
      <LitBridge template={nodesTemplate} />
      <LitBridge template={pairingsTemplate} />
    </>
  );
}
