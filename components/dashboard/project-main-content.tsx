

export function ProjectMainContent({ projectId }: { projectId: string }) {
    return (
        <div className="flex-1 space-y-6">
            <div className="rounded-lg border bg-card p-6">
                <h2 className="text-2xl font-semibold mb-4">Project Content</h2>
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Main content section for project: {projectId}
                    </p>
                </div>
            </div>
        </div>
    );
}
