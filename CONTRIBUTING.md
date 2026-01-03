# Contributing to Rora Ride

Thank you for your interest in contributing to Rora Ride! This document outlines our development workflow, conventions, and best practices.

## Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/joshua-sx/rora-ride.git
   cd rora-ride
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Fill in your environment variables:
   # - Supabase URL and keys
   # - Google Maps API key
   # - Twilio credentials (for SMS OTP)
   # - Expo push notification keys
   ```

4. **Run Migrations**
   ```bash
   npx supabase migration up
   # or if using local Supabase
   npx supabase db reset
   ```

5. **Start Development Server**
   ```bash
   npx expo start
   # Then press 'i' for iOS simulator or 'a' for Android emulator
   ```

## Branch Strategy

We use a **main-only** strategy with feature branches:

- **`main`** - Production-ready code. Always deployable.
- **Feature branches** - Created from `main` for new features or fixes.
- **No long-lived branches** - Merge to `main` as soon as work is complete and tested.

### Branch Naming Conventions

Branches must follow this pattern:

```
<type>/<issue-id>-<short-description>
```

**Types:**
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

**Examples:**
- `feature/18-add-driver-directory-filters`
- `fix/45-resolve-pricing-calculation-bug`
- `docs/12-update-edge-function-documentation`
- `refactor/67-simplify-qr-token-validation`

**Rules:**
- Always include issue number (e.g., `#18`)
- Use kebab-case (lowercase with hyphens)
- Keep description short (3-4 words max)
- No special characters except hyphens

## Commit Message Standard

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - New user-facing functionality
- `fix:` - Bug fixes
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring without changing functionality
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependency updates
- `build:` - Build system or dependency changes

### Scope (Optional)

Scope indicates the area of the codebase:
- `auth` - Authentication/authorization (SMS OTP, email magic link)
- `ride` - Ride sessions, state transitions, offers
- `driver` - Driver directory, profiles, verification
- `pricing` - Fare calculation, zones, modifiers
- `qr` - QR generation, validation, token management
- `maps` - Maps integration, location services
- `db` - Database schema/migrations
- `edge` - Supabase Edge Functions
- `ui` - UI components
- `guest` - Guest mode, token management

### Examples

```bash
# Feature with scope
feat(ride): add driver offer comparison view

# Bug fix
fix(pricing): resolve zone pricing calculation error

# Documentation
docs(edge): update ride state transition documentation

# Refactoring
refactor(qr): simplify QR token validation logic

# Breaking change (note the !)
feat(ride)!: change ride session response format

BREAKING CHANGE: ride session now includes discovery wave status
```

### Commit Body (Optional)

Use commit body to explain:
- **What** changed and **why**
- Any breaking changes
- Migration steps if needed

### Commit Footer (Optional)

Use footer for:
- Breaking changes: `BREAKING CHANGE: <description>`
- Issue references: `Closes #123`, `Fixes #456`
- Co-authors: `Co-authored-by: Name <email>`

## Development Workflow

### 1. Create Issue

Before starting work:
- Check if an issue exists
- If not, create one using the appropriate template
- Link to Epic if applicable

### 2. Create Branch

```bash
# From main
git checkout main
git pull origin main
git checkout -b feature/18-add-driver-directory-filters
```

### 3. Make Changes

- Follow the [Work Loop](CLAUDE.md#work-loop-always-follow) from CLAUDE.md
- Write clear, readable code
- Add comments for complex logic
- Follow existing patterns

### 4. Test Your Changes

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for development (optional)
eas build --profile development --platform ios
eas build --profile development --platform android

# Run app locally
npx expo start
# Test on iOS: press 'i'
# Test on Android: press 'a'
# Test on physical device: scan QR code with Expo Go app
```

### 5. Commit

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(ride): add driver offer comparison view

- Implement offer comparison component
- Add price context labels (Good deal, Pricier)
- Integrate with Supabase Realtime for live updates

Closes #18"
```

### 6. Push and Create PR

```bash
# Push branch
git push origin feature/18-add-driver-directory-filters
```

Then create a Pull Request on GitHub:
- Use PR template
- Link to issue: `Closes #18`
- Add description of changes
- Include screenshots if UI changes
- Request review

### 7. Review and Merge

- Address review feedback
- Ensure CI/CD passes
- Squash and merge to `main`
- Delete branch after merge

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` - use proper types
- Leverage Supabase generated types (don't duplicate)
- Generate types: `npx supabase gen types typescript > types/database.ts`
- Types flow: Supabase Schema → Generated Types → Component/Hook

### Security

- **Never** hardcode secrets
- Use environment variables
- Validate ride state transitions server-side (never trust client)
- Verify ride session ownership (user or guest token)
- Validate QR tokens server-side (Edge Functions)
- Use ride event logging for all state changes (append-only)
- Never use Supabase service role key in client code

### Error Handling

- Handle errors explicitly (no silent failures)
- Return meaningful error messages
- Log errors appropriately (Sentry for production)
- Handle offline scenarios gracefully (QR display, cached data)
- Validate network state before critical operations
- Show user-friendly error messages in UI

### Testing

- Write tests for critical paths (ride state transitions, pricing calculations)
- Test ride session ownership validation
- Test QR token validation and revocation
- Test guest mode functionality
- Test offline behavior (QR display, cached routes)
- Test error cases and edge cases
- Test on both iOS and Android

## Quality Checklist

Before submitting a PR, ensure:

- [ ] Code follows existing patterns
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] App runs locally on iOS (`npx expo start --ios`)
- [ ] App runs locally on Android (`npx expo start --android`)
- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] Ride state transitions validated server-side
- [ ] Ride event logging added (for state changes)
- [ ] QR token validation implemented (if applicable)
- [ ] Guest mode works correctly (if applicable)
- [ ] Offline behavior handled (QR display, cached data)
- [ ] Error handling in place
- [ ] Loading/empty/error states exist (for UI)
- [ ] Commit message follows convention
- [ ] PR description is clear
- [ ] Issue is linked in PR

## Project Structure

```
rora-ride/
├── app/                        # Expo Router app directory
│   ├── (auth)/                 # Authentication screens
│   ├── (tabs)/                 # Main app tabs
│   └── _layout.tsx             # Root layout
├── components/                 # React Native components
│   ├── features/               # Feature-specific components
│   │   ├── ride/               # Ride-related components
│   │   ├── driver/             # Driver directory components
│   │   └── pricing/            # Pricing display components
│   └── ui/                     # Reusable UI components
├── lib/                        # Utilities and helpers
│   ├── supabase/               # Supabase client & helpers
│   ├── maps/                   # Maps integration
│   ├── pricing/                # Pricing calculation logic
│   └── qr/                     # QR generation/validation
├── hooks/                      # React hooks
├── store/                      # State management (Zustand)
├── types/                      # TypeScript types
├── supabase/                   # Supabase config & migrations
│   ├── migrations/             # Database migrations
│   └── functions/              # Edge Functions
├── scripts/                    # Build & utility scripts
└── docs/                       # Documentation
```

## Getting Help

- Check [CLAUDE.md](./CLAUDE.md) for AI assistant guidelines
- Review [SPEC.md](./SPEC.md) for detailed product specifications
- See [README.md](./README.md) for project overview and setup
- Open an issue for questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (TBD).

---

**Thank you for contributing to Rora Ride!** 🚕

