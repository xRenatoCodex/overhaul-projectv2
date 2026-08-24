"use client"

import { useEffect } from "react"

export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) {
        return
      }
      event.preventDefault()
    }

    function handleLinkClick(event: MouseEvent) {
      if (
        !isDirty ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target
      const link = target instanceof Element ? target.closest("a[href]") : null
      if (!link || link.getAttribute("target") === "_blank" || link.hasAttribute("download")) {
        return
      }

      if (!window.confirm("Hay cambios sin guardar. ¿Salir de todos modos?")) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("click", handleLinkClick, true)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("click", handleLinkClick, true)
    }
  }, [isDirty])
}