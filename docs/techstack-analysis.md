# THROWN Techstack Analysis & Recommendations

**Date:** 2025-01-15
**Status:** Research Complete

---

## Current Stack (from PRD v2.0)

| Layer | Current | Purpose |
| ------- | --------- | --------- |
| Frontend | React.js + Framer Motion | UI, animations, PWA |
| Backend | Node.js + Express | API, match orchestration |
| Real-Time | Socket.io | Discussion timer, hidden vote sync |
| Database | Supabase (PostgreSQL) | Accounts, stats, SD$, friends |
| Cache | Redis | Live sessions, matchmaking queue |
| Auth | Supabase Auth | Google + Apple + Email sign-in |
| Media | Cloudinary | Cosmetic asset delivery |

---

## Recommended Stack (Implemented)

| Layer | Recommended | Why |
| ------- | ------------- | ----- |
| Frontend | React 18 + Vite + TypeScript | Fast dev, excellent DX, tree-shaking |
| Styling | Tailwind CSS | Rapid UI development, consistent design |
| Animations | Framer Motion | Smooth, declarative animations |
| State | Zustand + React Query | Lightweight + server state management |
| Backend | Node.js + Express + TypeScript | Mature, well-documented, huge ecosystem |
| Real-Time | Socket.io | Battle-tested, auto-reconnection |
| Database | PostgreSQL (Supabase) + Drizzle ORM | Type-safe queries, great DX |
| Cache | Redis (ioredis) | Best Redis client, cluster support |
| Auth | Custom JWT (expandable) | Full control, no vendor lock-in |
| Media | Cloudinary | Excellent image/video optimization |
| Validation | Zod | Runtime + static type checking |
| Testing | Vitest | Fast, Vite-native, ESM-first |

---

## Detailed Comparisons

### 1. Frontend: React + Vite vs Next.js

| Aspect | React + Vite (✅ Chosen) | Next.js |
| -------- | -------------------------- | --------- |
| SSR/SEO | Not needed (game is real-time) | Overkill for a game |
| Bundle Size | Smaller, faster HMR | Larger, more overhead |
| Complexity | Simpler architecture | More concepts (RSC, App Router) |
| Deployment | Vercel (simple) | Vercel (optimal) |
| Learning Curve | Lower | Higher |
| Verdict | **Better for a real-time game** | Better for content-heavy sites |

**Decision:** React + Vite is the right choice. THROWN is a real-time game, not a content site. SSR provides no benefit when all data changes via WebSocket.

---

### 2. Backend: Express vs Fastify

| Aspect | Express (✅ Chosen) | Fastify |
| -------- | --------------------- | --------- |
| Performance | Good enough | ~2x faster raw throughput |
| Ecosystem | Massive (middlewares, plugins) | Growing but smaller |
| Socket.io Integration | Native, well-documented | Works but less common |
| Learning Curve | Very low | Low |
| Community | Huge | Growing |
| Verdict | **Better ecosystem** | Better raw speed |

**Decision:** Express is the right choice for THROWN. The game's bottleneck is WebSocket communication, not HTTP request handling. Express's massive ecosystem and Socket.io integration make it the pragmatic choice.

---

### 3. API Layer: REST vs tRPC

| Aspect | REST + Zod (✅ Chosen) | tRPC |
| -------- | ------------------------ | ------ |
| Type Safety | Zod validates at runtime | End-to-end type safety |
| Complexity | Simpler, more familiar | More setup, learning curve |
| Client Integration | Manual API calls | Automatic client generation |
| Flexibility | Works with any client | TypeScript-only |
| Verdict | **More flexible** | Better DX for TS-only |

**Decision:** REST + Zod is the right choice. THROWN needs Socket.io for real-time game events anyway, so tRPC's type-safe HTTP layer provides less value. Zod validation gives us runtime safety without the tRPC overhead.

---

### 4. Database: Supabase vs Raw PostgreSQL + Drizzle

| Aspect | Supabase + Drizzle (✅ Chosen) | Raw PostgreSQL |
| -------- | ------------------------------- | ---------------- |
| Type Safety | Drizzle generates types | Manual type definitions |
| Migrations | Drizzle Kit handles them | Manual SQL |
| Query Builder | Excellent DX | Raw SQL |
| Real-time | Supabase Realtime (optional) | Custom implementation |
| Auth | Supabase Auth included | Manual implementation |
| Hosting | Supabase cloud (free tier) | Self-hosted or cloud |
| Verdict | **Best of both worlds** | More control, more work |

**Decision:** Supabase + Drizzle is the right choice. We get Supabase's managed PostgreSQL and auth, plus Drizzle's type-safe query builder. This gives us the best DX without vendor lock-in.

