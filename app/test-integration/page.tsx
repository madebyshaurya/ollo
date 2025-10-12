import { UserProfileTest } from '@/components/user-profile-test'

export default function TestIntegrationPage() {
    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-center mb-8">
                    🔗 Clerk + Supabase Integration Test
                </h1>

                <UserProfileTest />

                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                        📋 How to Test:
                    </h3>
                    <ol className="text-blue-700 space-y-2">
                        <li>1. Make sure you're signed in to your Clerk account</li>
                        <li>2. Click "Test Auth" to verify Supabase connection works</li>
                        <li>3. Click "Create/Update Profile" to save your user data to Supabase</li>
                        <li>4. Click "Fetch Profile" to retrieve your data from the database</li>
                        <li>5. Check your Supabase dashboard to see the data in the user_profiles table</li>
                    </ol>
                </div>

                <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                        ⚠️ Important Note:
                    </h3>
                    <p className="text-yellow-700">
                        Clerk doesn't automatically create database records. You need to manually
                        create user profiles using the "Create/Update Profile" button above, or
                        set up Clerk webhooks to automatically create profiles on signup.
                    </p>
                </div>
            </div>
        </div>
    )
}
