export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)
    const diffInYears = Math.floor(diffInDays / 365)

    if (diffInMinutes < 1) {
        return "just now"
    }

    if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`
    }

    if (diffInHours < 24) {
        return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`
    }

    if (diffInDays < 7) {
        return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`
    }

    if (diffInWeeks < 4) {
        return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`
    }

    if (diffInMonths < 12) {
        return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`
    }

    if (diffInYears >= 1) {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    })
}