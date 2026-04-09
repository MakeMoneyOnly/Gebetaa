Agentic Engineering: Standard Operating Procedure and Template Guide

1. The Agentic Engineering Mental Model

Agentic engineering is the fundamental shift from "using" AI tools as simple autocomplete features to "working with" AI agents as active, autonomous collaborators. To maximize this technology, human developers must transition from individual contributors to Engineering Managers.

The "Junior Developer" Analogy

Think of an AI agent as an energetic, enthusiastic, and extremely well-read junior developer.

- Strengths: They are incredibly fast, lack ego, and possess an astonishing breadth of knowledge across thousands of frameworks and patterns. They will happily rewrite a function six times without fatigue.
- Weaknesses: They lack judgment and business context. They do not understand the architectural "why" behind decisions made months ago. They are prone to being "confidently wrong."

The "Comic Sans" Pitfall

The danger of the junior agent is illustrated by a classic engineering management story: A manager provides a UI wireframe created in a tool like Balsamiq, which uses Comic Sans as a placeholder font. A junior engineer—or an AI agent—lacking context might deliver a production-ready prototype in Comic Sans because "that’s what the spec showed."

Mandate: The human developer must provide the context that isn't in the code. You are responsible for directing the work. Blindly accepting output results in code that is technically correct but contextually wrong.

---

2. The Research-Plan-Implement (RPI) Protocol

Jumping straight into code generation causes wrong assumptions and wasted effort. Adhere to the Research-Plan-Implement (RPI) protocol to ensure the agent understands the problem before a single line of code is written.

Phase 1: Research (Ask Mode)

In this phase, the agent is restricted to "Ask Mode." It must only read and chat; it is prohibited from writing or modifying files.

- Objective: Identify relevant files, map data flows, and brainstorm edge cases.
- The Dexory Rule: "A bad line of research can potentially be hundreds of lines of bad code."
- Requirement: The agent MUST produce a written Research Summary. You must review this summary to ensure the agent’s mental model matches the system’s reality before proceeding.

Phase 2: Plan (Architect Mode)

In "Architect Mode," the agent outlines the specific steps for implementation.

- Objective: The agent MUST create a "Plan File" within a dedicated /plans folder.
- Mandatory Plan Components:
    - A step-by-step list of specific file changes (creations, deletions, or edits).
    - Explicit "In-Scope" vs. "Out-of-Scope" definitions.
    - Mandatory verification and test commands (e.g., npm test or specific curl triggers).

Phase 3: Implement (Code Mode)

Once the plan is approved, the agent enters "Code Mode" to execute changes.

- Requirement: Start a fresh session with only the Plan File as context to keep the "context window" clean.
- Workflow: Command the agent to commit frequently. Treat the local Git history as a "first pull request review." Analyze the agent's work as if you were reviewing a junior's PR before it ever reaches your colleagues.

---

3. Context Hygiene and Session Management

Maintaining a clean context window is the most critical technical skill in agentic engineering.

The 50% Rule and the "Dumb Zone"

Model quality degrades significantly as the context window fills. Once a session passes 50% capacity, the agent enters the "Dumb Zone."

- Technical Root Cause: Because every interaction sends the entire chat history back to the model as input tokens, the reasoning capability is diluted by the sheer volume of previous turns. This also exponentially increases token costs.

MCP Server Management

Model Context Protocol (MCP) servers allow agents to interact with external tools (e.g., Google Search, Postgres, GitHub).

- Mandate: Unused MCP servers MUST be disabled.
- Risk: Every active MCP adds its specific tool definitions to the system prompt. Cluttering the system prompt with irrelevant tools (e.g., a Postgres MCP while doing front-end CSS work) "poisons" the context and increases the likelihood of the agent hallucinating database interactions where none are required.

Session Isolation and Red Flags

Isolate tasks using parallel agents or separate sessions.

- New Session Triggers: You MUST kill the session and start fresh if:
    - The agent begins "looping" or repeatedly making the same error after correction.
    - A task is finished.
    - The agent is "off the rails" and steering it back is proving difficult.
- The Handoff: Use the current agent to summarize the session status for the next agent to ensure a clean, high-context hand-off.

---

4. Configuration Strategy: AGENTS.md vs. SKILLS.md

Separate persistent project rules from on-demand task playbooks.

Feature AGENTS.md SKILLS.md
Status Always-On On-Demand
Role The project's "README" for agents. Reusable "Playbooks" for specific tasks.
Persistence Loaded into the System Prompt. Picked up only when manually invoked.
Primary Use Project conventions, build/test commands, and file structure. Infrequent workflows: Motion graphics, changelog compilation, UI patterns.

---

5. AGENTS.md Template

Place an AGENTS.md file in the repository root to provide persistent context.

# AGENTS.md: [Project Name] Instructions

## Project Context & Tech Stack

- **Architecture**: [e.g., Event-driven Microservices]
- **Stack**: [e.g., TypeScript, Next.js, Tailwind, Prisma]
- **Architectural Guardrails**: [e.g., Always use functional components; no inline styles]

## Development Workflow (RPI Protocol)

1. **Research**: Use Ask Mode to identify files. Produce a Research Summary.
2. **Plan**: Generate a step-by-step plan in the `/plans` folder.
3. **Implement**: Execute via Code Mode in a fresh session. Commit frequently.

## Authorized Build & Test Commands

The agent is authorized to run the following independently:

- **Build**: `[Insert Command]`
- **Test Suite**: `[Insert Command]`
- **Linting**: `[Insert Command]`

## Code Style & Conventions

- **Naming**: [e.g., PascalCase for components, kebab-case for files]
- **Style**: Adhere strictly to the existing Prettier/ESLint config.

## Verification Checklist

Before declaring a task complete, the agent MUST:

- [ ] Run the full test suite and confirm 100% pass rate.
- [ ] Check for **Context Poisoning**: Ensure no patterns from previous unrelated tasks or outdated comments have crept into the code.
- [ ] Verify no out-of-date comments remain in modified files.
- [ ] Run linting and fix all errors.
- [ ] Confirm no out-of-scope files were modified.

---

6. Verification and Testing Standards

Accountability is maintained through strict verification boundaries.

- Mandatory Test Commands: Every plan created in the Architect phase MUST include at least one specific test command (e.g., npm test or a specific curl command).
- Work Trees: For complex changes, mandate the use of Git Work Trees. This allows the agent to isolate its changes in a separate directory, enabling you to review the entire diff in isolation before it is merged into your primary local branch.
- Auto-Approve Boundaries: Set clear permissions. It is recommended to allow agents to run tests autonomously but require human approval for all file writes and Git commits.

---

7. Summary Checklist for Human Developers

- Review Research Early: Catch "bad lines of research" before they turn into "hundreds of lines of bad code."
- Curate Context with @Mentions: Use @mentions to point the agent to specific files, commits, or terminal outputs to minimize token waste.
- Aggressive Session Management: Use slash commands to condense context or start new tasks. Do not let a single session wander across multiple unrelated features.
- Think, Don't Just Prompt: Remember that AI cannot replace thinking; it only amplifies the quality of the thinking you have already done.
- Get Your Reps In: Agentic engineering is part art and part science. Regularly practice with the tools to learn exactly what the model can be trusted to do—and what it cannot.
