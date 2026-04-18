# Contributing to lole

## Development Setup

1. Install Node.js 20+ and pnpm 9+
2. Run `pnpm install` to install dependencies
3. Run `pnpm prepare` to set up Husky hooks
4. Create a `.env.local` file with required environment variables

## Code Quality Standards

All contributions must follow the standards defined in `AGENTS.md`. Key requirements:

### Pre-Commit Hooks

Pre-commit hooks run automatically and check:

- Code formatting (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)
- Security checks
- No `any` types in production code
- No `console.log` in production code
- Use `<Image />` instead of `<img>`

### Before Committing

Ensure these commands pass:

```bash
pnpm lint           # ESLint check
pnpm type-check     # TypeScript check
pnpm test           # Unit tests
pnpm format:check   # Prettier check
```

### Branch Naming

- `feature/xxx` - New features
- `fix/xxx` - Bug fixes
- `refactor/xxx` - Code refactoring
- `docs/xxx` - Documentation updates

### Commit Messages

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Pull Request Checklist

- [ ] Code follows AGENTS.md standards
- [ ] All tests pass
- [ ] No `any` types introduced
- [ ] No `console.log` statements
- [ ] Images use `<Image />` component
- [ ] Database types updated if schema changed
- [ ] Tests added for new functionality

## Testing

```bash
pnpm test              # Run unit tests
pnpm test:coverage     # Run with coverage
pnpm test:e2e          # Run E2E tests
```

## Database Migrations

1. Create migration in `supabase/migrations/`
2. Update types in `src/types/database.ts`
3. Test migration locally

## Questions?

See `AGENTS.md` for detailed engineering standards.
