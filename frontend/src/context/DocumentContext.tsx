import { createContext, useContext, useState, type ReactNode } from "react";

interface DocumentContextValue {
  selectedDocumentId: string | null;
  setSelectedDocumentId: (id: string | null) => void;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  return (
    <DocumentContext.Provider value={{ selectedDocumentId, setSelectedDocumentId }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
}
