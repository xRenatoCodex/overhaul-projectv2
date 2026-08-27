import type {
  CreateNecesidadInput,
  OverhaulAlcanceData,
  OverhaulNecesidadData,
  OverhaulPlanificacionData,
  OverhaulPropuestaData,
  OverhaulStage,
  OverhaulState,
  OverhaulTarifasData,
  StageVersion,
  UpdateAlcanceInput,
  UpdatePropuestaInput,
  UpdateTarifaRepuestosInput,
  UpdateTarifasInput,
} from "@workspace/backend/types/overhaul"

type StageMap = {
  necesidad: OverhaulNecesidadData
  alcance: OverhaulAlcanceData
  tarifas: OverhaulTarifasData
  propuesta: OverhaulPropuestaData
  planificacion: OverhaulPlanificacionData
}

export class OverhaulEntity {
  constructor(
    public readonly id: string,
    public state: OverhaulState,
    public readonly createdAt: string,
    public updatedAt: string,
    public stages: StageMap,
  ) {}

  public static createFromNecesidad(
    id: string,
    input: CreateNecesidadInput,
    now: string,
  ): OverhaulEntity {
    return new OverhaulEntity(id, "definicion", now, now, {
      necesidad: {
        ...input,
        version: 1,
        isCompleted: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      alcance: {
        version: 1,
        isCompleted: false,
        completedAt: null,
        updatedAt: now,
        resumen: "",
        systems: [],
      },
      tarifas: {
        version: 1,
        isCompleted: false,
        completedAt: null,
        updatedAt: now,
        currency: "USD",
        total: 0,
        groups: [],
        partes: [],
      },
      propuesta: {
        version: 1,
        isCompleted: false,
        completedAt: null,
        updatedAt: now,
        emision: "",
        contacto: { name: "", location: "" },
        condiciones: [],
        inclusionesExclusiones: [],
        fechaReparacion: "",
        terminosGenerales: "",
        garantias: "",
        propuestaUri: "",
      },
      planificacion: {
        version: 1,
        isCompleted: false,
        completedAt: null,
        updatedAt: now,
        fechaInicio: "",
        fechaFin: "",
      },
    })
  }

  public getStage(stage: OverhaulStage): StageMap[OverhaulStage] {
    return this.stages[stage]
  }

  public updateNecesidad(input: CreateNecesidadInput, now: string): void {
    const currentVersion = this.stages.necesidad.version + 1
    this.stages.necesidad = {
      ...input,
      version: currentVersion,
      isCompleted: false,
      completedAt: null,
      createdAt: this.stages.necesidad.createdAt,
      updatedAt: now,
    }
    this.invalidateDownstreamFrom("necesidad", now)
    this.updatedAt = now
  }

  public updateAlcance(input: UpdateAlcanceInput, now: string): void {
    const currentVersion = this.stages.alcance.version + 1
    this.stages.alcance = {
      ...this.stages.alcance,
      systems: input.systems,
      version: currentVersion,
      isCompleted: false,
      completedAt: null,
      updatedAt: now,
    }
    this.invalidateDownstreamFrom("alcance", now)
    this.updatedAt = now
  }

  public updatePropuesta(input: UpdatePropuestaInput, now: string): void {
    this.stages.propuesta = {
      ...input,
      version: this.stages.propuesta.version + 1,
      isCompleted: false,
      completedAt: null,
      updatedAt: now,
    }
    this.invalidateDownstreamFrom("propuesta", now)
    this.updatedAt = now
  }

  public updateTarifas(input: UpdateTarifasInput, now: string): void {
    const total = input.groups.reduce(
      (groupsTotal, group) =>
        groupsTotal +
        group.jobs.reduce(
          (jobsTotal, job) =>
            jobsTotal + job.materialAndMo + job.miscelaneos + job.repuestos,
          0,
        ),
      0,
    )

    this.stages.tarifas = {
      ...this.stages.tarifas,
      currency: input.currency,
      groups: input.groups,
      total: Math.round((total + Number.EPSILON) * 100) / 100,
      version: this.stages.tarifas.version + 1,
      isCompleted: false,
      completedAt: null,
      updatedAt: now,
    }
    this.invalidateDownstreamFrom("tarifas", now)
    this.updatedAt = now
  }

  public updateTarifaRepuestos(
    input: UpdateTarifaRepuestosInput,
    now: string,
  ): void {
    this.stages.tarifas = {
      ...this.stages.tarifas,
      partes: input.partes,
      version: this.stages.tarifas.version + 1,
      isCompleted: false,
      completedAt: null,
      updatedAt: now,
    }
    this.invalidateDownstreamFrom("tarifas", now)
    this.updatedAt = now
  }

  public markStageCompleted(stage: OverhaulStage, now: string): void {
    const stageData = this.stages[stage] as StageVersion
    stageData.isCompleted = true
    stageData.completedAt = now
    stageData.updatedAt = now
    this.updatedAt = now
  }

  private invalidateDownstreamFrom(stage: OverhaulStage, now: string): void {
    const order: OverhaulStage[] = [
      "necesidad",
      "alcance",
      "tarifas",
      "propuesta",
      "planificacion",
    ]
    const index = order.indexOf(stage)

    for (let i = index + 1; i < order.length; i += 1) {
      const targetStage = order[i]
      if (!targetStage) {
        continue
      }
      const stageData = this.stages[targetStage] as StageVersion
      stageData.isCompleted = false
      stageData.completedAt = null
      stageData.updatedAt = now
    }
  }
}
