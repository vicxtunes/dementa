import { redirect } from "next/navigation";

// Back-compat: challenges → topics.
export default async function LegacyChallengeRedirect({
  params,
}: {
  params: Promise<{ subjectId: string; rest?: string[] }>;
}) {
  const { subjectId, rest } = await params;
  const tail = rest?.length ? `/topics/${rest.join("/")}` : "/topics";
  redirect(`/subjects/${subjectId}${tail}`);
}
