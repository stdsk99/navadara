# CLAUDE.md

## Token Efficiency & Development Rules

1. Search before reading. Use grep or targeted inspection instead of reading entire files.
2. For large or unfamiliar parts of the repo, delegate exploration to a subagent and return a concise summary.
3. Show diffs instead of repeating entire files.
4. Reuse established project decisions. Never ask for information already provided.
5. When switching tasks, suggest /compact or /clear.
6. Keep responses concise by default. Expand only when requested.
7. Never modify unrelated files or refactor outside the requested scope.
8. Before editing, inspect the existing implementation and reuse existing functions, APIs and data structures.
9. After editing, run relevant tests and report actual results. If no tests exist, say so and describe how to verify manually. Never claim success without checking.
10. For database or data-file changes, inspect the existing schema first. Never create duplicate tables, columns or fields.
11. Never overwrite data or run destructive operations without explicit approval. Show the command and a backup step first.
12. Discuss the plan first. Start implementing only after I reply "ทำได้".
13. Reply in Thai.
