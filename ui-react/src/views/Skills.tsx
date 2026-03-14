import React, { useMemo } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { LitBridge } from "../components/LitBridge.tsx";
import { renderSkills } from "../lib/views/skills.ts";
import { loadSkills, installSkill, saveSkillApiKey, updateSkillEdit, updateSkillEnabled } from "../lib/controllers/skills.ts";

export function SkillsView() {
  const loading = useAppStore((s) => s.skillsLoading);
  const report = useAppStore((s) => s.skillsReport);
  const error = useAppStore((s) => s.skillsError);
  const filter = useAppStore((s) => s.skillsFilter);
  const edits = useAppStore((s) => s.skillEdits);
  const busyKey = useAppStore((s) => s.skillsBusyKey);
  const messages = useAppStore((s) => s.skillMessages);
  const set = useAppStore((s) => s.set);

  const template = useMemo(
    () =>
      renderSkills({
        loading,
        report,
        error,
        filter,
        edits,
        busyKey,
        messages,
        onFilterChange: (next: string) => set({ skillsFilter: next }),
        onRefresh: () => void loadSkills(getReactiveState() as never, { clearMessages: true }),
        onToggle: (key: string, enabled: boolean) =>
          void updateSkillEnabled(getReactiveState() as never, key, enabled),
        onEdit: (key: string, value: string) =>
          void updateSkillEdit(getReactiveState() as never, key, value),
        onSaveKey: (key: string) =>
          void saveSkillApiKey(getReactiveState() as never, key),
        onInstall: (key: string, name: string, installId: string) =>
          void installSkill(getReactiveState() as never, key, name, installId),
      }),
    [loading, report, error, filter, edits, busyKey, messages, set],
  );

  return <LitBridge template={template} />;
}
