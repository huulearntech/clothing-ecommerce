import * as React from "react"
import { AlertTriangle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export const DISCLAIMER_STORAGE_KEY = "disclaimer_acknowledged"

export interface DisclaimerDialogProps {
    /** Optional custom storage key to persist acknowledgment */
    storageKey?: string
    /** Optional callback fired when the user acknowledges the disclaimer */
    onAcknowledge?: () => void
}

export function DisclaimerDialog({
    storageKey = DISCLAIMER_STORAGE_KEY,
    onAcknowledge,
}: DisclaimerDialogProps) {
    const [open, setOpen] = React.useState<boolean>(false)

    React.useEffect(() => {
        try {
            const isAcknowledged = localStorage.getItem(storageKey) === "true"
            if (!isAcknowledged) {
                setOpen(true)
            }
        } catch {
            // In case localStorage is unavailable or restricted
            setOpen(true)
        }
    }, [storageKey])

    const handleUnderstand = () => {
        try {
            localStorage.setItem(storageKey, "true")
        } catch {
            // Handle potential localStorage write restrictions
        }
        setOpen(false)
        if (onAcknowledge) {
            onAcknowledge()
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent
                size="default"
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:max-w-md"
            >
                <AlertDialogHeader>
                    <AlertDialogMedia className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center mb-1">
                        <AlertTriangle className="size-6 text-indigo-600 dark:text-indigo-400" />
                    </AlertDialogMedia>
                    <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Demo Website Disclaimer
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mt-2">
                        This website is created solely for demonstration and testing purposes. The owners and developers take no responsibility or liability for any damage, loss, or consequences whatsoever resulting from its use.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <AlertDialogAction
                        onClick={handleUnderstand}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                    >
                        I understand
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
