import type { ReactNode } from "react";

type PublicStateProps = {
  children: ReactNode;
  error?: boolean;
};

export function PublicState({ children, error = false }: PublicStateProps) {
  return (
    <div className="agro-empty-state" role={error ? "alert" : undefined}>
      {children}
    </div>
  );
}
