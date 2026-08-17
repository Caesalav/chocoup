"use client";

import { useFormStatus } from "react-dom";
import { button } from "@/components/ui/styles";

type Props = {
  children: React.ReactNode;
  variant?: keyof typeof button;
  pendingLabel?: string;
};

/**
 * El estado de envío importa más de lo normal aquí: con mala señal, un guardado
 * puede tardar varios segundos y sin señal visual el equipo pulsa dos veces.
 */
export function SubmitButton({ children, variant = "primary", pendingLabel = "Guardando…" }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={button[variant]} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function DangerSubmitButton({
  children,
  confirmText,
}: {
  children: React.ReactNode;
  confirmText: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={button.danger}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {pending ? "Borrando…" : children}
    </button>
  );
}
