"use client"

import { useState, useEffect } from "react"
import { FileText, ExternalLink, Download, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatasheetViewerModal } from "@/components/ui/datasheet-viewer"
import { getProjectPartCategories, ProjectPartCategoryRecord, ProjectPartSuggestionRecord } from "@/lib/actions/projects"

interface DatasheetCardProps {
  part: ProjectPartSuggestionRecord
  projectId: string
  categoryId: string
  onRefresh: () => void
}

function DatasheetCard({ part, projectId, categoryId, onRefresh }: DatasheetCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleFetchDatasheet = async () => {
    // If no MPN, try using the part name as search query
    const searchQuery = part.mpn || part.title

    if (!searchQuery) {
      alert("Cannot search for datasheet without part name or MPN. Please add one manually.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/datasheets/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          categoryId,
          suggestionId: part.id,
          mpn: searchQuery, // Use title as fallback
          manufacturer: part.manufacturer
        })
      })

      const data = await response.json()

      if (data.success && data.datasheetUrl) {
        onRefresh()
        alert('✓ Datasheet found!')
      } else if (data.source === 'fallback') {
        alert('No datasheet found automatically. You can add one manually using the "Add URL" button.')
      } else {
        alert(data.error || 'Failed to fetch datasheet. Try adding the URL manually.')
      }
    } catch (error) {
      console.error('Error fetching datasheet:', error)
      alert('Failed to fetch datasheet. Try adding the URL manually.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddManualUrl = async () => {
    const url = prompt('Enter the datasheet URL:')
    if (!url) return

    try {
      const response = await fetch('/api/datasheets/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          categoryId,
          suggestionId: part.id,
          datasheetUrl: url
        })
      })

      const data = await response.json()

      if (data.success) {
        onRefresh()
      } else {
        alert(data.error || 'Failed to add datasheet URL')
      }
    } catch (error) {
      console.error('Error adding manual datasheet:', error)
      alert('Failed to add datasheet URL')
    }
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{part.title}</h3>
          {part.manufacturer && (
            <p className="text-xs text-muted-foreground mt-0.5">{part.manufacturer}</p>
          )}
          {part.mpn && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">MPN: {part.mpn}</p>
          )}
        </div>
        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {part.datasheetUrl ? (
          <>
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs flex-1"
              onClick={() => setViewerOpen(true)}
            >
              <FileText className="h-3 w-3 mr-1.5" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              asChild
            >
              <a href={part.datasheetUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1.5" />
                Open
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              asChild
            >
              <a href={part.datasheetUrl} download>
                <Download className="h-3 w-3 mr-1.5" />
                Download
              </a>
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs flex-1"
              onClick={handleFetchDatasheet}
              disabled={isLoading}
              title={part.mpn ? `Search for ${part.mpn}` : `Search for ${part.title}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 mr-1.5" />
                  Get Datasheet
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleAddManualUrl}
            >
              <Plus className="h-3 w-3 mr-1.5" />
              Add URL
            </Button>
          </>
        )}
      </div>

      {part.datasheetSource && (
        <p className="text-xs text-muted-foreground mt-2">
          Source: {part.datasheetSource}
        </p>
      )}

      {part.datasheetUrl && (
        <DatasheetViewerModal
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          datasheetUrl={part.datasheetUrl}
          partName={part.title}
        />
      )}
    </div>
  )
}

interface AppNoteItemProps {
  title: string
  url: string
  type?: string
  source?: string
}

function AppNoteItem({ title, url, type, source }: AppNoteItemProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <div className="flex gap-2 mt-0.5">
          {type && <span className="text-xs text-muted-foreground">{type}</span>}
          {source && <span className="text-xs text-muted-foreground">• {source}</span>}
        </div>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </a>
  )
}

interface TutorialItemProps {
  title: string
  url: string
  source: string
}

function TutorialItem({ title, url, source }: TutorialItemProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{source}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </a>
  )
}

export function ProjectDocumentationTab({ projectId }: { projectId: string }) {
  const [categories, setCategories] = useState<ProjectPartCategoryRecord[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadCategories = async () => {
    try {
      const result = await getProjectPartCategories(projectId)
      if (result.success) {
        setCategories(result.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [projectId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="font-medium text-lg mb-1">No parts yet</h3>
        <p className="text-sm text-muted-foreground">
          Add parts to your project to access datasheets and documentation
        </p>
      </div>
    )
  }

  // Collect all parts with datasheets or that can have datasheets
  const partsWithDatasheets = categories.flatMap(category =>
    category.suggestions.map(suggestion => ({
      part: suggestion,
      categoryId: category.id
    }))
  )

  // Collect all app notes from parts
  const allAppNotes = categories.flatMap(category =>
    category.suggestions.flatMap(suggestion =>
      suggestion.appNotes || []
    )
  )

  // Collect all tutorials from parts
  const allTutorials = categories.flatMap(category =>
    category.suggestions.flatMap(suggestion =>
      suggestion.tutorials || []
    )
  )

  return (
    <div className="space-y-8">
      {/* Datasheets Section */}
      <div>
        <h2 className="text-2xl font-editorial-new font-light mb-4">Datasheets</h2>
        {partsWithDatasheets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No parts available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partsWithDatasheets.map(({ part, categoryId }) => (
              <DatasheetCard
                key={part.id}
                part={part}
                projectId={projectId}
                categoryId={categoryId}
                onRefresh={loadCategories}
              />
            ))}
          </div>
        )}
      </div>

      {/* Application Notes Section */}
      {allAppNotes.length > 0 && (
        <div>
          <h2 className="text-2xl font-editorial-new font-light mb-4">Application Notes</h2>
          <div className="space-y-2">
            {allAppNotes.map((note, index) => (
              <AppNoteItem
                key={index}
                title={note.title}
                url={note.url}
                type={note.type}
                source={note.source}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tutorials Section */}
      {allTutorials.length > 0 && (
        <div>
          <h2 className="text-2xl font-editorial-new font-light mb-4">Tutorials & Guides</h2>
          <div className="space-y-2">
            {allTutorials.map((tutorial, index) => (
              <TutorialItem
                key={index}
                title={tutorial.title}
                url={tutorial.url}
                source={tutorial.source}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
