"use client"

import dynamic from "next/dynamic"
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

const MarkdownEditor = dynamic(
  () => import("../../../overhaul/[id]/alcance/components/initialized-markdown-editor"),
  {
    ssr: false,
    loading: () => <div className="min-h-72 animate-pulse bg-muted/30" />,
  },
)

export function MarkdownCommentViewDialog({
  componentName,
  value,
}: {
  componentName: string
  value: string
}) {
  const summary = toPlainText(value)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-52 justify-start overflow-hidden font-normal"
          title={summary || "Sin comentarios"}
        >
          <MessageSquareText data-icon="inline-start" />
          <span className="truncate">{summary || "Sin comentarios"}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comentarios de {componentName || "componente"}</DialogTitle>
          <DialogDescription>Vista de solo lectura.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-md border bg-background">
          <MarkdownEditor markdown={value} readOnly className="min-h-72" />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cerrar
            </Button>
          </DialogClose>
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
