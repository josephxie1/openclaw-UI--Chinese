import React from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { LitBridge } from "../components/LitBridge.tsx";
import { renderCron } from "../lib/views/cron.ts";
import {
  loadCronRuns,
  loadMoreCronJobs,
  loadMoreCronRuns,
  reloadCronJobs,
  toggleCronJob,
  runCronJob,
  removeCronJob,
  addCronJob,
  startCronEdit,
  startCronClone,
  cancelCronEdit,
  validateCronForm,
  hasCronFormErrors,
  normalizeCronFormState,
  updateCronJobsFilter,
  updateCronRunsFilter,
  getVisibleCronJobs,
} from "../lib/controllers/cron.ts";
import { resolveConfiguredCronModelSuggestions } from "../lib/views/agents-utils.ts";
import type { CronJob } from "../lib/types.ts";
import type { CronFormState } from "../lib/ui-types.ts";

// ─── Constantes de sugerencias ──────────────────────────────
const CRON_THINKING_SUGGESTIONS = ["off", "minimal", "low", "medium", "high"];
const CRON_TIMEZONE_SUGGESTIONS = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
];

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function normalizeSuggestionValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((v) => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

export function CronView() {
  const s = useAppStore;
  const loading = s((st) => st.cronLoading);
  const jobsLoadingMore = s((st) => st.cronJobsLoadingMore);
  const status = s((st) => st.cronStatus);
  const jobs = s((st) => st.cronJobs);
  const jobsTotal = s((st) => st.cronJobsTotal);
  const jobsHasMore = s((st) => st.cronJobsHasMore);
  const jobsQuery = s((st) => st.cronJobsQuery);
  const jobsEnabledFilter = s((st) => st.cronJobsEnabledFilter);
  const jobsScheduleKindFilter = s((st) => st.cronJobsScheduleKindFilter);
  const jobsLastStatusFilter = s((st) => st.cronJobsLastStatusFilter);
  const jobsSortBy = s((st) => st.cronJobsSortBy);
  const jobsSortDir = s((st) => st.cronJobsSortDir);
  const cronError = s((st) => st.cronError);
  const cronForm = s((st) => st.cronForm);
  const cronFieldErrors = s((st) => st.cronFieldErrors);
  const cronEditingJobId = s((st) => st.cronEditingJobId);
  const cronRuns = s((st) => st.cronRuns);
  const cronRunsTotal = s((st) => st.cronRunsTotal);
  const cronRunsHasMore = s((st) => st.cronRunsHasMore);
  const cronRunsLoadingMore = s((st) => st.cronRunsLoadingMore);
  const cronRunsJobId = s((st) => st.cronRunsJobId);
  const cronRunsScope = s((st) => st.cronRunsScope);
  const cronRunsStatuses = s((st) => st.cronRunsStatuses);
  const cronRunsDeliveryStatuses = s((st) => st.cronRunsDeliveryStatuses);
  const cronRunsStatusFilter = s((st) => st.cronRunsStatusFilter);
  const cronRunsQuery = s((st) => st.cronRunsQuery);
  const cronRunsSortDir = s((st) => st.cronRunsSortDir);
  const cronBusy = s((st) => st.cronBusy);
  const basePath = s((st) => st.basePath);
  const channelsSnapshot = s((st) => st.channelsSnapshot);
  const agentsList = s((st) => st.agentsList);
  const configForm = s((st) => st.configForm);
  const cronModelSuggestionsStore = s((st) => st.cronModelSuggestions);
  const set = s((st) => st.set);

  const template = React.useMemo(() => {
    // Computar valores derivados como en el original
    const visibleJobs = getVisibleCronJobs(s.getState() as never);

    // Sugerencias de agentes
    const cronAgentSuggestions = Array.from(
      new Set(
        [
          ...(agentsList?.agents?.map((entry) => entry.id.trim()) ?? []),
          ...jobs
            .map((job) => (typeof job.agentId === "string" ? job.agentId.trim() : ""))
            .filter(Boolean),
        ].filter(Boolean),
      ),
    ).toSorted((a, b) => a.localeCompare(b));

    // Sugerencias de modelos
    const cronModelSuggestions = Array.from(
      new Set(
        [
          ...cronModelSuggestionsStore,
          ...resolveConfiguredCronModelSuggestions(configForm),
          ...jobs
            .map((job) => {
              if (job.payload.kind !== "agentTurn" || typeof job.payload.model !== "string") return "";
              return job.payload.model.trim();
            })
            .filter(Boolean),
        ].filter(Boolean),
      ),
    ).toSorted((a, b) => a.localeCompare(b));

    // Canales
    const channels = channelsSnapshot?.channelMeta?.length
      ? channelsSnapshot.channelMeta.map((entry) => entry.id)
      : (channelsSnapshot?.channelOrder ?? []);
    const channelLabels = channelsSnapshot?.channelLabels ?? {};
    const channelMeta = channelsSnapshot?.channelMeta ?? [];

    // Sugerencias de delivery
    const selectedDeliveryChannel =
      cronForm.deliveryChannel && cronForm.deliveryChannel.trim()
        ? cronForm.deliveryChannel.trim()
        : "last";
    const jobToSuggestions = jobs
      .map((job) => normalizeSuggestionValue((job as { delivery?: { to?: unknown } }).delivery?.to))
      .filter(Boolean);
    const accountToSuggestions = (
      selectedDeliveryChannel === "last"
        ? Object.values(channelsSnapshot?.channelAccounts ?? {}).flat()
        : (channelsSnapshot?.channelAccounts?.[selectedDeliveryChannel] ?? [])
    )
      .flatMap((account: { accountId?: unknown; name?: unknown }) => [
        normalizeSuggestionValue(account.accountId),
        normalizeSuggestionValue(account.name),
      ])
      .filter(Boolean);
    const rawDeliveryToSuggestions = uniquePreserveOrder([...jobToSuggestions, ...accountToSuggestions]);
    const accountSuggestionsComputed = uniquePreserveOrder(accountToSuggestions);
    const deliveryToSuggestions =
      cronForm.deliveryMode === "webhook"
        ? rawDeliveryToSuggestions.filter((v) => isHttpUrl(v))
        : rawDeliveryToSuggestions;

    return renderCron({
      basePath,
      loading,
      jobsLoadingMore,
      status,
      jobs: visibleJobs,
      jobsTotal,
      jobsHasMore,
      jobsQuery,
      jobsEnabledFilter,
      jobsScheduleKindFilter,
      jobsLastStatusFilter,
      jobsSortBy,
      jobsSortDir,
      error: cronError,
      busy: cronBusy,
      form: cronForm,
      fieldErrors: cronFieldErrors,
      canSubmit: !hasCronFormErrors(cronFieldErrors),
      editingJobId: cronEditingJobId,
      channels,
      channelLabels,
      channelMeta,
      runsJobId: cronRunsJobId,
      runs: cronRuns,
      runsTotal: cronRunsTotal,
      runsHasMore: cronRunsHasMore,
      runsLoadingMore: cronRunsLoadingMore,
      runsScope: cronRunsScope,
      runsStatuses: cronRunsStatuses,
      runsDeliveryStatuses: cronRunsDeliveryStatuses,
      runsStatusFilter: cronRunsStatusFilter,
      runsQuery: cronRunsQuery ?? "",
      runsSortDir: cronRunsSortDir,
      agentSuggestions: cronAgentSuggestions,
      modelSuggestions: cronModelSuggestions,
      thinkingSuggestions: CRON_THINKING_SUGGESTIONS,
      timezoneSuggestions: CRON_TIMEZONE_SUGGESTIONS,
      deliveryToSuggestions,
      accountSuggestions: accountSuggestionsComputed,
      // ─── Callbacks ──────────────────────────────────────────
      onFormChange: (patch: Partial<CronFormState>) => {
        const rs = getReactiveState();
        rs.cronForm = normalizeCronFormState({ ...rs.cronForm, ...patch });
        rs.cronFieldErrors = validateCronForm(rs.cronForm);
      },
      onRefresh: () => {
        const rs = getReactiveState();
        // Usa loadCron que es la función del store
        void import("../lib/app-settings.ts").then(({ loadCron }) => {
          void loadCron(rs as never);
        });
      },
      onAdd: () => void addCronJob(getReactiveState() as never),
      onEdit: (job: CronJob) => void startCronEdit(getReactiveState() as never, job),
      onClone: (job: CronJob) => void startCronClone(getReactiveState() as never, job),
      onCancelEdit: () => void cancelCronEdit(getReactiveState() as never),
      onToggle: (job: CronJob, enabled: boolean) => void toggleCronJob(getReactiveState() as never, job, enabled),
      onRun: (job: CronJob, mode: "force" | "due") => void runCronJob(getReactiveState() as never, job, mode ?? "force"),
      onRemove: (job: CronJob) => void removeCronJob(getReactiveState() as never, job),
      onLoadRuns: async (jobId: string) => {
        const rs = getReactiveState();
        updateCronRunsFilter(rs as never, { cronRunsScope: "job" });
        await loadCronRuns(rs as never, jobId);
      },
      onLoadMoreJobs: () => void loadMoreCronJobs(getReactiveState() as never),
      onJobsFiltersChange: async (patch: Record<string, unknown>) => {
        const rs = getReactiveState();
        updateCronJobsFilter(rs as never, patch);
        const shouldReload =
          typeof patch.cronJobsQuery === "string" ||
          Boolean(patch.cronJobsEnabledFilter) ||
          Boolean(patch.cronJobsSortBy) ||
          Boolean(patch.cronJobsSortDir);
        if (shouldReload) {
          await reloadCronJobs(rs as never);
        }
      },
      onJobsFiltersReset: async () => {
        const rs = getReactiveState();
        updateCronJobsFilter(rs as never, {
          cronJobsQuery: "",
          cronJobsEnabledFilter: "all",
          cronJobsScheduleKindFilter: "all",
          cronJobsLastStatusFilter: "all",
          cronJobsSortBy: "nextRunAtMs",
          cronJobsSortDir: "asc",
        });
        await reloadCronJobs(rs as never);
      },
      onLoadMoreRuns: () => void loadMoreCronRuns(getReactiveState() as never),
      onRunsFiltersChange: async (patch: Record<string, unknown>) => {
        const rs = getReactiveState();
        updateCronRunsFilter(rs as never, patch);
        if (rs.cronRunsScope === "all") {
          await loadCronRuns(rs as never, null);
          return;
        }
        await loadCronRuns(rs as never, rs.cronRunsJobId);
      },
    } as unknown as Parameters<typeof renderCron>[0]);
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [loading, jobsLoadingMore, status, jobs, jobsTotal, jobsHasMore, jobsQuery,
   jobsEnabledFilter, jobsScheduleKindFilter, jobsLastStatusFilter, jobsSortBy, jobsSortDir,
   cronError, cronForm, cronFieldErrors, cronEditingJobId,
   cronRuns, cronRunsTotal, cronRunsHasMore, cronRunsLoadingMore, cronRunsJobId,
   cronRunsScope, cronRunsStatuses, cronRunsDeliveryStatuses, cronRunsStatusFilter,
   cronRunsQuery, cronRunsSortDir,
   cronBusy, basePath, channelsSnapshot, agentsList, configForm, cronModelSuggestionsStore],
  );

  return <LitBridge template={template} />;
}
