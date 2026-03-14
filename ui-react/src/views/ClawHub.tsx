import React, { useEffect } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { LitBridge } from "../components/LitBridge.tsx";
import { renderClawhubMarket } from "../lib/views/clawhub-market.ts";
import { searchClawhub, installClawhubSkill, loadClawhubToken, saveClawhubToken } from "../lib/controllers/clawhub.ts";

export function ClawHubView() {
  const s = useAppStore;
  const query = s((st) => st.clawhubQuery);
  const results = s((st) => st.clawhubResults);
  const loading = s((st) => st.clawhubLoading);
  const installing = s((st) => st.clawhubInstalling);
  const error = s((st) => st.clawhubError);
  const message = s((st) => st.clawhubMessage);
  const tokenMasked = s((st) => st.clawhubTokenMasked);
  const tokenDraft = s((st) => st.clawhubTokenDraft);
  const tokenSaving = s((st) => st.clawhubTokenSaving);

  // Cargar token automáticamente al montar si aún no se ha cargado
  useEffect(() => {
    if (tokenMasked === null && !loading) {
      void loadClawhubToken(getReactiveState() as never);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const template = React.useMemo(
    () =>
      renderClawhubMarket({
        query,
        results: results as never,
        loading,
        installing,
        error,
        message,
        tokenMasked,
        tokenDraft,
        tokenSaving,
        onQueryChange: (next: string) => {
          const rs = getReactiveState();
          rs.clawhubQuery = next;
        },
        onSearch: (q: string) => void searchClawhub(getReactiveState() as never, q),
        onInstall: (slug: string) => void installClawhubSkill(getReactiveState() as never, slug),
        onTokenDraftChange: (next: string) => {
          const rs = getReactiveState();
          rs.clawhubTokenDraft = next;
        },
        onTokenSave: () => void saveClawhubToken(getReactiveState() as never),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, results, loading, installing, error, message, tokenMasked, tokenDraft, tokenSaving],
  );

  return <LitBridge template={template} />;
}
