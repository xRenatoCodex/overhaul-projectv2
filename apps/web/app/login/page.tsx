import type { Metadata } from "next"
import Image from "next/image"

import { LoginBrandPanel } from "@/app/login/_components/login-brand-panel"
import { LoginForm } from "@/app/login/_components/login-form"

export const metadata: Metadata = {
  title: "Iniciar sesion | Overhaul Management System",
  description: "Accede para gestionar las etapas del overhaul.",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh w-full bg-black">
      <LoginBrandPanel />

      <div className="relative flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-15">
        <div className="absolute top-6 right-6 lg:top-10 lg:right-10">
          <Image
            src="/images/login/ferreyros-logo.png"
            alt="Ferreyros"
            width={170}
            height={42}
            className="h-auto max-h-11 w-auto max-w-42.5 object-contain"
            priority
          />
        </div>

        <div className="w-full max-w-95">
          <p className="mb-2 text-xs font-bold tracking-[0.15em] text-[#ffcc00] uppercase">
            Acceso Corporativo
          </p>
          <h2 className="mb-2 text-3xl font-bold text-white">
            Iniciar sesion
          </h2>
          <p className="mb-8 text-sm text-zinc-500">
            Accede para gestionar las etapas del overhaul.
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
