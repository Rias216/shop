"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { ReviewForm } from "@/components/shop/review-form";

const ReviewFormClient = dynamic(
  () => import("@/components/shop/review-form").then((m) => m.ReviewForm),
  { ssr: false },
);

type Props = ComponentProps<typeof ReviewForm>;

export function ReviewFormLoader(props: Props) {
  return <ReviewFormClient {...props} />;
}
