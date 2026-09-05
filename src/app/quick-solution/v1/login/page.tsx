import { AuthForm } from "@/components/quick-solution/auth-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mb-10 max-w-md text-center">
        <p className="mb-2 text-xs font-medium tracking-wide text-flame">S2 Chemistry</p>
        <h1 className="font-serif text-3xl font-semibold text-ink">Industrial Processes</h1>
        <p className="mt-2 text-sm text-ink/60">
          An 8-day revision sprint through 11 industrial processes — content, flashcards, and
          auto-graded quizzes.
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
