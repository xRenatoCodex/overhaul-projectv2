"use client"

import Link from "next/link"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"
import { ArrowRight, Check, ShieldCheck } from "lucide-react"
import { useEffect, useRef } from "react"

const chapters = [
  {
    range: [0.18, 0.34, 0.46] as const,
    title: "La necesidad toma forma.",
    copy: "Máquinas, condiciones y fechas quedan conectadas desde el primer registro.",
  },
  {
    range: [0.44, 0.6, 0.72] as const,
    title: "El alcance conserva el contexto.",
    copy: "Sistemas, componentes y mejoras avanzan sobre una única versión verificable.",
  },
  {
    range: [0.7, 0.84, 0.97] as const,
    title: "La ejecución deja de improvisar.",
    copy: "Tarifa, propuesta y planificación llegan alineadas al momento de entrar al taller.",
  },
]

const stages = [
  {
    name: "Necesidad",
    copy: "Captura máquinas, condición operativa, ubicación y fechas objetivo.",
  },
  {
    name: "Alcance",
    copy: "Define sistemas, componentes, requerimientos y mejoras solicitadas.",
  },
  {
    name: "Tarifa",
    copy: "Estructura trabajos, horas, repuestos y costos con trazabilidad.",
  },
  {
    name: "Propuesta",
    copy: "Convierte la definición técnica en una oferta comercial controlada.",
  },
  {
    name: "Planificación",
    copy: "Coordina abastecimiento, riesgos, stock y ejecución de taller.",
  },
]

const controls = [
  {
    title: "Versiones independientes",
    copy: "Cada etapa conserva su propia revisión sin perder el historial del proyecto.",
  },
  {
    title: "Cambios con impacto visible",
    copy: "Una modificación reactiva las etapas posteriores que necesitan evaluación.",
  },
  {
    title: "Acceso según responsabilidad",
    copy: "Ingeniería, aprobación y consulta operan con permisos definidos.",
  },
]

const questions = [
  {
    question: "¿Qué ocurre cuando cambia una etapa?",
    answer:
      "La plataforma incrementa su versión y marca las etapas dependientes para una nueva revisión.",
  },
  {
    question: "¿El equipo puede trabajar sobre información desactualizada?",
    answer:
      "Los cambios anteriores invalidan la finalización de las etapas posteriores para hacer visible el impacto.",
  },
  {
    question: "¿Dónde se gestiona la aprobación del overhaul?",
    answer:
      "La transición de definición a aprobado ocurre en Propuesta, donde se controla la decisión comercial.",
  },
  {
    question: "¿La plataforma cubre la planificación de repuestos?",
    answer:
      "Sí. La etapa final reúne cantidades, inventario, riesgo, distribución regional y observaciones de compra.",
  },
]

const revealWords =
  "Una decisión cambia. Todo el proyecto entiende el impacto.".split(" ")

function LoginLink({ dark = false }: { dark?: boolean }) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Link
        href="/login"
        className={
          dark
            ? "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-[#131209] px-3 text-sm font-semibold text-[#fc0] outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#272727] focus-visible:ring-2 focus-visible:ring-[#131209] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fc0]"
            : "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-[#fc0] px-3 text-sm font-semibold text-[#131209] outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#ffe066] focus-visible:ring-2 focus-visible:ring-[#fc0] focus-visible:ring-offset-4 focus-visible:ring-offset-[#131209]"
        }
      >
        Ingresar
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </motion.div>
  )
}

function StoryChapter({
  chapter,
  progress,
}: {
  chapter: (typeof chapters)[number]
  progress: ReturnType<typeof useScroll>["scrollYProgress"]
}) {
  const opacity = useTransform(
    progress,
    [chapter.range[0], chapter.range[1], chapter.range[2]],
    [0, 1, 0],
  )
  const y = useTransform(
    progress,
    [chapter.range[0], chapter.range[1], chapter.range[2]],
    [48, 0, -48],
  )

  return (
    <motion.article
      style={{ opacity, y }}
      className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
    >
      <div className="max-w-[680px]">
        <h2 className="text-4xl font-semibold text-balance md:text-6xl">
          {chapter.title}
        </h2>
        <p className="mt-6 max-w-lg text-base text-white/70 text-pretty md:text-lg">
          {chapter.copy}
        </p>
      </div>
    </motion.article>
  )
}

function VideoStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const durationRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const latestProgressRef = useRef(0)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12, 0.14], [1, 1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.14], [0, -80])
  const heroDisplay = useTransform(scrollYProgress, (value) =>
    value > 0.145 ? "none" : "block",
  )
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.03, 1])
  const progressScale = useTransform(scrollYProgress, [0.04, 0.98], [0, 1])

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    latestProgressRef.current = progress
    if (prefersReducedMotion || frameRef.current !== null) return

    frameRef.current = requestAnimationFrame(() => {
      const video = videoRef.current
      const duration = durationRef.current

      frameRef.current = null
      if (!video || !duration || video.readyState < HTMLMediaElement.HAVE_METADATA) {
        return
      }

      const targetTime = Math.min(
        latestProgressRef.current * duration,
        Math.max(duration - 0.04, 0),
      )

      if (Math.abs(video.currentTime - targetTime) > 0.016) {
        video.currentTime = targetTime
      }
    })
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const prepareVideo = () => {
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 0
      video.pause()

      if (video.currentTime === 0) {
        video.currentTime = prefersReducedMotion ? 0 : 0.01
      }
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      prepareVideo()
    }

    video.addEventListener("loadedmetadata", prepareVideo)

    return () => {
      video.removeEventListener("loadedmetadata", prepareVideo)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [prefersReducedMotion])

  return (
    <section
      ref={sectionRef}
      className="relative h-[440dvh] bg-[#131209] text-white"
    >
      <div className="sticky top-0 min-h-dvh overflow-hidden">
        <motion.video
          ref={videoRef}
          style={{ scale: videoScale }}
          className="absolute inset-0 size-full object-cover opacity-70"
          src="/images/videos/landing/exacadora.mp4"
          muted
          playsInline
          preload="auto"
          aria-label="Excavadora en operación, controlada por el avance de la página"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-y-0 left-0 w-3/4 bg-black/60 blur-3xl" />

        <header className="absolute inset-x-0 top-0 z-10 mx-auto flex h-20 w-full max-w-[1400px] items-center px-6 lg:px-12">
          <Link
            href="/"
            aria-label="Overhaul, inicio"
            className="text-base font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#fc0]"
          >
            OVERHAUL<span className="text-[#fc0]">.</span>
          </Link>
        </header>

        <div className="relative mx-auto h-[100dvh] w-full max-w-[1400px] px-6 lg:px-12">
          <motion.div
            style={{ opacity: heroOpacity, y: heroY, display: heroDisplay }}
            className="absolute inset-x-6 bottom-16 max-w-[680px] lg:inset-x-12 lg:bottom-20"
          >
            <p className="mb-6 text-sm font-semibold text-[#fc0]">
              Gestión integral de overhaul
            </p>
            <h1 className="bg-gradient-to-r from-white to-[#9b9b9b] bg-clip-text text-5xl font-semibold text-transparent text-balance md:text-6xl">
              Decisiones conectadas.
              <br />
              Ejecución bajo control.
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/75 text-pretty md:text-lg">
              Coordina cada overhaul desde el requerimiento hasta el taller.
            </p>
            <div className="mt-8">
              <LoginLink />
            </div>
          </motion.div>

          <div className="pointer-events-none absolute inset-x-6 top-0 h-full lg:inset-x-12">
            {chapters.map((chapter) => (
              <StoryChapter
                key={chapter.title}
                chapter={chapter}
                progress={scrollYProgress}
              />
            ))}
          </div>

          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-12 lg:w-80">
            <div className="h-px overflow-hidden bg-white/20">
              <motion.div
                className="h-full origin-left bg-[#fc0]"
                style={{ scaleX: progressScale }}
              />
            </div>
            <div className="mt-3 flex justify-between text-xs text-white/50">
              <span>Requerimiento</span>
              <span>Ejecución</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RevealWord({
  word,
  index,
  progress,
}: {
  word: string
  index: number
  progress: ReturnType<typeof useScroll>["scrollYProgress"]
}) {
  const start = index / revealWords.length
  const color = useTransform(
    progress,
    [start, Math.min(start + 0.18, 1)],
    ["rgba(255,255,255,0.28)", "rgba(255,255,255,1)"],
  )

  return (
    <motion.span style={{ color }} className="inline-block pr-3">
      {word}
    </motion.span>
  )
}

function TaglineReveal() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 40%"],
  })

  return (
    <section
      ref={sectionRef}
      className="flex min-h-[100dvh] items-center bg-[#181818] px-6 py-24 text-white lg:px-12"
    >
      <p className="mx-auto max-w-[680px] text-4xl font-semibold text-balance md:text-6xl">
        {revealWords.map((word, index) => (
          <RevealWord
            key={`${word}-${index}`}
            word={word}
            index={index}
            progress={scrollYProgress}
          />
        ))}
      </p>
    </section>
  )
}

