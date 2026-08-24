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

All entities listed below map to Prisma models. Use these as reference when writing `schema.prisma`.

### Master Data Entities

Core reference data maintained by admins.

#### MasterCliente
Client/customer records.
```
id: String @id @default(cuid())
name: String
contact: String?
email: String?
createdAt: DateTime @default(now())
```

#### MasterTaller
Workshop/service center locations.
```
id: String @id @default(cuid())
name: String
location: String?
capacity: Int?
createdAt: DateTime @default(now())
```

#### MasterMaquinaModelo
Machine model catalog.
```
id: String @id @default(cuid())
modelo: String
type: String
description: String?
createdAt: DateTime @default(now())
```

#### MasterSystem
Predefined system hierarchy for machines (e.g., Electrical, Hydraulic, Cooling).
```
id: String @id @default(cuid())
name: String
modelo: MasterMaquinaModelo @relation(...)
description: String?
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

#### MasterAtencion
Service types/attention categories (e.g., Preventive, Corrective, Emergency).
```
id: String @id @default(cuid())
name: String
description: String?
```

---

### Overhaul Core

#### Overhaul (Root Entity)

Represents a single overhaul project from start to finish. Contains references to each stage; versioning handled per-stage.

```
Overhaul {
  id: String @id @default(cuid())
  
  // Stage references (1:1 relationships)
  necesidad: OverhaulNecesidad @relation("OverhaulNecesidad")
  alcance: OverhaulAlcance @relation("OverhaulAlcance")
  tarifa: OverhaulTarifa @relation("OverhaulTarifa")
  propuesta: OverhaulPropuesta @relation("OverhaulPropuesta")
  planificacion: OverhaulPlanificacion @relation("OverhaulPlanificacion")
  
  // State machine
  state: "Definicion" | "Aprobado" | "Cancelado"
  
  // Metadata
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

---

### Stage 1: Necesidad

**Purpose**: Capture initial customer requirement—machines to overhaul, location, target dates.
**Versioning**: Increments when machines/target dates change. Cascades: Alcance+ reset `isCompleted: false`.
**Lifecycle**: Created during intake; locked when moved to Alcance stage.

#### OverhaulNecesidad
```
OverhaulNecesidad {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation("OverhaulNecesidad")
  
  // Core data
  proyecto: String
  cliente: MasterCliente @relation(...)
  ubicacion: String
  taller_destino: MasterTaller @relation(...)
  
  // Dates
  fecha_estimada: DateTime
  fecha_tarifa: DateTime
  
  // Machine requirements
  maquinas: MaquinaRequirement[]
  
  // Versioning & completion
  version: Int @default(1)
  isCompleted: Boolean @default(false)
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### Maquina
Machine instance linked to requirement.
```
Maquina {
  id: String @id @default(cuid())
  modelo: MasterMaquinaModelo @relation(...)
  serie: String
  createdAt: DateTime @default(now())
}
```

#### MaquinaRequirement
Links a machine to an overhaul requirement; captures its state.
```
MaquinaRequirement {
  id: String @id @default(cuid())
  maquina: Maquina @relation(...)
  necesidad: OverhaulNecesidad @relation(...)
  
  horometro: Float
  actual_state: String
  final_configuration: String
  
  createdAt: DateTime @default(now())
}
```

---

### Stage 2: Alcance

**Purpose**: Define systems to overhaul, additional requirements, and improvements requested.
**Versioning**: Increments when systems/components change. Cascades: Tarifa+ reset `isCompleted: false`.
**Lifecycle**: Populated from Necesidad; may reference multiple machines and systems.

#### OverhaulAlcance
```
OverhaulAlcance {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation("OverhaulAlcance")
  
  systems: OverhaulAlcanceSystem[]
  requerimientos_adicionales: OverhaulAlcanceRequerimiento[]
  mejoras_solicitadas: OverhaulAlcanceMejora[]
  mejoras_aplicadas: String[]
  
  version: Int @default(1)
  isCompleted: Boolean @default(false)
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### OverhaulAlcanceSystem
Maps a machine's system within scope.
```
OverhaulAlcanceSystem {
  id: String @id @default(cuid())
  alcance: OverhaulAlcance @relation(...)
  maquina: MaquinaRequirement @relation(...)
  system: OverhaulSystem @relation(...)
  
  createdAt: DateTime @default(now())
}
```

#### OverhaulSystem
Copy of MasterSystem for editable overhaul-specific context. Contains components in scope.
```
OverhaulSystem {
  id: String @id @default(cuid())
  name: String
  modelo: MasterMaquinaModelo @relation(...)
  components: OverhaulComponent[]
  
  createdAt: DateTime @default(now())
}
```

#### OverhaulComponent
Component within an overhaul system; tracks service type and state.
```
OverhaulComponent {
  id: String @id @default(cuid())
  system: OverhaulSystem @relation(...)
  
  name: String
  state: "Nuevo" | "Reman" | "RGeneral" | "Resellado" | "Reutilizar" | "Cliente"
  taller: MasterTaller @relation(...)
  atencion: MasterAtencion @relation(...)
  comentarios: String?
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### OverhaulAlcanceRequerimiento
Additional customer requirements beyond standard systems.
```
OverhaulAlcanceRequerimiento {
  id: String @id @default(cuid())
  alcance: OverhaulAlcance @relation(...)
  
  adicional: String
  detalle: String
  especificacion: String? // URL to Google Cloud Storage
  
  createdAt: DateTime @default(now())
}
```

#### OverhaulAlcanceMejora
Improvements: service letters, operational enhancements, etc.
```
OverhaulAlcanceMejora {
  id: String @id @default(cuid())
  alcance: OverhaulAlcance @relation(...)
  
  tipo: "ServiceLetter" | "ServiceMagazine" | "MejoraOperacion"
  descripcion: String
  codigo: String?
  prioridad_comercial: "Baja" | "Media" | "Alta"
  
  createdAt: DateTime @default(now())
}
```

---

### Stage 3: Tarifa

**Purpose**: Break down work into jobs, components, parts; calculate labor and material costs.
**Versioning**: Increments when parts/hours/pricing change. Cascades: Propuesta+ reset `isCompleted: false`.
**Lifecycle**: Generated from Alcance; reviewed by pricing team; locked before proposal.

#### OverhaulTarifa
```
OverhaulTarifa {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation("OverhaulTarifa")
  
  groups: OverhaulTarifaGroupJob[]
  partes: OverhaulTarifaParte[]
  
  version: Int @default(1)
  isCompleted: Boolean @default(false)
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### OverhaulTarifaGroupJob
Logical grouping of work (e.g., "Engine Overhaul", "Hydraulic System").
```
OverhaulTarifaGroupJob {
  id: String @id @default(cuid())
  tarifa: OverhaulTarifa @relation(...)
  
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
  tarifa: OverhaulTarifa @relation(...)
  
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
**Versioning**: Proposal is typically versioned per customer review cycle; cascades to Planificación.
**Lifecycle**: Based on Tarifa; may iterate multiple times; when accepted, Overhaul.state → "Aprobado".
**State Control**: Overhaul state transitions happen here (Definicion → Aprobado → Cancelado).

#### OverhaulPropuesta
```
OverhaulPropuesta {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation("OverhaulPropuesta")
  
  emision: DateTime
  contacto: PropostaContact
  
  condiciones: String[]
  inclusiones_exclusiones: PropostaInclusionExclusion[]
  
  fechaReparacion: DateTime
  terminosGenerales: String
  garantias: String
  propuestaUri: String? // URL to Google Cloud Storage (PDF)
  
  version: Int @default(1)
  isCompleted: Boolean @default(false)
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### PropostaContact (Embedded)
Contact information in proposal.
```
{
  name: String
  location: String
  phone: String?
  email: String?
}
```

#### PropostaInclusionExclusion (Embedded)
Per-system breakdown of what is included/excluded.
```
{
  systems: [
    {
      system: String // System name
      components: OverhaulComponent[]
      inclusiones: String[]
      exclusiones: String[]
    }
  ]
}
```

---

### Stage 5: Planificación

**Purpose**: Schedule parts procurement, workshop logistics, and work execution.
**Versioning**: Increments when parts availability or logistics change.
**Lifecycle**: Final stage; locks in execution plan; can only modify if earlier stages change.

#### OverhaulPlanificacion
```
OverhaulPlanificacion {
  id: String @id @default(cuid())
  overhaul: Overhaul @relation("OverhaulPlanificacion")
  
  repuestos: OverhaulPlanificacionRepuesto[]
  archivo: String? // URL to Google Cloud Storage (planning doc)
  
  version: Int @default(1)
  isCompleted: Boolean @default(false)
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}
```

#### OverhaulPlanificacionRepuesto
Detailed parts procurement record with inventory, risk, and regional stock.
```
OverhaulPlanificacionRepuesto {
  id: String @id @default(cuid())
  planificacion: OverhaulPlanificacion @relation(...)
  
  // Identification
  item: Int
  modelo: String
  numeroDeParte: String
  descripcion: String
  cantidad: Int
  tipoDeRegistro: String // e.g., "S" (Stock), "E" (Special order)
  
  // Inventory
  onHand: Int
  onOrderQuantity: Int
  inProcess: Int
  moneda: Float
  stockSeguridadMin: Int
  stockMaximo: Int
  
  // Replacement & Packaging
  codigoDeReemplazo: String?
  materialDeReemplazo: String?
  indicadorMontajeManguera: "N" | "S"
  cantidadDePaquetes: Int
  metodoDePedido: String
  
  // Weight & Classification
  pesoBruto: Float
  unidadDePeso: String // e.g., "KG"
  grupoDeArticulos: String
  indicadorNoRetornable: "N" | "S"
  
  // Risk & Category Analysis
  month03Risk: "GREEN" | "AMBER" | "RED"
  month49Risk: "GREEN" | "AMBER" | "RED"
  category: String
  
  // Procurement Totals
  qtyCompra: Int
  dnTotal: Float
  pesoTotal: Float
  
  // Regional Stock Distribution
  miamiYMor: Int
  usa: Int
  brasil: Int
  grm: Int
  overseas: Int
  sto: Int
  
  // Status & Notes
  estadoFesa: String
  stockCat: String
  observaciones: String?
  plan: String?
  
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
│   Definicion    │  ← Initial state (project intake)
│  (Planning)     │
└────────┬────────┘
         │ (Proposal approved by customer)
         ↓
┌─────────────────┐
│   Aprobado      │  ← Active overhaul (work in progress)
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
- `Definicion` → `Aprobado`: User accepts proposal and customer confirms in stage 4
- `Aprobado` → `Cancelado`: User cancels or customer withdraws (any stage)
- `Cancelado`: Final state; no further changes

---

## Versioning Strategy

### Why Versioning?

Each stage collects information that customers may revise. Versioning ensures:
1. Audit trail of changes
2. Clear communication of impact to downstream stakeholders
3. Automatic invalidation of dependent data (cascading)

### Versioning Rules

Each stage entity tracks a `version: Int` field:

```
version: Int @default(1)
isCompleted: Boolean @default(false)
```

**When version increments**:
- User edits stage data and saves
- Backend increments `stage.version`
- All downstream stages: `isCompleted: false` + optional notification

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
// In OverhaulService or update endpoint
async updateNecesidad(overhaul_id: string, data: Partial<OverhaulNecesidad>) {
  // 1. Update stage
  const updated = await prisma.overHaulNecesidad.update({
    where: { overhaul_id },
    data: {
      ...data,
      version: { increment: 1 } // Increment version
    }
  });

  // 2. Cascade: reset downstream stages
  await prisma.overHaulAlcance.update({
    where: { overhaul_id },
    data: { isCompleted: false }
  });
  await prisma.overHaulTarifa.update({
    where: { overhaul_id },
    data: { isCompleted: false }
  });
  await prisma.overHaulPropuesta.update({
    where: { overhaul_id },
    data: { isCompleted: false }
  });
  await prisma.overHaulPlanificacion.update({
    where: { overhaul_id },
    data: { isCompleted: false }
  });

  return updated;
}
```

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

Users stored in PostgreSQL via next-auth with session-based auth.

```
User {
  id: String @id @default(cuid())
  email: String @unique
  name: String?
  passwordHash: String
  role: "admin" | "engineer" | "approver" | "viewer"
  
  sessions: Session[]
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}

Session {
  id: String @id @default(cuid())
  sessionToken: String @unique
  userId: String
  user: User @relation(...)
  
  expires: DateTime
  createdAt: DateTime @default(now())
}
```

### Role-Based Access Control

- **Admin**: Full access (user management, all overhauls)
- **Engineer**: Create/edit overhauls; manage Necesidad through Tarifa
- **Approver**: Review and approve Propuesta; can change Overhaul state
- **Viewer**: Read-only access to overhauls

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