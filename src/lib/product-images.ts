const DEFAULT_IMAGE = "/products/peptide-placeholder.svg";

export function getProductImage(images: unknown): string {
  if (Array.isArray(images)) {
    const first = images[0];
    if (typeof first === "string" && first.length > 0) return first;
  }
  return DEFAULT_IMAGE;
}

export function imagesJson(paths: string[]): string[] {
  return paths;
}
