"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ReviewStatus } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

async function revalidateReviewPaths(reviewId: string) {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { product: { select: { slug: true } } },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  if (review?.product.slug) {
    revalidatePath(`/products/${review.product.slug}`);
  }
}

export async function approveReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.review.update({
    where: { id },
    data: { status: ReviewStatus.APPROVED },
  });
  await revalidateReviewPaths(id);
  redirect("/admin/reviews?status=PENDING");
}

export async function rejectReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.review.update({
    where: { id },
    data: { status: ReviewStatus.REJECTED },
  });
  await revalidateReviewPaths(id);
  redirect("/admin/reviews");
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const review = await db.review.findUnique({
    where: { id },
    select: { product: { select: { slug: true } } },
  });
  await db.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  if (review?.product.slug) {
    revalidatePath(`/products/${review.product.slug}`);
  }
  redirect("/admin/reviews");
}
