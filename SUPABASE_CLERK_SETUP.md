# Supabase + Clerk Integration Setup

This guide explains how to connect your Supabase project with Clerk authentication.

## 🚀 Quick Setup Steps

### 1. Configure Clerk for Supabase Compatibility

1. Visit [Clerk's Connect with Supabase page](https://dashboard.clerk.com/setup/supabase)
2. Select your Clerk application
3. Enable the integration - this automatically adds the necessary `role` claim to your session tokens

### 2. Add Clerk as Third-Party Auth Provider in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Third-Party Auth**
3. Click **Add provider** and select **Clerk**
4. Enter your Clerk domain (e.g., `your-app.clerk.dev`)
5. Save the configuration

### 3. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Configuration (you likely already have these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

**Where to find these values:**
- **Supabase URL & Anon Key**: Supabase Dashboard > Settings > API
- **Clerk Keys**: Clerk Dashboard > API Keys

### 4. Install Dependencies

The Supabase client library has already been installed:

```bash
npm install @supabase/supabase-js
```

## 📁 File Structure

The integration includes these files:

- `lib/supabase.ts` - Basic Supabase client
- `lib/supabase-client.ts` - Server-side client with Clerk auth
- `lib/supabase-server.ts` - Server actions utility
- `lib/hooks/use-supabase.ts` - React hook for client-side usage
- `components/supabase-example.tsx` - Example component

## 🔧 Usage Examples

### Client-Side Usage (React Components)

```tsx
import { useSupabase } from '@/lib/hooks/use-supabase'

function MyComponent() {
  const { supabase, isAuthenticated } = useSupabase()

  const fetchData = async () => {
    if (!isAuthenticated) return
    
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
    
    if (error) console.error(error)
    else console.log(data)
  }

  return (
    <button onClick={fetchData} disabled={!isAuthenticated}>
      Fetch Data
    </button>
  )
}
```

### Server-Side Usage (Server Actions)

```tsx
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function serverAction() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
  
  return { data, error }
}
```

### Route Handlers

```tsx
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
  
  return Response.json({ data, error })
}
```

## 🔒 Row Level Security (RLS)

With Clerk integration, you can use RLS policies that reference Clerk user data:

```sql
-- Example: Users can only access their own data
CREATE POLICY "Users can access their own data"
ON your_table
FOR ALL
USING (
  user_id = (
    SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text
  )
);

-- Example: Organization-based access
CREATE POLICY "Organization members can access org data"
ON your_table
FOR ALL
USING (
  organization_id = (
    SELECT coalesce(
      current_setting('request.jwt.claims', true)::json->>'org_id',
      current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
  )
);
```

## 🧪 Testing the Integration

1. Add the `SupabaseExample` component to any page
2. Sign in with Clerk
3. Try the "Fetch Data" and "Insert Data" buttons
4. Check your Supabase logs for authentication events

## 📚 Additional Resources

- [Supabase Clerk Integration Docs](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Clerk Backend Requests](https://clerk.com/docs/backend-requests/resources/session-tokens)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

## ⚠️ Important Notes

- **Deprecated Integration**: The old JWT template integration is deprecated as of April 1, 2025. Use the new third-party auth integration instead.
- **Pricing**: Third-party MAU pricing applies (0.00325 per user exceeding your plan's quota)
- **Security**: Never share your Supabase JWT secret with third parties
- **Development**: For local development, add Clerk config to your `supabase/config.toml`

```toml
[auth.third_party.clerk]
enabled = true
domain = "your-app.clerk.accounts.dev"
```
