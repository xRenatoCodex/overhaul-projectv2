"use client"

import Link from "next/link"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"
import { ArrowRight, Check, ChevronDown } from "lucide-react"
import { useRef } from "react"

const chapters = [
  {
    number: "01",
    title: "Define la necesidad",
    copy: "Cada máquina, fecha y condición operativa queda registrada desde el primer contacto.",
  },
  {
    number: "02",
    title: "Construye el alcance",
    copy: "Sistemas, componentes y mejoras avanzan con una versión clara y una sola fuente de verdad.",
  },
  {
    number: "03",
    title: "Convierte datos en ejecución",
    copy: "Tarifa, propuesta y planificación permanecen conectadas hasta que el equipo entra al taller.",
  },
]

const stages = ["Necesidad", "Alcance", "Tarifa", "Propuesta", "Planificación"]

const revealWords = "Del primer requerimiento al plan de taller, cada decisión conserva su contexto.".split(" ")

function LoginLink({ inverse = false }: { inverse?: boolean }) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Link
        href="/login"
        className={inverse
          ? "inline-flex h-10 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-black outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#d7ff3f] focus-visible:ring-2 focus-visible:ring-[#d7ff3f] focus-visible:ring-offset-4 focus-visible:ring-offset-black"
          : "inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 text-sm font-semibold text-white backdrop-blur-xl outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/50 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black"}
      >
        Ingresar
        <ArrowRight aria-hidden="true" />
      </Link>
    </motion.div>
  )
}

function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-black text-white">
      <video
        className="absolute inset-0 size-full object-cover opacity-65"
        src="/images/videos/landing/exacadora.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Excavadora operando en faena"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-x-0 top-0 h-48 bg-black/50 blur-3xl" />

      <header className="relative mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 lg:px-12">
        <Link href="/" aria-label="Overhaul, inicio" className="text-base font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white">
          OVERHAUL<span className="text-[#d7ff3f]">.</span>
        </Link>
        <LoginLink />
      </header>

      <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 items-end px-6 pb-16 lg:px-12 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 64, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[680px]"
        >
          <p className="mb-6 text-sm font-semibold text-[#d7ff3f]">Gestión integral de overhaul</p>
          <h1 className="bg-gradient-to-r from-white to-[#9b9b9b] bg-clip-text text-5xl font-semibold text-transparent text-balance md:text-7xl">
            Cada overhaul bajo control.
          </h1>
          <p className="mt-6 max-w-[680px] text-base leading-6 text-white/75 text-pretty md:text-lg md:leading-7">
            Una plataforma para coordinar alcance, costos, propuesta y planificación de maquinaria pesada.
          </p>
        </motion.div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 pb-6 text-xs text-white/55 lg:px-12">
        <span>Desliza para recorrer el proceso</span>
        <ChevronDown className="animate-bounce" aria-hidden="true" />
      </div>
    </section>
  )
}

