/** Public URL for an object in the `assessment-media` bucket. The bucket is
 *  public, so this is a plain deterministic path — safe on the server and the
 *  client (NEXT_PUBLIC_ env var). */
export function assessmentMediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/assessment-media/${path}`;
}
