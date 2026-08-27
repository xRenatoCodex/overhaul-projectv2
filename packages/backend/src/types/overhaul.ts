export type DomainArea = "comercial" | "tarifas" | "planificacion"

export type OverhaulStage =
  | "necesidad"
  | "alcance"
  | "tarifas"
  | "propuesta"
  | "planificacion"

export type OverhaulState = "definicion" | "aprobado" | "cancelado"

export type MachineRequirement = {
  model: string
  serial: string
}

export type CreateNecesidadInput = {
  proyecto: string
  cliente: string
  ubicacion: string
  tallerDestino: string
  fechaEstimada: string
  fechaTarifa: string
  maquinas: MachineRequirement[]
}

export type StageVersion = {
  version: number
  isCompleted: boolean
  completedAt: string | null
  updatedAt: string
}

export type OverhaulNecesidadData = StageVersion &
  CreateNecesidadInput & {
    createdAt: string
  }

export type ComponentState =
  | "Nuevo"
  | "Reman"
  | "RGeneral"
  | "Resellado"
  | "Reutilizar"
  | "Cliente"

export type AlcanceComponent = {
  name: string
  state: ComponentState
  taller?: string
  atencion?: string
  comentarios?: string
}

export type AlcanceSystem = {
  name: string
  components: AlcanceComponent[]
}

export type OverhaulAlcanceData = StageVersion & {
  resumen: string
  systems: AlcanceSystem[]
}

export type UpdateAlcanceInput = {
  systems: AlcanceSystem[]
}

export type TarifaJob = {
  id?: string
  name: string
  materialAndMo: number
  miscelaneos: number
  repuestos: number
  position: number
}

export type TarifaGroupJob = {
  id?: string
  name: string
  horas: number
  position: number
  jobs: TarifaJob[]
}

export type TarifaParte = {
  id?: string
  segmentacion: string
  componentCode: string
  jobCode: string
  parentPartName: string
  groupNumber: string
  partNumber: string
  partNumberSap: string
  partName: string
  quantity: number
  replacementPercent: number
  dealerNet: number
  costoInterno: number
  pu: number
  subtotal: number
  clasificacion: string
  notas?: string
  motivo?: string
  position: number
}

export type OverhaulTarifasData = StageVersion & {
  currency: "USD" | "PEN"
  total: number
  groups: TarifaGroupJob[]
  partes: TarifaParte[]
}

export type UpdateTarifasInput = {
  currency: "USD" | "PEN"
  groups: TarifaGroupJob[]
}

export type UpdateTarifaRepuestosInput = {
  partes: TarifaParte[]
}

export type PropuestaContact = {
  name: string
  location: string
  phone?: string
  email?: string
}

export type PropuestaInclusionExclusion = {
  system: string
  components: string[]
  inclusiones: string[]
  exclusiones: string[]
}

export type OverhaulPropuestaData = StageVersion & {
  emision: string
  contacto: PropuestaContact
  condiciones: string[]
  inclusionesExclusiones: PropuestaInclusionExclusion[]
  fechaReparacion: string
  terminosGenerales: string
  garantias: string
  propuestaUri: string
}

export type UpdatePropuestaInput = Omit<
  OverhaulPropuestaData,
  keyof StageVersion
>

export type OverhaulPlanificacionData = StageVersion & {
  fechaInicio: string
  fechaFin: string
}

export type MonitorItem = {
  overhaulId: string
  proyecto: string
  cliente: string
  ubicacion: string
  tallerDestino: string
  estado: OverhaulState
  fechaEstimada: string
  fechaTarifa: string
  stage: OverhaulStage
  version: number
  isCompleted: boolean
  updatedAt: string
  createdAt: string
}
