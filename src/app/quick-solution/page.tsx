import { redirect } from "next/navigation";

// The study app is versioned under /v1; /quick-solution is just an alias.
export default function QuickSolutionIndex() {
  redirect("/quick-solution/v1");
}
