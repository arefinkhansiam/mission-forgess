<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Mission Forge gameplay phases in the existing single-screen store and overlay phase-specific interface on the 3D Canvas, so customization and flight share the same game state.
- Keep destination, objective, route choice and preview, resource decisions, overview, craft preset, and hangar as separate phases in the shared game store, so each choice is legible without losing mission continuity.
- Use NASA Blue Marble as a locally managed asset pointer on the Earth mesh, so the globe remains source-attributed and does not rely on runtime third-party image hosts.
- NASA APIs are called only through `getNasa` in src/lib/nasa.functions.ts with a `nasa_cache` table and labeled demo fallback, so keys stay server-side and gameplay never blocks on NASA.
- `.mf-game-viewport` uses a rotated full-screen landscape game stage on portrait devices; gameplay remains in one store with distinct phase overlays, because the requested game format is horizontal like a video.
- UI text lives in src/locales/resources.ts (i18next, 6 languages) and is read via `t()`; numbers stay in nasa-data/mission-sim so translations never carry science values.
