"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DatasheetViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasheetUrl: string
  partName: string
}

export function DatasheetViewerModal({
  open,
  onOpenChange,
  datasheetUrl,
  partName
}: DatasheetViewerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-medium">
            {partName} - Datasheet
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={datasheetUrl}
            className="w-full h-full"
            title={`${partName} Datasheet`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
