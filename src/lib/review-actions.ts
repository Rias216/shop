"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

const reviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().trim().min(2, "Name is required").max(80),
  authorEmail: z.union([z.literal(""), z.string().trim().email("Invalid email")]).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(20, "Review must be at least 20 characters").max(2000),
});

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

export type SubmitReviewState = {
  ok: boolean;
  message: string;
};

export async function submitReviewAction(
  _prev: SubmitReviewState | undefined,
  formData: FormData,
): Promise<SubmitReviewState> {
  const productId = String(formData.get("productId") ?? "");
  const product = await db.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true, slug: true },
  });
  if (!product) {
    return { ok: false, message: "Product not found." };
  }

  const emailRaw = String(formData.get("authorEmail") ?? "").trim();
  const parsed = reviewSchema.safeParse({
    productId,
    authorName: formData.get("authorName"),
    authorEmail: emailRaw || undefined,
    rating: formData.get("rating"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid review.";
    return { ok: false, message: first };
  }

  const data = parsed.data;
  await db.review.create({
    data: {
      productId: data.productId,
      authorName: stripHtml(data.authorName),
      authorEmail: data.authorEmail ? stripHtml(data.authorEmail) : null,
      rating: data.rating,
      title: data.title ? stripHtml(data.title) : null,
      body: stripHtml(data.body),
    },
  });

  revalidatePath(`/products/${product.slug}`);
  return {
    ok: true,
    message:
      "Thank you! Your review was submitted and is awaiting moderation before it appears publicly.",
  };
}
