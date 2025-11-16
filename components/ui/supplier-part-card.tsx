/**
 * Supplier Part Card Component
 * 
 * Displays electronic component with:
 * - Product image with fallback
 * - Real pricing and stock information
 * - Supplier links and details
 * - Amazon-quality UI with smooth interactions
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ExternalLink, Package, CheckCircle, AlertCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SupplierPart } from '@/lib/integrations/digikey'

interface SupplierPartCardProps {
  part: SupplierPart
  onSelect?: (part: SupplierPart) => void
  selected?: boolean
}

export function SupplierPartCard({ part, onSelect, selected }: SupplierPartCardProps) {
  const [imageError, setImageError] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Collect all available images
  const allImages = [
    part.imageUrl,
    part.thumbnailUrl,
    ...part.additionalImages
  ].filter(Boolean) as string[]

  const currentImage = allImages[currentImageIndex]
  const hasMultipleImages = allImages.length > 1

  // Stock status styling
  const stockConfig = {
    in_stock: {
      icon: CheckCircle,
      label: 'In Stock',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
    },
    low_stock: {
      icon: AlertCircle,
      label: 'Low Stock',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
    },
    out_of_stock: {
      icon: XCircle,
      label: 'Out of Stock',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    }
  }

  const stockInfo = stockConfig[part.stock.status]
  const StockIcon = stockInfo.icon

  // Format price
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
        selected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      onClick={() => onSelect?.(part)}
    >
      {/* Image Section */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {currentImage && !imageError ? (
          <>
            <Image
              src={currentImage}
              alt={part.name}
              fill
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Image Navigation */}
            {hasMultipleImages && (
              <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-black/90 dark:hover:bg-black"
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm dark:bg-black/90">
                  {currentImageIndex + 1} / {allImages.length}
                </span>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-black/90 dark:hover:bg-black"
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-16 w-16 text-gray-300 dark:text-gray-700" />
          </div>
        )}

        {/* Stock Badge - Top Right */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${stockInfo.bgColor} backdrop-blur-sm`}>
          <StockIcon className={`h-3.5 w-3.5 ${stockInfo.color}`} />
          <span className={`text-xs font-semibold ${stockInfo.color}`}>
            {stockInfo.label}
          </span>
        </div>

        {/* Type Badge - Top Left */}
        <Badge 
          variant="secondary"
          className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm dark:bg-black/90"
        >
          {part.type}
        </Badge>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Part Name */}
        <div>
          <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {part.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {part.manufacturer} • {part.supplierPartNumber}
          </p>
        </div>

        {/* Description */}
        {part.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {part.description}
          </p>
        )}

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          <span className="text-2xl font-bold tracking-tight">
            {formatPrice(part.pricing.unitPrice, part.pricing.currency)}
          </span>
          {part.stock.available > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {part.stock.available}+ available
            </span>
          )}
        </div>

        {/* Quantity Pricing */}
        {part.pricing.quantityPricing && part.pricing.quantityPricing.length > 1 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
            <div className="font-medium mb-1">Volume Pricing:</div>
            <div className="grid grid-cols-3 gap-1">
              {part.pricing.quantityPricing.slice(0, 3).map((tier, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatPrice(tier.price, part.pricing.currency)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    @ {tier.quantity}+
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {part.productUrl && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                window.open(part.productUrl, '_blank')
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View on {part.supplier}
            </Button>
          )}
          
          {part.datasheetUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                window.open(part.datasheetUrl, '_blank')
              }}
            >
              Datasheet
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// Grid container component
export function SupplierPartsGrid({ 
  parts, 
  onSelectPart,
  selectedParts = []
}: { 
  parts: SupplierPart[]
  onSelectPart?: (part: SupplierPart) => void
  selectedParts?: SupplierPart[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {parts.map((part, idx) => (
        <SupplierPartCard
          key={`${part.supplierPartNumber}-${idx}`}
          part={part}
          onSelect={onSelectPart}
          selected={selectedParts.some(p => p.supplierPartNumber === part.supplierPartNumber)}
        />
      ))}
    </div>
  )
}
