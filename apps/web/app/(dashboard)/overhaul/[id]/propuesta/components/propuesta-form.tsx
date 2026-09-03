"use client"

import dynamic from "next/dynamic"
import { FormEvent, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, FileText, Plus, Trash2, Upload } from "lucide-react"

import { firstValidationError } from "@workspace/backend/lib/validators/common"
import { updatePropuestaSchema } from "@workspace/backend/lib/validators/overhaul"
import type {
    OverhaulPropuestaData,
    PropuestaInclusionExclusion,
} from "@workspace/backend/types/overhaul"
import { Button } from "@workspace/ui/components/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"
import { DialogBody } from "next/dist/next-devtools/dev-overlay/components/dialog";

import {
    StageLockBanner,
    StageLockFieldset,
    useStageLock,
} from "@/components/stage-lock"

const MarkdownEditor = dynamic(
    () => import("../../alcance/components/initialized-markdown-editor"),
    {
        ssr: false,
        loading: () => <div className="min-h-72 animate-pulse bg-muted/30" />,
    },
)

const emptySystem: PropuestaInclusionExclusion = {
    system: "",
    components: [],
    inclusiones: [],
    exclusiones: [],
}

export function PropuestaForm({
    overhaulId,
    initialPropuesta,
}: {
    overhaulId: string
    initialPropuesta: OverhaulPropuestaData
}) {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [systems, setSystems] = useState(initialPropuesta.inclusionesExclusiones)
    const [pdfUri, setPdfUri] = useState(initialPropuesta.propuestaUri)
    const [pdfName, setPdfName] = useState("Propuesta comercial.pdf")
    const [terminosGenerales, setTerminosGenerales] = useState(
        initialPropuesta.terminosGenerales,
    )
    const [garantias, setGarantias] = useState(initialPropuesta.garantias)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const lock = useStageLock(
        initialPropuesta.isCompleted,
        initialPropuesta.version,
    )

    function updateSystem(
        index: number,
        field: keyof PropuestaInclusionExclusion,
        value: string,
    ) {
        setSystems((current) =>
            current.map((system, systemIndex) =>
                systemIndex === index
                    ? {
                        ...system,
                        [field]: field === "system" ? value : parseLines(value),
                    }
                    : system,
            ),
        )
    }

    async function handleFile(file: File) {
        if (file.type !== "application/pdf") {
            setError("Selecciona un archivo PDF.")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("El PDF no puede superar los 5 MB.")
            return
        }

        setError("")
        setPdfName(file.name)
        setPdfUri(await readAsDataUrl(file))
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError("")
        const formData = new FormData(event.currentTarget)
        const payload = {
            emision: String(formData.get("emision") ?? ""),
            contacto: {
                name: String(formData.get("contactoNombre") ?? "").trim(),
                location: String(formData.get("contactoUbicacion") ?? "").trim(),
                phone: String(formData.get("contactoTelefono") ?? "").trim(),
                email: String(formData.get("contactoCorreo") ?? "").trim(),
            },
            condiciones: parseLines(String(formData.get("condiciones") ?? "")),
            inclusionesExclusiones: systems.map((system) => ({
                ...system,
                system: system.system.trim(),
            })),
            fechaReparacion: String(formData.get("fechaReparacion") ?? ""),
            terminosGenerales: terminosGenerales.trim(),
            garantias: garantias.trim(),
            propuestaUri: pdfUri,
        }
        const parsed = updatePropuestaSchema.safeParse(payload)

        if (!parsed.success) {
            setError(firstValidationError(parsed.error))
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/overhaul/${overhaulId}/propuesta`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            })
            const result = await response.json()
            if (!response.ok) {
                throw new Error(result.message ?? "No se pudo guardar la propuesta.")
            }
            lock.lockAgain()
            router.refresh()
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "No se pudo guardar la propuesta.",
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className=" space-y-8">
            <StageLockBanner
                isLocked={lock.isLocked}
                isEditing={lock.isEditing}
                version={initialPropuesta.version}
                nextVersion={lock.nextVersion}
                onStartNewVersion={lock.startNewVersion}
            />

            <StageLockFieldset isLocked={lock.isLocked} className="space-y-8">
            <div className="grid gap-5 md:grid-cols-2">
                <Field label="Fecha de emisión" htmlFor="emision">
                    <Input id="emision" name="emision" type="date" defaultValue={toDateInput(initialPropuesta.emision)} required />
                </Field>
                <Field label="Fecha de reparación" htmlFor="fechaReparacion">
                    <Input id="fechaReparacion" name="fechaReparacion" type="date" defaultValue={toDateInput(initialPropuesta.fechaReparacion)} required />
                </Field>
            </div>

            <Separator />

            <div className="space-y-5">
                <h2 className="font-semibold">Contacto</h2>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nombre" htmlFor="contactoNombre"><Input id="contactoNombre" name="contactoNombre" defaultValue={initialPropuesta.contacto.name} required /></Field>
                    <Field label="Ubicación" htmlFor="contactoUbicacion"><Input id="contactoUbicacion" name="contactoUbicacion" defaultValue={initialPropuesta.contacto.location} required /></Field>
                    <Field label="Teléfono" htmlFor="contactoTelefono"><Input id="contactoTelefono" name="contactoTelefono" defaultValue={initialPropuesta.contacto.phone} /></Field>
                    <Field label="Correo" htmlFor="contactoCorreo"><Input id="contactoCorreo" name="contactoCorreo" type="email" defaultValue={initialPropuesta.contacto.email} /></Field>
                </div>
            </div>

            <Separator />

            <Field label="Condiciones" htmlFor="condiciones">
                <Textarea id="condiciones" name="condiciones" rows={5} defaultValue={initialPropuesta.condiciones.join("\n")} placeholder="Una condición por línea" required />
            </Field>

            <Separator />

            <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">Inclusiones y exclusiones por sistema</h2>
                    <Button type="button" variant="outline" onClick={() => setSystems((current) => [...current, { ...emptySystem }])}><Plus />Añadir sistema</Button>
                </div>
                {systems.map((system, index) => (
                    <div key={index} className="space-y-4 rounded-md border p-4">
                        <div className="flex items-center gap-3">
                            <Input aria-label={`Sistema ${index + 1}`} value={system.system} onChange={(event) => updateSystem(index, "system", event.target.value)} placeholder="Nombre del sistema" required />
                            <Button type="button" variant="ghost" size="icon" onClick={() => setSystems((current) => current.filter((_, systemIndex) => systemIndex !== index))} aria-label="Eliminar sistema" title="Eliminar sistema"><Trash2 /></Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <TextareaField label="Componentes" value={system.components.join("\n")} onChange={(value) => updateSystem(index, "components", value)} />
                            <TextareaField label="Inclusiones" value={system.inclusiones.join("\n")} onChange={(value) => updateSystem(index, "inclusiones", value)} />
                            <TextareaField label="Exclusiones" value={system.exclusiones.join("\n")} onChange={(value) => updateSystem(index, "exclusiones", value)} />
                        </div>
                    </div>
                ))}
            </div>

            <Separator />

            <div className="space-y-5">
                <h2 className="font-semibold">Términos generales</h2>
                <div className="overflow-hidden rounded-md border bg-background">
                    <MarkdownEditor
                        markdown={terminosGenerales}
                        onChange={setTerminosGenerales}
                        placeholder="Redacta los términos generales..."
                        className="min-h-72"
                    />
                </div>
            </div>

            <Separator />

            <div className="space-y-5">
                <h2 className="font-semibold">Garantías</h2>
                <div className="overflow-hidden rounded-md border bg-background">
                    <MarkdownEditor
                        markdown={garantias}
                        onChange={setGarantias}
                        placeholder="Redacta las garantías..."
                        className="min-h-72"
                    />
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Documento de propuesta</h2><Button type="button" variant="outline" onClick={() => inputRef.current?.click()}><Upload />{pdfUri ? "Reemplazar PDF" : "Cargar PDF"}</Button></div>
                <input ref={inputRef} type="file" accept="application/pdf" className="sr-only" aria-label="Cargar PDF" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file) }} />
                {pdfUri ? <PdfPreview name={pdfName} uri={pdfUri} onRemove={() => setPdfUri("")} /> : <p className="text-sm text-muted-foreground">Sin documento adjunto.</p>}
            </div>

            {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

            <Separator />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar propuesta"}</Button></div>
            </StageLockFieldset>
        </form>
    )
}

function PdfPreview({ name, uri, onRemove }: { name: string; uri: string; onRemove: () => void }) {
    return <div className="overflow-hidden rounded-md border">
        <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{name}</span>
            </div>
            <div className="flex shrink-0 gap-1">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label="Ver PDF completo" title="Ver PDF completo">
                            <Eye />
                        </Button>
                    </DialogTrigger>
                    {/* 1. Agregamos flex y flex-col al DialogContent */}
                    <DialogContent className="flex flex-col h-[90vh] max-w-[calc(100%-2rem)] p-5 sm:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle>{name}</DialogTitle>
                        </DialogHeader>
                        {/* 2. Reemplazamos h-full por flex-1 para que llene el espacio restante correctamente */}
                        <iframe
                            title="Propuesta comercial"
                            src={uri}
                            className="flex-1 w-full rounded-md border"
                        />
                    </DialogContent>
                </Dialog>
                <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Quitar PDF" title="Quitar PDF">
                    <Trash2 />
                </Button>
            </div>
        </div>
        <iframe title="Vista previa de propuesta" src={uri} className="h-56 w-full border-t" />
    </div>
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <div className="space-y-2"><span className="text-sm font-medium">{label}</span><Textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="Un elemento por línea" rows={5} /></div>
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
    return <div className="space-y-2"><label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>{children}</div>
}

function parseLines(value: string) { return value.split("\n").map((line) => line.trim()).filter(Boolean) }
function toDateInput(value: string) { return value.slice(0, 10) }
function readAsDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("No se pudo leer el PDF.")); reader.readAsDataURL(file) }) }