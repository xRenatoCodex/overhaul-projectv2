"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  firstValidationError,
} from "@workspace/backend/lib/validators/common"
import { loginRequestSchema } from "@workspace/backend/lib/validators/auth"
import type {
  LoginErrorResponse,
  LoginResponse,
} from "@workspace/backend/types/auth"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = loginRequestSchema.safeParse({
      email: email.trim(),
      password,
    })
    if (!parsed.success) {
      setError(firstValidationError(parsed.error))
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!response.ok) {
        const result: LoginErrorResponse = await response.json()
        throw new Error(result.message || "No se pudo iniciar sesion.")
      }

      const result: LoginResponse = await response.json()
      void result
      router.replace("/home")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo iniciar sesion.",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel
            htmlFor="email"
            className="text-xs font-bold tracking-wide text-zinc-400 uppercase"
          >
            Correo
          </FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="correo@empresa.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            className="h-11 border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:border-[#ffcc00] focus-visible:ring-[#ffcc00]/20"
          />
        </Field>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel
            htmlFor="password"
            className="text-xs font-bold tracking-wide text-zinc-400 uppercase"
          >
            Contrasena
          </FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="********"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            className="h-11 border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:border-[#ffcc00] focus-visible:ring-[#ffcc00]/20"
          />
        </Field>

        <FieldError role="alert" aria-live="polite">
          {error}
        </FieldError>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-11 w-full bg-[#ffcc00] font-bold tracking-wide text-black uppercase hover:bg-[#e6b800]"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </Button>
      </FieldGroup>
    </form>
  )
}
