import { Suspense } from "react"

import Data from "./data"
import Loading from "./loading"

export default function ProcessTimeByArea() {
  return (
    <Suspense fallback={<Loading />}>
      <Data />
    </Suspense>
  )
}
