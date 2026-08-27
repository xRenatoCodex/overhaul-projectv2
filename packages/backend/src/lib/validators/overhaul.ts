import { string, z } from "zod"

const nonEmptyString = (label: string) =>
  z.string().trim().min(1, `${label} es requerido`)

const optionalString = z.string().trim().max(2_000).optional()

const dateStringSchema = z
  .string()
  .trim()
  .min(1, "La fecha es requerida")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida")

const machineRequirementSchema = z.object({
  model: nonEmptyString("El modelo de la máquina").max(200),
  serial: nonEmptyString("La serie de la máquina").max(200),
})

export const createNecesidadSchema = z.object({
  proyecto: nonEmptyString("El proyecto").max(200),
  cliente: nonEmptyString("El cliente").max(200),
  ubicacion: nonEmptyString("La ubicación").max(200),
  tallerDestino: nonEmptyString("El taller de destino").max(200),
  fechaEstimada: dateStringSchema,
  fechaTarifa: dateStringSchema,
  maquinas: z
    .array(machineRequirementSchema)
    .min(1, "Debes registrar al menos una máquina"),
})

export const componentStateSchema = z.enum([
  "Nuevo",
  "Reman",
  "RGeneral",
  "Resellado",
  "Reutilizar",
  "Cliente",
])

const alcanceComponentSchema = z.object({
  name: nonEmptyString("El nombre del componente").max(200),
  state: componentStateSchema,
  taller: z.string().trim().max(200),
  atencion: z.string().trim().max(200),
  comentarios: optionalString,
})

const alcanceSystemSchema = z.object({
  name: nonEmptyString("El nombre del sistema").max(200),
  components: z
    .array(alcanceComponentSchema)
    .min(1, "Cada sistema debe tener al menos un componente"),
})

export const updateAlcanceSchema = z.object({
  systems: z
    .array(alcanceSystemSchema)
    .min(1, "Añade al menos un sistema con un componente"),
})

const proposalListSchema = z.array(z.string().trim().min(1).max(2_000))

export const updatePropuestaSchema = z.object({
  emision: dateStringSchema,
  contacto: z.object({
    name: nonEmptyString("El nombre del contacto").max(200),
    location: nonEmptyString("La ubicación del contacto").max(200),
    phone: optionalString,
    email: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  }),
  condiciones: proposalListSchema,
  inclusionesExclusiones: z.array(
    z.object({
      system: nonEmptyString("El sistema").max(200),
      components: proposalListSchema,
      inclusiones: proposalListSchema,
      exclusiones: proposalListSchema,
    }),
  ),
  fechaReparacion: dateStringSchema,
  terminosGenerales: nonEmptyString("Los términos generales").max(10_000),
  garantias: nonEmptyString("Las garantías").max(10_000),
  propuestaUri: z.string().trim().max(7_000_000),
})

type MasterDataValues = {
  talleres: string[]
  atenciones: string[]
}

export function createUpdateAlcanceSchemaWithMasterData(
  values: MasterDataValues,
) {
  const talleres = new Set(values.talleres)
  const atenciones = new Set(values.atenciones)

  return updateAlcanceSchema.superRefine((payload, context) => {
    payload.systems.forEach((system, systemIndex) => {
      system.components.forEach((component, componentIndex) => {
        if (!component.taller || !talleres.has(component.taller)) {
          context.addIssue({
            code: "custom",
            message: "Taller no existe en datos maestros",
            path: ["systems", systemIndex, "components", componentIndex, "taller"],
          })
        }

        if (!component.atencion || !atenciones.has(component.atencion)) {
          context.addIssue({
            code: "custom",
            message: "Atención no existe en datos maestros",
            path: [
              "systems",
              systemIndex,
              "components",
              componentIndex,
              "atencion",
            ],
          })
        }
      })
    })
  })
}

export const overhaulStageSchema = z.enum([
  "necesidad",
  "alcance",
  "tarifas",
  "propuesta",
  "planificacion",
])
