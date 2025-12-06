/**
 * Client-side storage helper
 * Uploads files via tRPC to server-side storage
 */

import { trpc } from "./trpc";

export async function uploadImage(file: File): Promise<{ url: string; key: string }> {
  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );

  // This would need a tRPC mutation to handle the upload
  // For now, we'll use a direct approach with FormData
  throw new Error("Upload not implemented - use direct file handling");
}
