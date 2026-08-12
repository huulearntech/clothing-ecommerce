import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-200 dark:group-[.toaster]:border-slate-800 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans text-xs sm:text-sm border p-4 flex items-center gap-3",
          description: "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400 text-xs",
          actionButton:
            "group-[.toast]:bg-indigo-600 group-[.toast]:text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-500 transition-colors",
          cancelButton:
            "group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
          success: "group-[.toast]:border-emerald-200 dark:group-[.toast]:border-emerald-900/60 group-[.toast]:text-emerald-950 dark:group-[.toast]:text-emerald-100",
          error: "group-[.toast]:border-rose-200 dark:group-[.toast]:border-rose-900/60 group-[.toast]:text-rose-950 dark:group-[.toast]:text-rose-100",
          info: "group-[.toast]:border-indigo-200 dark:group-[.toast]:border-indigo-900/60 group-[.toast]:text-indigo-950 dark:group-[.toast]:text-indigo-100",
          warning: "group-[.toast]:border-amber-200 dark:group-[.toast]:border-amber-900/60 group-[.toast]:text-amber-950 dark:group-[.toast]:text-amber-100",
        },
      }}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-500 shrink-0" />
        ),
        info: (
          <InfoIcon className="size-4 text-indigo-500 shrink-0" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-500 shrink-0" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-rose-500 shrink-0" />
        ),
        loading: (
          <Loader2Icon className="size-4 text-indigo-500 animate-spin shrink-0" />
        ),
      }}
      {...props}
    />
  )
}

export { Toaster }