---

### 5. Redis Client: ioredis vs node-redis

| Aspect | ioredis (✅ Chosen) | node-redis |
| -------- | --------------------- | ------------ |
| Performance | Excellent | Good |
| Cluster Support | Built-in | Separate package |
| API Design | Clean, Promise-based | Callback-heavy |
| Features | More built-in | Fewer features |
| Maintenance | Actively maintained | Redis official |
| Verdict | **Better DX** | Official but dated |

**Decision:** ioredis is the clear winner. Better API, better features, better maintained.

---

### 6. Auth: Custom JWT vs Supabase Auth

| Aspect | Custom JWT (✅ Chosen) | Supabase Auth |
| -------- | ------------------------ | --------------- |
| Control | Full control | Vendor-managed |
| Complexity | More code to write | Less code |
| Features | Basic (expandable) | Rich (MFA, etc.) |
| Vendor Lock-in | None | Some |
| Cost | Free | Free tier |
| Verdict | **More flexible** | Faster to implement |

**Decision:** Custom JWT for now, with Supabase Auth as an expansion path. This gives us full control over the auth flow while keeping the door open for Supabase's managed auth later.

---

### 7. State Management: Zustand vs Redux Toolkit

| Aspect | Zustand (✅ Chosen) | Redux Toolkit |
| -------- | --------------------- | --------------- |
| Bundle Size | ~1KB | ~11KB |
| Boilerplate | Minimal | More (slices, actions, reducers) |
| Learning Curve | Very low | Medium |
| DevTools | Basic | Excellent |
| Performance | Excellent | Good |
| Verdict | **Simpler, lighter** | Better for complex state |

**Decision:** Zustand is the right choice. THROWN's client state is relatively simple (auth, lobby, game phase). React Query handles server state. Redux would be overkill.

---

### 8. Styling: Tailwind CSS vs CSS Modules vs Styled Components

| Aspect | Tailwind CSS (✅ Chosen) | CSS Modules | Styled Components |
| -------- | -------------------------- | ------------- | ------------------- |
| Development Speed | Fastest | Medium | Medium |
| Bundle Size | Zero-runtime | Zero-runtime | Runtime overhead |
| Consistency | Utility-first | Per-component | Per-component |
| Learning Curve | Low | Low | Low |
| Theming | Excellent | Manual | Excellent |
| Verdict | **Fastest development** | Good isolation | Good theming |

**Decision:** Tailwind CSS is the right choice for rapid UI development. The Balatro-inspired theme (dark backgrounds, neon accents) works perfectly with Tailwind's utility classes.

---

### 9. Testing: Vitest vs Jest

| Aspect | Vitest (✅ Chosen) | Jest |
| -------- | --------------------- | ------ |
| Speed | Fastest (Vite-native) | Fast |
| ESM Support | Native | Requires config |
| DX | Excellent | Good |
| Compatibility | Vite ecosystem | Broader ecosystem |
| Verdict | **Better for Vite projects** | More established |

**Decision:** Vitest is the right choice for a Vite project. Native ESM support, faster execution, and excellent DX.

---

### 10. Development Environment: Docker vs Local

| Aspect | Docker (Recommended) | Local |
| -------- | ---------------------- | ------- |
| Consistency | Identical across team | May vary |
| Setup | One command | Manual setup |
| Database | Docker Compose | Local PostgreSQL |
| Redis | Docker Compose | Local Redis |
| Complexity | More config initially | Less config |
| Verdict | **Better for teams** | Simpler for solo dev |

**Recommendation:** Use Docker Compose for PostgreSQL and Redis during development. This ensures all team members have identical environments.

---

## Summary

| Decision | Choice | Rationale |
| ---------- | -------- | ----------- |
| Frontend Framework | React + Vite | Right tool for a real-time game |
| Backend Framework | Express | Ecosystem + Socket.io integration |
| API Style | REST + Zod | Flexible, runtime validation |
| Database | Supabase + Drizzle | Best DX without lock-in |
| Redis Client | ioredis | Better API, more features |
| Auth | Custom JWT | Full control, expandable |
| State | Zustand | Simple, lightweight |
| Styling | Tailwind CSS | Fast development |
| Testing | Vitest | Vite-native, fast |
| Dev Environment | Docker Compose | Team consistency |

---

## Next Steps

1. **Immediate:** Continue with Phase 1 (Foundation & Infrastructure)
2. **Week 2:** Set up Docker Compose for local dev
3. **Week 3:** Begin core game logic implementation
4. **Ongoing:** Follow the implementation plan in `docs/plan.md`

---

*Document Version: 1.0*
*Last Updated: 2025-01-15*
*Author: THROWN Team*
