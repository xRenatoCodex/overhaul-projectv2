import { Suspense } from "react"

import Data from "./data"
import Loading from "./loading"

export default function StatusTotalOverhauls() {
  return (
    <Suspense fallback={<Loading />}>
      <Data />
    </Suspense>
  )
}
