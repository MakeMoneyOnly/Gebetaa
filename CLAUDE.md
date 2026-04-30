# CLAUDE.md

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. The skill has multi-step workflows, checklists, and quality gates that produce better results than an ad-hoc answer. When in doubt, invoke the skill. A false positive is cheaper than a false negative.

Key routing rules:

- Product ideas, "is this worth building", brainstorming → invoke /gstack-office-hours
- Strategy, scope, "think bigger", "what should we build" → invoke /gstack-plan-ceo-review
- Architecture, "does this design make sense" → invoke /gstack-plan-eng-review
- Design system, brand, "how should this look" → invoke /gstack-design-consultation
- Design review of a plan → invoke /gstack-plan-design-review
- Developer experience of a plan → invoke /gstack-plan-devex-review
- "Review everything", full review pipeline → invoke /gstack-autoplan
- Bugs, errors, "why is this broken", "wtf", "this doesn't work" → invoke /gstack-investigate
- Test the site, find bugs, "does this work" → invoke /gstack-qa (or /gstack-qa-only for report only)
- Code review, check the diff, "look at my changes" → invoke /gstack-review
- Visual polish, design audit, "this looks off" → invoke /gstack-design-review
- Developer experience audit, try onboarding → invoke /gstack-devex-review
- Ship, deploy, create a PR, "send it" → invoke /gstack-ship
- Merge + deploy + verify → invoke /gstack-land-and-deploy
- Configure deployment → invoke /gstack-setup-deploy
- Post-deploy monitoring → invoke /gstack-canary
- Update docs after shipping → invoke /gstack-document-release
- Weekly retro, "how'd we do" → invoke /gstack-retro
- Second opinion, codex review → invoke /gstack-codex
- Safety mode, careful mode, lock it down → invoke /gstack-careful or /gstack-guard
- Restrict edits to a directory → invoke /gstack-freeze or /gstack-unfreeze
- Upgrade gstack → invoke /gstack-upgrade
- Save progress, "save my work" → invoke /gstack-context-save
- Resume, restore, "where was I" → invoke /gstack-context-restore
- Security audit, OWASP, "is this secure" → invoke /gstack-cso
- Make a PDF, document, publication → invoke /gstack-make-pdf
- Launch real browser for QA → invoke /gstack-open-gstack-browser
- Import cookies for authenticated testing → invoke /gstack-setup-browser-cookies
- Performance regression, page speed, benchmarks → invoke /gstack-benchmark
- Review what gstack has learned → invoke /gstack-learn
- Tune question sensitivity → invoke /gstack-plan-tune
- Code quality dashboard → invoke /gstack-health

## Agent skills

### Issue tracker

GitHub (https://github.com/MakeMoneyOnly/lole.git). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (needs-triage, ready-for-agent, etc.). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. Root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
