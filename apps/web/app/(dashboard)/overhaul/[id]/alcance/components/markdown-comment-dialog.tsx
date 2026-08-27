"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { MessageSquareText } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

const MarkdownEditor = dynamic(() => import("./initialized-markdown-editor"), {
  ssr: false,
  loading: () => <div className="min-h-72 animate-pulse bg-muted/30" />,
})

export function MarkdownCommentDialog({
  componentName,
  value,
  onSave,
}: {
  componentName: string
  value: string
  onSave: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const summary = toPlainText(value)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(value)
    }
    setOpen(nextOpen)
  }

  function handleSave() {
    onSave(draft.trim())
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-52 justify-start overflow-hidden font-normal"
          title={summary || "Agregar comentario"}
        >
          <MessageSquareText data-icon="inline-start" />
          <span className="truncate">
            {summary || "Agregar comentario"}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comentarios de {componentName || "componente"}</DialogTitle>
          <DialogDescription>
            Usa la barra de herramientas para dar formato al comentario.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-md border bg-background">
          <MarkdownEditor
            markdown={draft}
            onChange={setDraft}
            placeholder="Escribe un comentario..."
            autoFocus={{ defaultSelection: "rootEnd" }}
            className="min-h-72"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Guardar comentario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function toPlainText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
