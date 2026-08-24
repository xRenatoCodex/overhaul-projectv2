import Image from "next/image"

export function LoginBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-black lg:flex lg:w-1/2">
      <Image
        src="/images/login/login-background.png"
        alt=""
        fill
        priority
        sizes="50vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/55 to-black/85" />

      <div className="relative flex h-full w-full flex-col justify-between p-15 text-white">
        <div className="my-auto">
          <div className="mb-6 h-1 w-11 bg-[#ffcc00]" />
          <h1 className="mb-4 text-4xl leading-tight font-extrabold tracking-tight">
            Overhaul
            <br />
            Management
            <br />
            System
          </h1>
          <p className="text-xs font-bold tracking-[0.2em] text-[#ffcc00] uppercase">
            Overhaul · Gran Minería
          </p>
        </div>

        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} Ferreyros Inc. Todos los derechos
          reservados.
        </p>
      </div>
    </div>
  )
}
