"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { nanoid } from "nanoid"
import {
  Loader2,
  RefreshCcw,
  Edit2,
  Save,
  X,
  Plus,
  Check,
  ShoppingBag,
  Undo2,
  Trash2,
} from "lucide-react"

import type { ProjectPartCategoryRecord } from "@/lib/actions/projects"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProjectPartsWorkspaceProps {
  projectId: string
  projectType: "breadboard" | "pcb" | "custom"
  currency: string
}

type CategoryDraft = ProjectPartCategoryRecord & { isNew?: boolean }

export function ProjectPartsWorkspace({ projectId, projectType, currency }: ProjectPartsWorkspaceProps) {
  const [categories, setCategories] = useState<CategoryDraft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  useEffect(() => {
    void loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function loadCategories() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/parts/categories`)
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Failed to load categories")
      }
      const payload = (await response.json()) as { categories: ProjectPartCategoryRecord[] }
      if (!payload.categories || payload.categories.length === 0) {
        await regenerateCategories()
        return
      }
      setCategories(hydrateCategories(payload.categories))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load categories")
    } finally {
      setIsLoading(false)
    }
  }

  async function regenerateCategories() {
    setIsGenerating(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/parts/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Unable to generate categories")
      }

      const payload = (await response.json()) as { categories: ProjectPartCategoryRecord[] }
      setCategories(hydrateCategories(payload.categories))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate categories")
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
    }
  }
  const persistCategories = async (nextCategories: ProjectPartCategoryRecord[]) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/parts/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: nextCategories }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Unable to save categories")
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save categories")
      return false
    }
  }

  const commitCategories = (updater: (prev: CategoryDraft[]) => CategoryDraft[]) => {
    startSaving(async () => {
      const next = updater(categories)
      setCategories(next)
      const success = await persistCategories(stripDraft(next))
      if (!success) {
        await loadCategories()
      }
    })
  }

  const startEditing = (categoryId: string) => setEditingCategory(categoryId)

  const cancelEditing = (categoryId: string) => {
    if (categories.find((category) => category.id === categoryId)?.isNew) {
      setCategories((prev) => prev.filter((category) => category.id !== categoryId))
    }
    setEditingCategory(null)
  }

  const saveCategoryDetails = (categoryId: string, updates: Partial<ProjectPartCategoryRecord>) => {
    commitCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              ...updates,
              aiGenerated: updates.aiGenerated ?? category.aiGenerated,
              updatedAt: new Date().toISOString(),
              isNew: false,
            }
          : category
      )
    )
    setEditingCategory(null)
  }

  const addCategory = () => {
    const now = new Date().toISOString()
    const newCategory: CategoryDraft = {
      id: nanoid(),
      name: "Untitled category",
      description: "",
      aiGenerated: false,
      searchTerms: [],
      suggestions: [],
      userItems: [],
      createdAt: now,
      updatedAt: now,
      isNew: true,
    }
    setCategories((prev) => [...prev, newCategory])
    setEditingCategory(newCategory.id)
  }

  const acceptSuggestion = (categoryId: string, suggestionId: string) => {
    commitCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              suggestions: category.suggestions.map((suggestion) =>
                suggestion.id === suggestionId
                  ? { ...suggestion, status: "accepted", owned: false }
                  : suggestion
              ),
              updatedAt: new Date().toISOString(),
            }
          : category
      )
    )
  }

  const skipSuggestion = (categoryId: string, suggestionId: string) => {
    commitCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              suggestions: category.suggestions.map((suggestion) =>
                suggestion.id === suggestionId
                  ? { ...suggestion, status: "dismissed" }
                  : suggestion
              ),
              updatedAt: new Date().toISOString(),
            }
          : category
      )
    )
  }

  const restoreSuggestion = (categoryId: string, suggestionId: string) => {
    commitCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              suggestions: category.suggestions.map((suggestion) =>
                suggestion.id === suggestionId
                  ? { ...suggestion, status: "pending" }
                  : suggestion
              ),
              updatedAt: new Date().toISOString(),
            }
          : category
      )
    )
  }

  const toggleOwned = (categoryId: string, suggestionId: string) => {
    commitCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              suggestions: category.suggestions.map((suggestion) =>
                suggestion.id === suggestionId
                  ? { ...suggestion, owned: !suggestion.owned }
                  : suggestion
              ),
              updatedAt: new Date().toISOString(),
            }
          : category
      )
    )
  }

  const addCustomItem = (categoryId: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    commitCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              userItems: [
                ...category.userItems,
                { id: nanoid(), title: trimmed, done: false, createdAt: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            }
          : category
      )
    )
  }

  const toggleCustomItem = (categoryId: string, itemId: string) => {
    commitCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              userItems: category.userItems.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
              updatedAt: new Date().toISOString(),
            }
          : category
      )
    )
  }

  const removeCustomItem = (categoryId: string, itemId: string) => {
    commitCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              userItems: category.userItems.filter((item) => item.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          : category
      )
    )
  }

  const ownedStats = useMemo(() => {
    return categories.map((category) => {
      const accepted = category.suggestions.filter((suggestion) => suggestion.status === "accepted")
      const doneAccepted = accepted.filter((suggestion) => suggestion.owned).length
      const doneCustom = category.userItems.filter((item) => item.done).length
      const total = accepted.length + category.userItems.length
      return { id: category.id, done: doneAccepted + doneCustom, total }
    })
  }, [categories])

  const isBusy = isGenerating || isSaving

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-editorial-new font-light text-foreground sm:text-3xl">
            Parts workspace
          </h2>
          <p className="text-sm text-muted-foreground">
            Track what you already have and curate supplier picks for your {projectType} build.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg px-3 text-sm"
            onClick={addCategory}
            disabled={isBusy}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add category
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg px-3 text-sm"
            onClick={regenerateCategories}
            disabled={isBusy}
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Regenerate base outline
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[160px] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading parts workspace…
        </div>
      ) : categories.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          <p>No categories yet. Click regenerate to let ollo propose a starting point.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const stats = ownedStats.find((entry) => entry.id === category.id)
            const isEditing = editingCategory === category.id
            return (
              <article
                key={category.id}
                className="rounded-2xl border border-border/70 bg-card/80 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-6"
              >
                <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    {isEditing ? (
                      <CategoryEditForm
                        category={category}
                        onCancel={() => cancelEditing(category.id)}
                        onSave={(updates) => saveCategoryDetails(category.id, updates)}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground sm:text-xl">{category.name}</h3>
                          {!category.aiGenerated && (
                            <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {category.description || "Add details to describe what you’re sourcing here."}
                        </p>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {stats && stats.total > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-1 font-semibold text-foreground">
                          <Check className="h-3 w-3" /> {stats.done}/{stats.total} done
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => startEditing(category.id)}
                      >
                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  )}
                </header>

                <CategorySuggestions
                  category={category}
                  isBusy={isBusy}
                  onAccept={acceptSuggestion}
                  onSkip={skipSuggestion}
                  onRestore={restoreSuggestion}
                  onToggleOwned={toggleOwned}
                />

                <CategoryChecklist
                  category={category}
                  isBusy={isBusy}
                  onAddItem={addCustomItem}
                  onToggleItem={toggleCustomItem}
                  onRemoveItem={removeCustomItem}
                  onToggleOwned={toggleOwned}
                />
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function CategoryEditForm({
  category,
  onCancel,
  onSave,
}: {
  category: CategoryDraft
  onCancel: () => void
  onSave: (updates: Partial<ProjectPartCategoryRecord>) => void
}) {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description)
  const [searchTerms, setSearchTerms] = useState(category.searchTerms.join(", "))

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          name: name.trim() || "Untitled category",
          description: description.trim(),
          searchTerms: searchTerms
            .split(",")
            .map((term) => term.trim())
            .filter(Boolean),
        })
      }}
    >
      <input
        className="rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold text-foreground focus:border-ring"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <textarea
        className="min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="What will this category cover (e.g., purpose, specs, placement)?"
      />
      <input
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring"
        value={searchTerms}
        onChange={(event) => setSearchTerms(event.target.value)}
        placeholder="Search terms (comma separated)"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-8 rounded-lg px-3 text-sm">
          <Save className="mr-2 h-3.5 w-3.5" /> Save
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-3 text-sm" onClick={onCancel}>
          <X className="mr-2 h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </form>
  )
}

function CategorySuggestions({
  category,
  isBusy,
  onAccept,
  onSkip,
  onRestore,
  onToggleOwned,
}: {
  category: CategoryDraft
  isBusy: boolean
  onAccept: (categoryId: string, suggestionId: string) => void
  onSkip: (categoryId: string, suggestionId: string) => void
  onRestore: (categoryId: string, suggestionId: string) => void
  onToggleOwned: (categoryId: string, suggestionId: string) => void
}) {
  const pending = category.suggestions.filter((suggestion) => suggestion.status === "pending")
  const accepted = category.suggestions.filter((suggestion) => suggestion.status === "accepted")
  const dismissed = category.suggestions.filter((suggestion) => suggestion.status === "dismissed")

  return (
    <div className="mt-4 space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Suggested parts
          </p>
          <ul className="space-y-3">
            {pending.map((suggestion) => (
              <li key={suggestion.id} className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
                <SuggestionPreview suggestion={suggestion} />
                <div className="flex flex-col gap-2 text-xs">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg px-3 text-xs"
                    onClick={() => onAccept(category.id, suggestion.id)}
                    disabled={isBusy}
                  >
                    <Check className="mr-2 h-3.5 w-3.5" /> Add to checklist
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => onSkip(category.id, suggestion.id)}
                    disabled={isBusy}
                  >
                    <X className="mr-2 h-3.5 w-3.5" /> Skip
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dismissed.length > 0 && (
        <details className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Skipped suggestions</summary>
          <ul className="mt-2 space-y-2">
            {dismissed.map((suggestion) => (
              <li key={suggestion.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
                <span className="line-clamp-1">{suggestion.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => onRestore(category.id, suggestion.id)}
                  disabled={isBusy}
                >
                  <Undo2 className="mr-2 h-3.5 w-3.5" /> Restore
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {accepted.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Accepted suggestions
          </p>
          <ul className="mt-2 space-y-2">
            {accepted.map((suggestion) => (
              <li
                key={suggestion.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-3",
                  suggestion.owned
                    ? "border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-border/60 bg-muted/30"
                )}
              >
                <SuggestionPreview suggestion={suggestion} />
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs",
                    suggestion.owned
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      : "border-border/60 bg-background/80"
                  )}
                  onClick={() => onToggleOwned(category.id, suggestion.id)}
                  disabled={isBusy}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {suggestion.owned ? "Marked done" : "Mark acquired"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CategoryChecklist({
  category,
  isBusy,
  onAddItem,
  onToggleItem,
  onRemoveItem,
  onToggleOwned,
}: {
  category: CategoryDraft
  isBusy: boolean
  onAddItem: (categoryId: string, title: string) => void
  onToggleItem: (categoryId: string, itemId: string) => void
  onRemoveItem: (categoryId: string, itemId: string) => void
  onToggleOwned: (categoryId: string, suggestionId: string) => void
}) {
  const [draft, setDraft] = useState("")

  const accepted = category.suggestions.filter((suggestion) => suggestion.status === "accepted")
  const customItems = category.userItems

  return (
    <div className="mt-5 space-y-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        My checklist
      </p>

      {accepted.length === 0 && customItems.length === 0 ? (
        <p className="text-xs text-muted-foreground">Accept a suggested part or add your own tasks.</p>
      ) : (
        <ul className="space-y-2">
          {accepted.map((suggestion) => (
            <li key={suggestion.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm">
              <label className="flex flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-emerald-500"
                  checked={suggestion.owned}
                  onChange={() => onToggleOwned(category.id, suggestion.id)}
                  disabled={isBusy}
                />
                <span className="line-clamp-1 text-foreground">{suggestion.title}</span>
              </label>
              <span className="text-[11px] text-muted-foreground">{suggestion.supplier}</span>
            </li>
          ))}
          {customItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm">
              <label className="flex flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-emerald-500"
                  checked={item.done}
                  onChange={() => onToggleItem(category.id, item.id)}
                  disabled={isBusy}
                />
                <span className={cn("line-clamp-1", item.done && "text-muted-foreground line-through")}>{item.title}</span>
              </label>
              <button
                type="button"
                className="rounded-full border border-border/60 p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemoveItem(category.id, item.id)}
                disabled={isBusy}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          onAddItem(category.id, draft)
          setDraft("")
        }}
      >
        <input
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add item to checklist"
          disabled={isBusy}
        />
        <Button type="submit" size="sm" className="h-8 rounded-lg px-3 text-sm" disabled={isBusy}>
          <Plus className="mr-2 h-3.5 w-3.5" /> Add
        </Button>
      </form>
    </div>
  )
}

function SuggestionPreview({ suggestion }: { suggestion: ProjectPartCategoryRecord["suggestions"][number] }) {
  return (
    <div className="flex flex-1 items-start gap-3">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border/60 bg-background">
        {suggestion.image ? (
          <Image
            src={suggestion.image}
            alt={suggestion.title}
            fill
            sizes="64px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <a
          href={suggestion.supplierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 text-sm font-semibold text-foreground hover:underline"
        >
          {suggestion.title}
        </a>
        <p className="text-xs text-muted-foreground">
          {suggestion.supplier}
          {suggestion.price != null && suggestion.currency ? (
            <span className="ml-1 font-medium text-foreground">
              · {suggestion.price.toFixed(2)} {suggestion.currency}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  )
}

function stripDraft(categories: CategoryDraft[]): ProjectPartCategoryRecord[] {
  return categories.map((category) => {
    const { isNew: _unused, ...rest } = category
    void _unused
    return rest
  })
}

function hydrateCategories(raw: ProjectPartCategoryRecord[]): CategoryDraft[] {
  return raw.map((category) => ({
    ...category,
    suggestions: category.suggestions.map((suggestion) => ({
      ...suggestion,
      owned: suggestion.owned ?? false,
      status: suggestion.status ?? "pending",
    })),
    userItems: category.userItems?.map((item) => ({
      ...item,
      done: item.done ?? false,
      createdAt: item.createdAt ?? new Date().toISOString(),
    })) ?? [],
  }))
}
