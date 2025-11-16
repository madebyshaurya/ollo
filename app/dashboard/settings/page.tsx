import { auth } from "@clerk/nextjs/server"
import { PreferencesForm } from "@/components/settings/preferences-form"
import { getUserPreferences } from "@/lib/actions/user-preferences"

export default async function SettingsPage() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard/settings" })
  }

  const preferences = await getUserPreferences()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-foreground sm:gap-8">
      <section className="rounded-2xl border border-border/60 bg-background/85 px-6 py-6 shadow-sm backdrop-blur">
        <h1 className="mt-2 text-3xl font-editorial-new font-light tracking-tight text-foreground sm:text-4xl">
          Settings
        </h1>
      </section>

      {/* User Preferences Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">User Preferences</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize your experience
          </p>
        </div>
        <PreferencesForm initialPreferences={preferences} />
      </section>
    </div>
  )
}
