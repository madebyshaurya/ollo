'use client'

import { useSupabase } from '@/lib/hooks/use-supabase'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface UserProfile {
  id: string
  clerk_user_id: string
  email?: string
  first_name?: string
  last_name?: string
  created_at: string
  updated_at: string
}

export function UserProfileTest() {
  const { getAuthenticatedSupabase, isAuthenticated } = useSupabase()
    const { user } = useUser()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    // Function to create/update user profile
    const createUserProfile = async () => {
        if (!isAuthenticated || !user) {
            setError('Please sign in to create profile')
            return
        }

        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            // Get authenticated supabase client
            const authSupabase = await getAuthenticatedSupabase()

            // First, try to insert a new profile
            const { data: insertData, error: insertError } = await authSupabase
                .from('user_profiles')
                .insert([
                    {
                        clerk_user_id: user.id,
                        email: user.primaryEmailAddress?.emailAddress,
                        first_name: user.firstName,
                        last_name: user.lastName,
                    }
                ])
                .select()

            if (insertError) {
                // If insert fails due to duplicate, try to update instead
                if (insertError.code === '23505') { // Unique constraint violation
                    const { data: updateData, error: updateError } = await authSupabase
                        .from('user_profiles')
                        .update({
                            email: user.primaryEmailAddress?.emailAddress,
                            first_name: user.firstName,
                            last_name: user.lastName,
                            updated_at: new Date().toISOString()
                        })
                        .eq('clerk_user_id', user.id)
                        .select()

                    if (updateError) {
                        throw updateError
                    }

                    setProfile(updateData[0])
                    setMessage('✅ Profile updated successfully!')
                } else {
                    throw insertError
                }
            } else {
                setProfile(insertData[0])
                setMessage('✅ Profile created successfully!')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Profile creation error:', err)
        } finally {
            setLoading(false)
        }
    }

    // Function to fetch user profile
    const fetchUserProfile = async () => {
        if (!isAuthenticated || !user) {
            setError('Please sign in to fetch profile')
            return
        }

        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            // Get authenticated supabase client
            const authSupabase = await getAuthenticatedSupabase()

            const { data, error } = await authSupabase
                .from('user_profiles')
                .select('*')
                .eq('clerk_user_id', user.id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    setMessage('No profile found. Create one below!')
                } else {
                    throw error
                }
            } else {
                setProfile(data)
                setMessage('✅ Profile fetched successfully!')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Profile fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    // Function to test authentication
    const testAuth = async () => {
        if (!isAuthenticated) {
            setError('Please sign in to test authentication')
            return
        }

        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            console.log('🔍 Testing Supabase connection...')
            console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
            console.log('User ID:', user?.id)

            // Get authenticated supabase client
            const authSupabase = await getAuthenticatedSupabase()

            // Simple test query to verify authentication works
            const { data, error } = await authSupabase
                .from('user_profiles')
                .select('*')
                .limit(1)

            console.log('Supabase response:', { data, error })

            if (error) {
                console.error('Supabase error details:', error)
                throw error
            }

            setMessage('✅ Authentication test successful! Supabase connection working.')
        } catch (err) {
            console.error('Auth test error:', err)
            setError(`Authentication test failed: ${err instanceof Error ? err.message : JSON.stringify(err)}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">🔗 Clerk + Supabase Integration Test</h2>

            <div className="mb-6 space-y-2">
                <p className="text-sm">
                    <strong>Authentication Status:</strong>
                    <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                        {isAuthenticated ? ' ✅ Authenticated' : ' ❌ Not Authenticated'}
                    </span>
                </p>

                {user && (
                    <div className="text-sm space-y-1">
                        <p><strong>User ID:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                        <p><strong>Name:</strong> {user.fullName}</p>
                    </div>
                )}
            </div>

            <div className="space-x-4 mb-6">
                <button
                    onClick={testAuth}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Testing...' : 'Test Auth'}
                </button>

                <button
                    onClick={fetchUserProfile}
                    disabled={loading || !isAuthenticated}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                >
                    Fetch Profile
                </button>

                <button
                    onClick={createUserProfile}
                    disabled={loading || !isAuthenticated}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                    Create/Update Profile
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {message && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {message}
                </div>
            )}

            {profile && (
                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">👤 User Profile Data:</h3>
                    <pre className="text-sm overflow-auto bg-white p-2 rounded border">
                        {JSON.stringify(profile, null, 2)}
                    </pre>
                </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">📋 Setup Checklist:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>✅ Environment variables configured</li>
                    <li>❓ Clerk configured for Supabase compatibility</li>
                    <li>❓ Supabase Third-Party Auth with Clerk added</li>
                    <li>❓ Database tables created (user_profiles)</li>
                    <li>❓ RLS policies configured</li>
                </ul>
            </div>
        </div>
    )
}
