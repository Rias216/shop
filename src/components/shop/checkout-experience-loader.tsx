"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { CheckoutExperience } from "@/components/shop/checkout-experience";

const CheckoutExperienceClient = dynamic(
  () =>
    import("@/components/shop/checkout-experience").then((m) => m.CheckoutExperience),
  { ssr: false },
);

type Props = ComponentProps<typeof CheckoutExperience>;

export function CheckoutExperienceLoader(props: Props) {
  return <CheckoutExperienceClient {...props} />;
}
