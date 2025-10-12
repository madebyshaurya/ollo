'use client'

import { useSupabase } from '@/lib/hooks/use-supabase'
import { useEffect, useState } from 'react'

export function SupabaseExample() {
    const { supabase, isAuthenticated } = useSupabase()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Example function to fetch data from Supabase
    const fetchData = async () => {
        if (!isAuthenticated) {
            setError('Please sign in to access data')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Example: Fetch from a table called 'user_profiles'
            // Replace with your actual table name
            const { data: result, error } = await supabase
                .from('user_profiles')
                .select('*')
                .limit(10)

            if (error) {
                throw error
            }

            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Supabase error:', err)
        } finally {
            setLoading(false)
        }
    }

    // Example function to insert data
    const insertData = async () => {
        if (!isAuthenticated) {
            setError('Please sign in to insert data')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data: result, error } = await supabase
                .from('user_profiles')
                .insert([
                    {
                        // Example fields - replace with your actual table schema
                        created_at: new Date().toISOString(),
                    }
                ])
                .select()

            if (error) {
                throw error
            }

            console.log('Inserted data:', result)
            // Refresh the data
            await fetchData()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Supabase insert error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Supabase + Clerk Integration</h2>

            <div className="mb-4">
                <p className="text-sm text-gray-600">
                    Authentication Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
                </p>
            </div>

            <div className="space-x-4 mb-6">
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Fetch Data'}
                </button>

                <button
                    onClick={insertData}
                    disabled={loading || !isAuthenticated}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                    Insert Data
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error: {error}
                </div>
            )}

            {data && (
                <div className="bg-gray-100 p-4 rounded">
                    <h3 className="font-semibold mb-2">Data from Supabase:</h3>
                    <pre className="text-sm overflow-auto">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
