# AI EXECUTION PROMPT

## Copy and paste this to your AI assistant:

---

```
You are an expert software architect and senior TypeScript/Next.js engineer. I need you to execute a complete architectural transformation of my Next.js application.

## YOUR TASK

Execute the complete transformation plan documented in `ARCHITECTURE_TRANSFORMATION_MASTER_PLAN.md`. Work through each phase sequentially and methodically.

## CRITICAL RULES

1. **SEQUENTIAL EXECUTION**: Complete Phase 1 fully before starting Phase 2. Do not skip ahead.

2. **BUILD VERIFICATION**: After EVERY phase, run:
   ```bash
   npm run build
   npm test
   ```
   Fix ALL errors before proceeding to the next phase.

3. **NO SHORTCUTS**: 
   - No "TODO" comments - implement fully or not at all
   - No `any` types - use proper TypeScript
   - No direct Prisma client usage outside repositories
   - No business logic in API routes

4. **DEPENDENCY INJECTION**: 
   - Use tsyringe container for ALL dependencies
   - Never use `new Service()` - always resolve from container
   - All services must be `@injectable()`

5. **DOMAIN-DRIVEN**:
   - All domain logic in services
   - Repositories only handle data access
   - API routes are thin coordinators only

6. **ERROR HANDLING**:
   - All errors must extend DomainError
   - Services throw domain errors
   - API handler converts to HTTP responses

7. **TESTING**:
   - Write unit tests for every service
   - Write unit tests for every repository
   - Aim for 80%+ code coverage

## WORKFLOW

For each phase:

1. Read the current codebase state
2. Implement the phase specification
3. Run `npm run build` - fix all errors
4. Run `npm test` - fix all failures
5. Commit with message: "PHASE-{N}: {Description}"
6. Report completion of phase with summary

## PHASE ORDER (STRICT)

1. Phase 1: Dependency Injection Foundation
2. Phase 2: Domain Interfaces  
3. Phase 3: Infrastructure Layer (Repositories)
4. Phase 4: Service Layer
5. Phase 5: API Route Refactoring
6. Phase 6: Background Job Queue
7. Phase 7: Testing Infrastructure

## STARTING COMMAND

Begin with:
```bash
git checkout -b architecture-rewrite
npm install tsyringe reflect-metadata
npm install -D @types/reflect-metadata
```

Then read `ARCHITECTURE_TRANSFORMATION_MASTER_PLAN.md` and start Phase 1.

Report back when Phase 1 is complete with build and test status.
```

---

## How to use:

1. Make sure both files are in your project root:
   - `ARCHITECTURE_TRANSFORMATION_MASTER_PLAN.md`
   - `PROMPT_FOR_AI.md`

2. Copy the text inside the code block above

3. Paste it into your AI assistant (Claude, GPT-4, etc.)

4. The AI will start executing Phase 1

5. After each phase completes, review the changes and approve continuation

---

## What to expect:

- **Phase 1-2**: Setup (2-3 hours)
- **Phase 3-4**: Core implementation (6-8 hours)  
- **Phase 5**: API refactoring (4-6 hours)
- **Phase 6**: Queue system (2-3 hours)
- **Phase 7**: Testing (4-6 hours)

Total: ~20-26 hours of AI work (may vary based on AI speed)

The AI should commit after each phase so you can review progress.