function Workflow() {
  return (
    <section className="bg-[#131209] px-6 py-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 64, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[680px]"
        >
          <h2 className="text-4xl font-semibold text-balance md:text-6xl">
            Cinco disciplinas.
            <br />
            Un proyecto vivo.
          </h2>
          <p className="mt-6 max-w-xl text-base text-white/60 text-pretty md:text-lg">
            Cada equipo trabaja en su momento sin romper la continuidad del proceso.
          </p>
        </motion.div>

        <ol className="mt-20">
          {stages.map((stage, index) => (
            <motion.li
              key={stage.name}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                duration: 0.8,
                delay: index * 0.06,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="grid gap-6 border-t border-white/15 py-8 md:grid-cols-12 md:items-center"
            >
              <div className="flex items-center gap-4 md:col-span-5">
                <span className="font-mono text-xs text-[#fc0]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-2xl font-semibold">{stage.name}</h3>
              </div>
              <p className="max-w-xl text-base text-white/60 text-pretty md:col-span-6">
                {stage.copy}
              </p>
              <Check
                className="hidden size-5 text-[#fc0] md:col-span-1 md:block"
                aria-hidden="true"
              />
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ControlSystem() {
  return (
    <section className="bg-[#1f1f1f] px-6 py-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-16 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 64, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
            className="lg:col-span-5"
          >
            <ShieldCheck className="size-10 text-[#fc0]" aria-hidden="true" />
            <h2 className="mt-8 text-4xl font-semibold text-balance md:text-5xl">
              Control sin fricción operativa.
            </h2>
          </motion.div>

          <div className="grid gap-8 lg:col-span-6 lg:col-start-7">
            {controls.map((control, index) => (
              <motion.article
                key={control.title}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.08,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="border-t border-white/15 pt-8"
              >
                <h3 className="text-xl font-semibold">{control.title}</h3>
                <p className="mt-3 max-w-lg text-base text-white/60 text-pretty">
                  {control.copy}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="bg-[#131209] px-6 py-24 text-white lg:px-12">
      <div className="mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-12">
        <motion.h2
          initial={{ opacity: 0, y: 64 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[680px] text-4xl font-semibold text-balance md:text-5xl lg:col-span-5"
        >
          Lo que el proceso necesita aclarar.
        </motion.h2>

        <div className="lg:col-span-6 lg:col-start-7">
          {questions.map((item) => (
            <details
              key={item.question}
              className="group border-t border-white/15 py-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#fc0] focus-visible:text-[#fc0]">
                {item.question}
                <span
                  className="text-[#fc0] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="max-w-xl pt-4 text-base text-white/60 text-pretty">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="bg-[#fc0] px-6 py-24 text-[#131209] lg:px-12">
      <div className="mx-auto flex min-h-[65dvh] max-w-[1400px] flex-col justify-between gap-16">
        <motion.h2
          initial={{ opacity: 0, y: 64 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[680px] text-5xl font-semibold text-balance md:text-7xl"
        >
          El próximo overhaul empieza con contexto.
        </motion.h2>
        <div className="flex flex-col gap-8 border-t border-black/25 pt-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-lg text-base text-black/65 text-pretty md:text-lg">
            Ingresa y continúa desde la etapa que necesita tu equipo.
          </p>
          <LoginLink dark />
        </div>
      </div>
    </section>
  )
}

export function LandingPage() {
  return (
    <>
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-full bg-[#fc0] px-3 py-2 text-sm font-semibold text-[#131209] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:translate-y-0"
      >
        Ir al contenido
      </a>
      <main id="contenido" className="overflow-clip bg-[#131209] font-sans">
        <VideoStory />
        <TaglineReveal />
        <Workflow />
        <ControlSystem />
        <Faq />
        <FinalCta />
      </main>
    </>
  )
}
