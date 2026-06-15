import { createContext, useContext, useState, type ReactNode } from "react";

const STORAGE_KEY = "financego.show_amounts";

interface PrivacyContextValue {
  showAmounts: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  showAmounts: true,
  toggle: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [showAmounts, setShowAmounts] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const toggle = () => {
    setShowAmounts((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <PrivacyContext.Provider value={{ showAmounts, toggle }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
