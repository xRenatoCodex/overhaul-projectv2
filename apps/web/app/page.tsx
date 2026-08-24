import type { Metadata } from "next"

import { LandingPage } from "./_landing/landing-page"

export const metadata: Metadata = {
  title: "Overhaul | Control integral de maquinaria pesada",
  description:
    "Gestiona necesidad, alcance, tarifa, propuesta y planificación de cada overhaul en una sola plataforma.",
}

export default function Page() {
  return <LandingPage />
}
