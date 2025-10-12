import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" });
  }

  const user = await currentUser();
  const displayName = user?.firstName?.trim() || user?.username || "";

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex items-center justify-end px-6 py-4">
        <UserButton afterSignOutUrl="/" />
      </header>
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="w-full max-w-2xl space-y-6">
          <h1 className="text-4xl font-semibold sm:text-5xl">Dashboard</h1>
          <p className="text-lg text-white/70">
            Welcome back{displayName ? `, ${displayName}` : ""}! You&apos;re viewing a protected page that only signed-in
            users can access.
          </p>
        </div>
      </section>
    </main>
  );
}
