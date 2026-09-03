# Overhaul Project Architecture & Data Models

## Overview

This project manages the complete lifecycle of heavy machinery overhauls from initial requirement capture through planning. Each overhaul progresses through five sequential stages, with each stage versioning independently. A cascading mechanism ensures data consistency: when a stage's version increments, all downstream stages reset to `isCompleted: false` for re-evaluation.

**Stack**: Next.js 15+ | shadcn/ui + Tailwind CSS | Prisma ORM | PostgreSQL (local) | Google Cloud Storage | next-auth | Minimalist UI design

---

## Quick Navigation

- [Tech Stack](#tech-stack)
- [Next.js Considerations](#nextjs-considerations)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Data Models](#data-models)
  - [Master Data Entities](#master-data-entities)
  - [Overhaul Core](#overhaul-core)
  - [Stage 1: Necesidad (Requirement)](#stage-1-necesidad)
  - [Stage 2: Alcance (Scope)](#stage-2-alcance)
  - [Stage 3: Tarifa (Pricing)](#stage-3-tarifa)
  - [Stage 4: Propuesta (Proposal)](#stage-4-propuesta)
  - [Stage 5: Planificación (Planning)](#stage-5-planificación)
- [Workflow & State Management](#workflow--state-management)
- [Versioning Strategy](#versioning-strategy)
- [Project Structure](#project-structure)
- [Authentication & User Management](#authentication--user-management)
- [Storage & File Management](#storage--file-management)
- [Development Conventions](#development-conventions)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15+ | Full-stack React framework |
| **UI Components** | shadcn/ui + Tailwind CSS | Minimalist, reusable components |
| **Database** | PostgreSQL (local) | Primary data store |
| **ORM** | Prisma | Type-safe database access |
| **Authentication** | next-auth + DB sessions | User identity & authorization |
| **File Storage** | Google Cloud Storage | Specifications, proposals, planning docs |
| **Infrastructure** | Google Cloud Platform (GCP) | Compute, storage, networking |
| **Package Manager** | npm (monorepo via turbo) | Dependency management |

---

## Next.js Considerations

⚠️ **Breaking Changes**: This implementation uses Next.js 15+ which may differ from your training data.

- Read `/node_modules/next/dist/docs/` for current API documentation
- Pay attention to deprecation notices in Next.js release notes
- Server Components are default; use `"use client"` for client interactivity
- Data fetching patterns differ from Pages Router; follow App Router conventions
- Route handlers (`app/api/`) replace API pages

---

## Architecture & Design Patterns

### Separation of Concerns

```
apps/web/                          # UI/presentation layer
├── app/                          # Next.js App Router
├── components/                   # Reusable UI components (shadcn-based)
└── hooks/                        # Client-side logic hooks

packages/backend/                 # Business logic & data operations
├── services/                     # Domain services (e.g., OverhaulService)
├── repositories/                 # Data access layer (wraps Prisma)
├── utils/                        # Helpers & utilities
└── types/                        # Shared TypeScript types

packages/ui/                      # Component library
├── src/components/              # UI primitives & feature components
└── src/lib/utils.ts             # Shared utilities (cn, formatters, etc.)
```

### Component Organization

- **UI Components** (`packages/ui/src/components/`): Reusable, framework-agnostic shadcn components
- **Page Components** (`apps/web/app/`): Server components by default, fetch data server-side
- **Feature Components** (`apps/web/components/`): Specific to a feature/stage, may include client interactivity
- **Hooks** (`apps/web/hooks/`): React hooks for repeated client-side logic

### Data Flow

1. **Server Components** (Next.js App Router): Fetch data via `async` in component body
2. **API Routes** (`app/api/`): Delegate to backend services; return JSON
3. **Backend Services** (`packages/backend/services/`): Implement business logic, call repositories
4. **Repositories** (`packages/backend/repositories/`): Wrap Prisma queries, provide clean data access
5. **Client Components**: Display data, handle user input, emit mutations to API routes

### Styling

- **Tailwind CSS**: Utility-first styling; minimal custom CSS
- **shadcn/ui**: Pre-built components; customize via Tailwind classes
- **Design Language**: Clean, minimalist; whitespace over decoration; semantic colors

---

## Data Models

All entities listed below map to Prisma models. This mirrors the actual `prisma/schema.prisma` — keep both in sync when either changes.

### Master Data Entities

Core reference/catalog data. Free-text form inputs (datalist-backed) resolve to these via find-or-create (upsert by unique `name`), so new entries typed by users are registered automatically.

#### MasterCliente
Client/customer (mine site) records.
```
id: String @id @default(cuid())
name: String @unique
contact: String?
email: String?
maquinas: Maquina[]
necesidades: OverhaulNecesidad[]
createdAt: DateTime @default(now())
```

#### MasterTaller
Workshop/service center locations.
```
id: String @id @default(cuid())
name: String @unique
location: String?
capacity: Int?
necesidades: OverhaulNecesidad[]
componentes: OverhaulAlcanceComponent[]
createdAt: DateTime @default(now())
```

#### MasterAtencion
Service types/attention categories (e.g., Presupuesto, Tarifa Fija, Paralelo).
```
id: String @id @default(cuid())
name: String @unique
description: String?
componentes: OverhaulAlcanceComponent[]
createdAt: DateTime @default(now())
```

#### MasterFabricante
Machine manufacturer catalog (e.g., CATERPILLAR, ATLAS COPCO, EPIROC).
```
id: String @id @default(cuid())
name: String @unique
modelos: MasterMaquinaModelo[]
createdAt: DateTime @default(now())
```

#### MasterMaquinaModelo
Machine model catalog.
```
id: String @id @default(cuid())
modelo: String @unique
type: String                         // free-text label (e.g., "Camión Minero")
description: String?
fabricanteId: String?
fabricante: MasterFabricante?
categoria: CategoriaFlota?            // EXPANDIDA | TRADICIONAL
flota: FlotaTipo?                     // DRILLS | SHOVEL | AUX_FLEET | SUPPORT | TRUCKS
systems: MasterSystem[]
maquinas: Maquina[]
createdAt: DateTime @default(now())
```

#### MasterSystem
Predefined system hierarchy for machines (e.g., Power train, Sistema hidráulico).
```
id: String @id @default(cuid())
name: String
modelo: MasterMaquinaModelo @relation(...)
description: String?
components: MasterComponent[]
createdAt: DateTime @default(now())
```

#### MasterComponent
Predefined components within systems.
```
id: String @id @default(cuid())
name: String
system: MasterSystem @relation(...)
code: String?
createdAt: DateTime @default(now())
```

#### Maquina
Asset registry: a physical machine (model + serial) owned by a client, independent of any specific overhaul.
```
id: String @id @default(cuid())
modeloId: String
modelo: MasterMaquinaModelo @relation(...)
clienteId: String
cliente: MasterCliente @relation(...)
serie: String
idEquipo: String? @unique
estado: String @default("Activo")
fechaInicio: DateTime?
fechaFin: DateTime?
necesidades: OverhaulNecesidadMaquina[]

@@unique([modeloId, serie])
```

---

### Overhaul Core

#### Overhaul (Root Entity)

Represents a single overhaul project from start to finish. Each stage is versioned via **append-only rows** (not update-in-place): every save inserts a new row for that stage, and reads take the latest by `[version desc, updatedAt desc]`.

```
Overhaul {
  id: String @id @default(cuid())

  // Stage version history (1:N — latest row per stage is the active version)
  necesidad: OverhaulNecesidad[]
  alcance: OverhaulAlcance[]
  tarifas: OverhaulTarifas[]
  propuesta: OverhaulPropuesta[]
  planificacion: OverhaulPlanificacion[]

  // State machine
  state: OverhaulState   // definicion | aprobado | cancelado

  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

---

### Stage 1: Necesidad

**Purpose**: Capture initial customer requirement—machines to overhaul, location, target dates.
**Versioning**: New row inserted on every save. Cascades: Alcance+ reset `isCompleted: false`.

#### OverhaulNecesidad
```
OverhaulNecesidad {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation(...)

  proyecto: String
  clienteId: String
  cliente: MasterCliente @relation(...)
  ubicacion: String
  tallerDestinoId: String
  tallerDestino: MasterTaller @relation(...)

  fechaEstimada: DateTime
  fechaTarifa: DateTime
  maquinas: OverhaulNecesidadMaquina[]

  version: Int @default(1)
  isCompleted: Boolean @default(false)
  completedAt: DateTime?
  createdById: String?
  createdBy: User? @relation(...)

  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### OverhaulNecesidadMaquina
Join table linking a necesidad version to the machines involved (found-or-created in the `Maquina` catalog by model + serial).
```
id: String @id @default(cuid())
necesidadId: String
necesidad: OverhaulNecesidad @relation(...)
maquinaId: String
maquina: Maquina @relation(...)
createdAt: DateTime @default(now())

@@unique([necesidadId, maquinaId])
```

---

### Stage 2: Alcance

**Purpose**: Define systems and components to overhaul, including workshop and attention assignment per component.
**Versioning**: New row inserted on every save. Cascades: Tarifa+ reset `isCompleted: false`.

#### OverhaulAlcance
```
OverhaulAlcance {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation(...)

  resumen: String @default("")
  systems: OverhaulAlcanceSystem[]

  version: Int @default(1)
  isCompleted: Boolean @default(false)
  completedAt: DateTime?
  createdById: String?
  createdBy: User? @relation(...)

  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### OverhaulAlcanceSystem
A system in scope for this alcance version (ordered by `position`).
```
id: String @id @default(cuid())
alcanceId: String
alcance: OverhaulAlcance @relation(...)
name: String
position: Int
components: OverhaulAlcanceComponent[]
createdAt: DateTime @default(now())

@@unique([alcanceId, position])
```

#### OverhaulAlcanceComponent
Component within a system; tracks service type, workshop and attention assignment.
```
id: String @id @default(cuid())
systemId: String
system: OverhaulAlcanceSystem @relation(...)
name: String
state: ComponentState   // Nuevo | Reman | RGeneral | Resellado | Reutilizar | Cliente
tallerId: String?
taller: MasterTaller? @relation(...)
atencionId: String?
atencion: MasterAtencion? @relation(...)
comentarios: String?
position: Int
createdAt: DateTime @default(now())

@@unique([systemId, position])
```

---

### Stage 3: Tarifa

**Purpose**: Break down work into jobs, components, parts; calculate labor and material costs.
**Versioning**: New row inserted on every save. Cascades: Propuesta+ reset `isCompleted: false`.

#### OverhaulTarifas
```
OverhaulTarifas {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation(...)

  currency: Currency @default(USD)   // USD | PEN
  total: Decimal @default(0)
  groups: OverhaulTarifaGroupJob[]
  partes: OverhaulTarifaParte[]

  version: Int @default(1)
  isCompleted: Boolean @default(false)
  completedAt: DateTime?
  createdById: String?
  createdBy: User? @relation(...)

  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### OverhaulTarifaGroupJob
Logical grouping of work (e.g., "Engine Overhaul", "Hydraulic System").
```
OverhaulTarifaGroupJob {
  id: String @id @default(cuid())
  tarifa: OverhaulTarifas @relation(...)
  
  name: String
  jobs: OverhaulTarifaJob[]
  horas: Float
  
  createdAt: DateTime @default(now())
}
```

#### OverhaulTarifaJob
Individual job line item with labor cost breakdown.
```
OverhaulTarifaJob {
  id: String @id @default(cuid())
  groupJob: OverhaulTarifaGroupJob @relation(...)
  
  name: String
  materialAndMo: Float // Material + Labor (price)
  miscelaneos: Float
  repuestos: Float
  
  createdAt: DateTime @default(now())
}
```

#### OverhaulTarifaParte
Part/component replacement with full inventory & cost tracking.
```
OverhaulTarifaParte {
  id: String @id @default(cuid())
  tarifa: OverhaulTarifas @relation(...)
  
  segmentacion: String
  componentCode: String
  jobCode: String
  parentPartName: String
  groupNumber: String
  partNumber: String
  partNumberSap: String
  partName: String
  
  quantity: Float
  replacementPercent: Float
  dealerNet: Float
  costoInterno: Float
  pu: Float // Unit price
  subtotal: Float
  clasificacion: String
  notas: String?
  motivo: String?
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

---

### Stage 4: Propuesta

**Purpose**: Generate commercial proposal for customer (formal offer, terms, delivery dates).
**Versioning**: New row inserted on every save. Cascades: Planificación resets `isCompleted: false`.
**State Control**: `Overhaul.state` transitions (`definicion` → `aprobado`) happen in this stage.

#### OverhaulPropuesta
```
OverhaulPropuesta {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation(...)

  emision: DateTime?
  contactoNombre: String @default("")
  contactoUbicacion: String @default("")
  contactoTelefono: String?
  contactoEmail: String?

  condiciones: String[] @default([])
  inclusionesExclusiones: OverhaulPropuestaInclusionExclusion[]

  fechaReparacion: DateTime?
  terminosGenerales: String @default("")
  garantias: String @default("")
  propuestaUri: String @default("")   // URL to Google Cloud Storage (PDF)

  version: Int @default(1)
  isCompleted: Boolean @default(false)
  completedAt: DateTime?
  createdById: String?
  createdBy: User? @relation(...)

  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### OverhaulPropuestaInclusionExclusion
Per-system breakdown of what is included/excluded (ordered by `position`).
```
id: String @id @default(cuid())
propuestaId: String
propuesta: OverhaulPropuesta @relation(...)
systemName: String
components: String[] @default([])
inclusiones: String[] @default([])
exclusiones: String[] @default([])
position: Int
createdAt: DateTime @default(now())

@@unique([propuestaId, position])
```

---

### Stage 5: Planificación

**Purpose**: Schedule the overhaul execution window.
**Versioning**: New row inserted on every save. Final stage; no downstream cascade.
**Note**: Parts procurement/logistics detail (risk, regional stock, etc.) is not yet modeled relationally — currently out of scope for this schema.

#### OverhaulPlanificacion
```
OverhaulPlanificacion {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation(...)

  fechaInicio: DateTime?
  fechaFin: DateTime?

  version: Int @default(1)
  isCompleted: Boolean @default(false)
  completedAt: DateTime?
  createdById: String?
  createdBy: User? @relation(...)

  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

---

## Workflow & State Management

### Stage Progression

```
[1] Necesidad (Requirement)
       ↓ (lock & advance)
[2] Alcance (Scope)
       ↓ (lock & advance)
[3] Tarifa (Pricing)
       ↓ (lock & advance)
[4] Propuesta (Proposal) ← STATE TRANSITION HAPPENS HERE
       ↓ (lock & advance)
[5] Planificación (Planning)
```

Each stage:
- Starts in `isCompleted: false`
- Progresses when data is complete and validated
- Sets `isCompleted: true` when locked
- Cannot be re-edited after locking (create new version instead)

### Overhaul State Machine

The `Overhaul.state` field tracks overall project status. State transitions only occur in **Propuesta** stage:

```
┌─────────────────┐
│   definicion    │  ← Initial state (project intake)
│  (Planning)     │
└────────┬────────┘
         │ (Proposal approved by customer)
         ↓
┌─────────────────┐
│   aprobado      │  ← Active overhaul (work in progress)
│  (Approved)     │
└────────┬────────┘
         │ (Cancel or complete)
         ↓
┌─────────────────┐
│  Cancelado      │  ← Cancelled (stop work)
│  (Cancelled)    │
└─────────────────┘
```

**Transitions**:
- `definicion` → `aprobado`: User accepts proposal and customer confirms in stage 4
- `aprobado` → `cancelado`: User cancels or customer withdraws (any stage)
- `cancelado`: Final state; no further changes

---

## Versioning Strategy

### Why Versioning?

Each stage collects information that customers may revise. Versioning ensures:
1. Audit trail of changes
2. Clear communication of impact to downstream stakeholders
3. Automatic invalidation of dependent data (cascading)

### Versioning Rules

Each stage entity tracks a `version: Int` field, but versions are **not** updated in place — every save does a Prisma `create` of a brand-new row for that stage (never an `update` to the previous version row). Reads always take the latest row per stage via `orderBy: [{ version: "desc" }, { updatedAt: "desc" }], take: 1`.

```
version: Int @default(1)
isCompleted: Boolean @default(false)
completedAt: DateTime?
createdById: String?
```

**When a new version is created**:
- User edits stage data and saves
- `OverhaulEntity.updateNecesidad/updateAlcance/...` bumps `stage.version` in memory and calls `invalidateDownstreamFrom(stage)`, which resets `isCompleted: false` / `completedAt: null` on every downstream stage (in memory only — no version bump for those stages)
- `PrismaOverhaulRepository.save()` persists all 5 stages as new rows in one `overhaul.update({ data: { necesidad: { create: ... }, alcance: { create: ... }, ... } })` call, so downstream stages get a new row too (same version number, just `isCompleted` reset) — this keeps every stage's row count in sync for history/monitor queries

**Cascade Mapping**:
```
Necesidad (1) changes
  → Alcance.isCompleted = false
  → Tarifa.isCompleted = false
  → Propuesta.isCompleted = false
  → Planificacion.isCompleted = false

Alcance (2) changes
  → Tarifa.isCompleted = false
  → Propuesta.isCompleted = false
  → Planificacion.isCompleted = false

Tarifa (3) changes
  → Propuesta.isCompleted = false
  → Planificacion.isCompleted = false

Propuesta (4) changes
  → Planificacion.isCompleted = false

Planificacion (5) changes
  → (no cascade; final stage)
```

### Implementation Pattern

```typescript
// packages/backend/src/services/overhaul-service.ts
public async updateNecesidad(id: string, input: CreateNecesidadInput, actor: string | null) {
  const overhaul = await this.getOverhaul(id)
  const now = new Date().toISOString()

  overhaul.actor = actor               // becomes createdById on the new rows
  overhaul.updateNecesidad(input, now) // bumps version, resets downstream isCompleted
  await this.overhaulRepository.save(overhaul)

  return { id: overhaul.id }
}
```

```typescript
// packages/backend/src/repositories/prisma-overhaul-repository.ts
public async save(overhaul: OverhaulEntity): Promise<void> {
  const [necesidadData, alcanceData] = await Promise.all([
    this.necesidadSnapshot(overhaul), // resolves cliente/taller/maquinas to FK ids
    this.alcanceSnapshot(overhaul),   // resolves taller/atencion to FK ids per component
  ])

  await this.prisma.overhaul.update({
    where: { id: overhaul.id },
    data: {
      state: overhaul.state,
      necesidad: { create: necesidadData },
      alcance: { create: alcanceData },
      tarifas: { create: this.tarifasSnapshot(overhaul) },
      propuesta: { create: this.propuestaSnapshot(overhaul) },
      planificacion: { create: this.planificacionSnapshot(overhaul) },
    },
  })
}
```

Free-text cliente/taller/modelo/atención values (from datalist-backed form inputs) are resolved via `upsert(where: { name })` inside the snapshot builders, so new catalog entries get registered automatically instead of being rejected.

---

## Project Structure

```
next-app/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── layout.tsx           # Root layout
│       │   ├── page.tsx             # Dashboard/home
│       │   ├── overhauls/           # Overhaul feature routes
│       │   │   ├── page.tsx         # List overhauls
│       │   │   ├── [id]/
│       │   │   │   ├── page.tsx     # View overhaul (orchestrator)
│       │   │   │   ├── necesidad/
│       │   │   │   ├── alcance/
│       │   │   │   ├── tarifa/
│       │   │   │   ├── propuesta/
│       │   │   │   └── planificacion/
│       │   └── api/                 # API routes
│       │       └── overhauls/
│       │           ├── route.ts     # POST /api/overhauls (create)
│       │           └── [id]/
│       │               ├── necesidad/route.ts
│       │               ├── alcance/route.ts
│       │               ├── tarifa/route.ts
│       │               ├── propuesta/route.ts
│       │               └── planificacion/route.ts
│       ├── components/              # Feature-specific components
│       │   ├── overhaul-card.tsx
│       │   ├── stage-progress.tsx
│       │   └── ...
│       ├── hooks/                   # React hooks
│       │   ├── use-overhaul.ts
│       │   └── ...
│       └── lib/                     # Utilities
│           └── client-utils.ts
│
├── packages/
│   ├── backend/
│   │   ├── services/
│   │   │   ├── overhaul.service.ts
│   │   │   ├── necesidad.service.ts
│   │   │   ├── alcance.service.ts
│   │   │   ├── tarifa.service.ts
│   │   │   ├── propuesta.service.ts
│   │   │   └── planificacion.service.ts
│   │   ├── repositories/
│   │   │   ├── overhaul.repository.ts
│   │   │   ├── necesidad.repository.ts
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── validators.ts        # Input validation
│   │   │   ├── cascade.ts           # Versioning cascade logic
│   │   │   └── formatters.ts        # Data transformation
│   │   ├── types/
│   │   │   └── index.ts             # Shared types (exports from Prisma)
│   │   └── index.ts                 # Public exports
│   │
│   ├── ui/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── modal.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── ...
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   │       └── utils.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── typescript-config/
│
├── prisma/
│   ├── schema.prisma               # Prisma schema (all models)
│   └── migrations/                 # Database migrations
│
├── tsconfig.json
├── turbo.json
└── package.json
```

### Routing Convention

API endpoints follow the stage progression:

```
POST   /api/overhauls                      # Create new overhaul
GET    /api/overhauls                      # List all
GET    /api/overhauls/:id                  # Get overhaul + stages

PATCH  /api/overhauls/:id/necesidad        # Update stage 1
PATCH  /api/overhauls/:id/alcance          # Update stage 2
PATCH  /api/overhauls/:id/tarifa           # Update stage 3
PATCH  /api/overhauls/:id/propuesta        # Update stage 4 (state changes here)
PATCH  /api/overhauls/:id/planificacion    # Update stage 5

DELETE /api/overhauls/:id                  # Soft-delete or cancel
```

---

## Authentication & User Management

### User Model

Users stored in PostgreSQL; next-auth uses the `Credentials` provider (JWT-based sessions, no DB `Session` table).

```
User {
  id: String @id @default(cuid())
  name: String
  email: String @unique
  passwordHash: String
  role: UserRole   // admin | commercial | pricing | planning

  // Author back-relations (createdById FK on every stage model)
  necesidades: OverhaulNecesidad[]
  alcances: OverhaulAlcance[]
  tarifas: OverhaulTarifas[]
  propuestas: OverhaulPropuesta[]
  planificaciones: OverhaulPlanificacion[]

  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

`getCurrentActor()` (`apps/web/lib/current-actor.ts`) returns the signed-in `session.user.id`, which flows through `OverhaulEntity.actor` into every stage snapshot's `createdById`.

### Role-Based Access Control

- **admin**: Full access (user management, all overhauls)
- **commercial**: Create/edit Necesidad, Alcance; manage Propuesta
- **pricing**: Manage Tarifa
- **planning**: Manage Planificación

Implement RBAC in middleware or API route guards:

```typescript
// Middleware example
export function withRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session || !allowedRoles.includes(session.user.role)) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
  };
}
```

---

## Storage & File Management

### Google Cloud Storage Integration

Files (specifications, proposals, planning docs) upload to GCS:

```
gs://overhaul-project-bucket/
├── necessidades/
│   └── {overhaul_id}/
│       └── specification.pdf
├── propuestas/
│   └── {overhaul_id}/
│       └── proposal_v1.pdf
└── planificacion/
    └── {overhaul_id}/
        └── planning_doc.xlsx
```

### Upload Workflow

1. **Client**: Form with file input
2. **API Route** (`POST /api/overhauls/:id/upload`):
   - Validate file type/size
   - Generate signed URL (time-limited write access)
   - Return URL to client
3. **Client**: Upload directly to GCS via signed URL
4. **Backend**: Store GCS URL in database field (e.g., `propuestaUri`)

### Implementation Hints

```typescript
// In /packages/backend/services/storage.service.ts
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
});

async function generateSignedUrl(bucketName: string, fileName: string) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 min
  });
  
  return url;
}
```

### Environment Variables

```
GCP_PROJECT_ID=<project-id>
GCP_KEY_FILE=<path-to-service-account-key.json>
GCS_BUCKET_NAME=overhaul-project-bucket
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/overhaul_db
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000
```

---

## Development Conventions

### Code Organization

- **Services** (`packages/backend/services/`): Business logic, validation, orchestration
- **Repositories** (`packages/backend/repositories/`): Database access (Prisma queries)
- **Hooks** (`apps/web/hooks/`): Client-side state, data fetching (React Query optional)
- **Components** (`packages/ui/src/components/`): UI primitives (shadcn), reusable
- **Utils** (`packages/backend/utils/`, `packages/ui/src/lib/`): Pure functions, helpers

### Naming Conventions

| Entity | File | Folder | Export |
|--------|------|--------|--------|
| User Model | `user.ts` | (in service/repo) | `User` (from Prisma) |
| Overhaul Service | `overhaul.service.ts` | `services/` | `OverhaulService` |
| Overhaul Repo | `overhaul.repository.ts` | `repositories/` | `OverhaulRepository` |
| Component | `overhaul-card.tsx` | `components/` | `OverhaulCard` |
| Hook | `use-overhaul.ts` | `hooks/` | `useOverhaul` |
| Type | `index.ts` | `types/` | Exported from Prisma or inline |

### API Response Format

```typescript
// Success
{
  success: true,
  data: { /* entity */ },
  timestamp: "2026-08-20T10:30:00Z"
}

// Error
{
  success: false,
  error: "Validation failed",
  details: ["Field X is required"],
  timestamp: "2026-08-20T10:30:00Z"
}
```

### Validation Pattern

Use a centralized validation utility:

```typescript
// packages/backend/utils/validators.ts
export function validateNecesidad(data: unknown) {
  const schema = z.object({
    proyecto: z.string().min(1),
    clienteId: z.string().uuid(),
    ubicacion: z.string(),
    // ...
  });
  return schema.safeParse(data);
}

// In service
const result = validateNecesidad(data);
if (!result.success) {
  throw new ValidationError(result.error.errors);
}
```

### Component Patterns

**Server Component** (default):
```typescript
// apps/web/app/overhauls/[id]/page.tsx
export default async function OverhaulDetailPage({ params }) {
  const overhaul = await fetchOverhaul(params.id); // Server-side fetch
  return <OverhaulDetail overhaul={overhaul} />;
}
```

**Client Component** (with interactivity):
```typescript
// apps/web/components/overhaul-form.tsx
'use client';
import { useOverhaul } from '@/hooks/use-overhaul';

export function OverhaulForm({ id }: { id: string }) {
  const { data, mutate } = useOverhaul(id);
  // ...
}
```

### Minimalist UI Principles

- Use shadcn components as-is; customize only via Tailwind classes
- Embrace whitespace; avoid decorations
- Semantic color: green for success, red for error, neutral for default
- Typography: Clear hierarchy (h1 > h2 > h3 > body)
- Forms: Inline validation, clear error messages, no magic
- Tables: Minimal borders, good contrast, sortable headers

### Error Handling

```typescript
// In API route
try {
  const result = await overhaulService.updateNecesidad(id, data);
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: false, error: error.message, details: error.details },
      { status: 400 }
    );
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
  // Log and return generic error
  console.error(error);
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Summary

This architecture ensures:
- **Clarity**: Each stage has a clear purpose, model, and progression
- **Flexibility**: Versioning allows rework; cascading ensures consistency
- **Scalability**: Separation of UI, backend, and shared components
- **Security**: Role-based access, server-side validation, signed URLs
- **Minimalism**: Clean UI, no unnecessary complexity, data-driven UI

For implementation, start with Prisma schema, then backend services, then UI pages. Test versioning cascade logic thoroughly.