function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const durationRef = useRef(0)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.35 })

  useMotionValueEvent(smoothProgress, "change", (progress) => {
    const video = videoRef.current
    if (!video || !durationRef.current || prefersReducedMotion) return
    video.currentTime = Math.min(progress * durationRef.current, durationRef.current - 0.05)
  })

  return (
    <section ref={sectionRef} className="relative h-[320dvh] bg-black text-white">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover opacity-60"
          src="/images/videos/landing/exacadora.mp4"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            durationRef.current = event.currentTarget.duration
            event.currentTarget.currentTime = 0.01
          }}
          aria-label="Secuencia de una excavadora vinculada al avance del recorrido"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-y-0 left-0 w-2/3 bg-black/70 blur-3xl" />

        <div className="relative mx-auto grid h-full max-w-[1400px] grid-cols-1 items-center px-6 lg:grid-cols-12 lg:px-12">
          <div className="lg:col-span-6">
            {chapters.map((chapter, index) => (
              <StoryChapter
                key={chapter.number}
                chapter={chapter}
                index={index}
                progress={smoothProgress}
              />
            ))}
          </div>
          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-12 lg:w-80">
            <div className="h-px overflow-hidden bg-white/20">
              <motion.div className="h-full origin-left bg-[#d7ff3f]" style={{ scaleX: smoothProgress }} />
            </div>
            <div className="mt-3 flex justify-between text-xs text-white/50">
              <span>Necesidad</span>
              <span>Planificación</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StoryChapter({
  chapter,
  index,
  progress,
}: {
  chapter: (typeof chapters)[number]
  index: number
  progress: ReturnType<typeof useSpring>
}) {
  const center = index / (chapters.length - 1)
  const opacity = useTransform(progress, [center - 0.24, center, center + 0.24], [0, 1, 0])
  const y = useTransform(progress, [center - 0.24, center, center + 0.24], [56, 0, -56])

  return (
    <motion.article
      style={{ opacity, y }}
      className="pointer-events-none absolute top-1/2 max-w-xl -translate-y-1/2"
    >
      <span className="font-mono text-sm text-[#d7ff3f]">{chapter.number}</span>
      <h2 className="mt-6 text-4xl font-semibold text-balance md:text-6xl">{chapter.title}</h2>
      <p className="mt-6 max-w-lg text-base leading-6 text-white/65 text-pretty md:text-lg md:leading-7">
        {chapter.copy}
      </p>
    </motion.article>
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
  const opacity = useTransform(progress, [start, Math.min(start + 0.16, 1)], [0.28, 1])

  return (
    <motion.span style={{ opacity }} className="inline-block pr-3">
      {word}
    </motion.span>
  )
}

function TaglineReveal() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 80%", "end 45%"] })

  return (
    <section ref={sectionRef} className="flex min-h-[100dvh] items-center bg-[#181818] px-6 py-24 text-white lg:px-12">
      <p className="mx-auto max-w-[680px] text-4xl font-semibold text-balance md:text-6xl">
        {revealWords.map((word, index) => (
          <RevealWord key={`${word}-${index}`} word={word} index={index} progress={scrollYProgress} />
        ))}
      </p>
    </section>
  )
}

function Workflow() {
  return (
    <section className="bg-black px-6 py-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 64, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[680px]"
        >
          <h2 className="text-4xl font-semibold text-balance md:text-6xl">Cinco etapas. Un solo proyecto.</h2>
          <p className="mt-6 text-base leading-6 text-white/60 text-pretty md:text-lg md:leading-7">
            Cada cambio queda versionado y actualiza las etapas que dependen de él.
          </p>
        </motion.div>

        <ol className="mt-20 grid grid-cols-1 gap-3 md:grid-cols-5">
          {stages.map((stage, index) => (
            <motion.li
              key={stage}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: index * 0.08, ease: [0.32, 0.72, 0, 1] }}
              className="flex min-h-40 flex-col justify-between rounded-xl border border-white/10 bg-[#181818] p-6"
            >
              <span className="font-mono text-xs text-white/35">0{index + 1}</span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold">{stage}</span>
                <Check className="text-[#d7ff3f]" aria-hidden="true" />
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="bg-[#d7ff3f] px-6 py-24 text-black lg:px-12">
      <div className="mx-auto flex min-h-[65dvh] max-w-[1400px] flex-col justify-between gap-16">
        <motion.h2
          initial={{ opacity: 0, y: 64 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[680px] text-5xl font-semibold text-balance md:text-7xl"
        >
          El próximo overhaul empieza aquí.
        </motion.h2>
        <div className="flex flex-col gap-8 border-t border-black/25 pt-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-lg text-base leading-6 text-black/65 text-pretty md:text-lg md:leading-7">
            Ingresa a la plataforma y continúa desde la etapa que necesita tu equipo.
          </p>
          <LoginLink inverse />
        </div>
      </div>
    </section>
  )
}

export function LandingPage() {
  return (
    <main className="overflow-clip bg-black font-sans">
      <Hero />
      <ScrollStory />
      <TaglineReveal />
      <Workflow />
      <FinalCta />
    </main>
  )
}