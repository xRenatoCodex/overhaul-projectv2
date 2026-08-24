export type SistemaCatalogo = {
  sistema: string
  componentes: string[]
}

export const sistemas797F: SistemaCatalogo[] = [
  {
    sistema: "Power train",
    componentes: [
      "Motor",
      "Transmisión",
      "Convertidor",
      "Mandos Finales",
      "Ruedas",
      "Diferencial",
      "Aros",
      "Eje Cardan",
      "Core de radiador",
    ],
  },
  {
    sistema: "Sistema hidráulico",
    componentes: [
      "Bombas y Motores hid.",
      "Mando de Bombas",
      "Cilindros Levante",
      "Cilindros Dirección",
      "Suspensión",
      "Acumuladores",
      "Enfriador Hidráulico",
      "Enfriador Dirección",
      "Enfriador Transmisión",
      "Válvulas de Control",
      "Mangueras",
    ],
  },
  {
    sistema: "Sistema eléctrico",
    componentes: ["ECM", "Harness", "Cámaras", "Faros LED, Sensores"],
  },
  {
    sistema: "Cabina",
    componentes: [
      "Estructura",
      "Pedales",
      "Aire Acondicionado",
      "Asiento",
      "Cinturón de seguridad",
      "Panel de Instrumentos",
      "Vidrios",
      "Timón de Dirección",
      "Controles",
    ],
  },
  {
    sistema: "Estructuras",
    componentes: [
      "Frame front",
      "Frame rear",
      "Link de Dirección",
      "Link Upper",
      "Link Lower",
      "Plataforma RH",
      "Pines",
      "Sistema de Lubricación",
    ],
  },
  {
    sistema: "Implementos",
    componentes: ["Lift arm", "Lever", "Link", "Bucket", "Pines y bocinas"],
  },
]
