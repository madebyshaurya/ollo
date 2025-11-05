import { auth, currentUser } from "@clerk/nextjs/server"
import { PreferencesForm } from "@/components/settings/preferences-form"
import { getUserPreferences } from "@/lib/actions/user-preferences"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function SettingsPage() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard/settings" })
  }

  const [user, preferences] = await Promise.all([currentUser(), getUserPreferences()])

  const displayName =
    user?.firstName?.trim() ||
    user?.username ||
    (user?.emailAddresses?.[0]?.emailAddress ?? "Your account")

  const primaryEmail = user?.emailAddresses?.[0]?.emailAddress ?? "No email on file"

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 text-foreground sm:gap-8">
      <section className="rounded-2xl border border-border/60 bg-background/85 px-6 py-6 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Workspace
        </p>
        <h1 className="mt-2 text-3xl font-editorial-new font-light tracking-tight text-foreground sm:text-4xl">
          Settings
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Configure how ollo supports your hardware builds—from AI assistance to sourcing workflows.
          All changes apply immediately, so you can keep iterating without leaving the dashboard.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <PreferencesForm initialPreferences={preferences} />

        <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="space-y-1 border-b border-border/70 pb-4">
            <CardTitle className="font-editorial-new text-2xl font-light text-foreground">
              Account overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Keep your contact details up-to-date to stay in sync with collaborators.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Display name
              </p>
              <p className="text-sm text-foreground">{displayName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Primary email
              </p>
              <p className="text-sm text-foreground">{primaryEmail}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Manage advanced profile settings from the menu in the top-right corner. Updates made
              there sync instantly with this workspace.
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full justify-center rounded-lg border-border/70 bg-background/60"
            >
              <a href="mailto:support@ollo.build?subject=Update%20my%20ollo%20account">
                Contact support
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="space-y-1 border-b border-border/70 pb-4">
            <CardTitle className="font-editorial-new text-2xl font-light text-foreground">
              Part sourcing roadmap
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Prepare your workspace for supplier integrations and BOM intelligence.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              Enable the <strong>Part sourcing beta</strong> toggle to unlock experimental supplier
              matching, price break awareness, and inventory alerts. We’ll use these preferences to
              prioritize access as the beta expands.
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>• Connect Digikey, Mouser, and LCSC API keys securely via Supabase Vault.</li>
              <li>• Track alternates and stock levels directly inside each project.</li>
              <li>• Export sourcing-ready BOMs with validated inventory snapshots.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="space-y-1 border-b border-border/70 pb-4">
            <CardTitle className="font-editorial-new text-2xl font-light text-foreground">
              Data &amp; security
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              ollo protects your designs with least-privilege access and full audit trails.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              We store secrets in Supabase, enforce SSL for all supplier calls, and log every AI
              interaction for traceability. Permissions inherit from your Clerk organization.
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>Need to export your data or remove an integration?</p>
              <p>
                Email <a className="underline" href="mailto:privacy@ollo.build">privacy@ollo.build</a>{" "}
                and we’ll confirm within one business day.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
