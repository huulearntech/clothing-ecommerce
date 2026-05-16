"use client";

import { createContext, useContext, useState } from "react";
import { Sheet } from "@/components/ui/sheet";

const FilterSheetSetOpenContext = createContext<React.Dispatch<React.SetStateAction<boolean>> | null>(null);

export default function FilterSheetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <FilterSheetSetOpenContext.Provider value={setOpen}>
        {children}
      </FilterSheetSetOpenContext.Provider>
    </Sheet>
  );
}

export function useFilterSheetSetOpen() {
  const setOpen = useContext(FilterSheetSetOpenContext);
  if (setOpen === null) {
    throw new Error("useFilterSheetSetOpen must be used within a FilterSheetProvider");
  }
  return setOpen;
}