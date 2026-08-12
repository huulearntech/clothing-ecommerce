import { useState, useEffect } from "react";

export function useMediaQuery(query: string) {
  const [queryIsMatched, setQueryIsMatched] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setQueryIsMatched(e.matches);
    mql.addEventListener("change", onChange);
    setQueryIsMatched(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!queryIsMatched;
}