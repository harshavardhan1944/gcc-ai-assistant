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

## Project rules
- Rankings, costs and eligibility are computed only in `src/lib/score.ts` from `src/data/cities.ts`; AI calls (server-only in `src/lib/ai.server.ts`) may only interpret intent and explain — never produce figures.
- Database tables have RLS on with no public policies; all reads/writes go through server functions in `src/lib/gcc.functions.ts` using the admin client, because the app has no sign-in.
