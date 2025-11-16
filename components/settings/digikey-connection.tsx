/**
 * DigiKey Connection Card
 * 
 * Allows users to connect their DigiKey account for real-time pricing and stock data
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react'

interface DigiKeyConnectionProps {
  isConnected?: boolean
  connectedAt?: number
}

export function DigiKeyConnection({ isConnected = false, connectedAt }: DigiKeyConnectionProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    // Redirect to DigiKey OAuth flow
    window.location.href = '/api/auth/digikey/authorize'
  }

  const handleDisconnect = async () => {
    // TODO: Implement disconnect logic
    console.log('Disconnect DigiKey')
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl">
              DK
            </div>
            <div>
              <h3 className="font-semibold text-lg">DigiKey Integration</h3>
              {isConnected && connectedAt && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Connected {new Date(connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your DigiKey account to access:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Real-time pricing and stock information
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Product images and datasheets
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Millions of components catalog
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                100% free with unlimited API calls
              </li>
            </ul>

            <div className="pt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ExternalLink className="h-3.5 w-3.5" />
              <a 
                href="https://developer.digikey.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline"
              >
                Learn more about DigiKey API
              </a>
            </div>
          </div>
        </div>

        <div className="ml-4">
          {isConnected ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                <CheckCircle className="h-5 w-5" />
                Connected
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect DigiKey'
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
