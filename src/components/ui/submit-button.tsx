"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = ButtonProps & {
  pendingLabel: string;
};

export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={cn("pressable-jitter", className)}
      disabled={disabled || pending}
      aria-busy={pending}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
