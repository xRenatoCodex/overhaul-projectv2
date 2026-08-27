export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
