"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TextureButton } from "@/components/ui/texture-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import Image from "next/image"
import { createProject } from "@/lib/actions/projects"
import { useRouter } from "next/navigation"

interface ProjectCreationModalProps {
    children: React.ReactNode
}

type ProjectType = "breadboard" | "pcb" | "custom"

export function ProjectCreationModal({ children }: ProjectCreationModalProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [projectType, setProjectType] = React.useState<ProjectType | null>(null)
    const [projectName, setProjectName] = React.useState("")
    const [projectDescription, setProjectDescription] = React.useState("")

    // Additional project details
    const [microcontroller, setMicrocontroller] = React.useState("")
    const [microcontrollerOther, setMicrocontrollerOther] = React.useState("")
    const [complexity, setComplexity] = React.useState(50) // Slider value 1-100
    const [budget, setBudget] = React.useState(50) // Slider value 1-100
    const [purpose, setPurpose] = React.useState("")
    const [targetAudience, setTargetAudience] = React.useState("")
    const [timeline, setTimeline] = React.useState("")
    const [customDescription, setCustomDescription] = React.useState("")

    // Dynamic placeholders based on project type
    const getProjectNamePlaceholder = () => {
        if (projectType === "breadboard") {
            return "e.g., Arduino Weather Station, Pico LED Controller"
        } else if (projectType === "pcb") {
            return "e.g., Custom Keyboard PCB, IoT Sensor Board"
        } else if (projectType === "custom") {
            return "e.g., Wearable Device, Audio Project, Custom Circuit"
        }
        return "e.g., Macro Pad, Smart Sensor"
    }

    const getDescriptionPlaceholder = () => {
        if (projectType === "breadboard") {
            return "What do you want to build on the breadboard?"
        } else if (projectType === "pcb") {
            return "Describe your PCB design goals..."
        } else if (projectType === "custom") {
            return "Tell us about your custom hardware project..."
        }
        return "Describe your project..."
    }

    const handleCreateProject = async () => {
        if (!projectType || !projectName.trim() || !projectDescription.trim()) {
            return
        }

        try {
            const result = await createProject({
                name: projectName,
                description: projectDescription,
                type: projectType,
                microcontroller: microcontroller === "Other" ? undefined : microcontroller,
                microcontrollerOther: microcontroller === "Other" ? microcontrollerOther : undefined,
                complexity,
                budget,
                purpose,
                targetAudience,
                timeline,
                customDescription
            })

            if (result.success) {
                setOpen(false)
                // Navigate to the new project's dashboard page
                if (result.project?.id) {
                    router.push(`/dashboard/${result.project.id}`)
                }
                // Reset form
                setProjectType(null)
                setProjectName("")
                setProjectDescription("")
                setMicrocontroller("")
                setMicrocontrollerOther("")
                setComplexity(50)
                setBudget(50)
                setPurpose("")
                setTargetAudience("")
                setTimeline("")
                setCustomDescription("")
            } else {
                console.error("Failed to create project:", result.error)
                // TODO: Show error message to user
            }
        } catch (error) {
            console.error("Error creating project:", error)
            // TODO: Show error message to user
        }
    }

    const isFormValid = projectType && projectName.trim() && projectDescription.trim()

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-editorial-new font-light text-foreground">
                        Create New Project
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Project Type Selection */}
                    <div className="space-y-3">
                        <Label className="text-foreground font-inter text-sm font-medium">
                            Choose Project Type
                        </Label>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Breadboard */}
                            <Card
                                className={cn(
                                    "cursor-pointer transition-all duration-200 border-border bg-card hover:bg-accent",
                                    projectType === "breadboard" && "ring-2 ring-ring bg-accent"
                                )}
                                onClick={() => setProjectType("breadboard")}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-24 h-24 flex items-center justify-center">
                                            <Image
                                                src="/illustrations/breadboard.png"
                                                alt="Breadboard illustration"
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <CardTitle className="text-card-foreground font-inter text-sm">
                                                Breadboard
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground text-xs">
                                                Prototyping
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* PCB Design */}
                            <Card
                                className={cn(
                                    "cursor-pointer transition-all duration-200 border-border bg-card hover:bg-accent",
                                    projectType === "pcb" && "ring-2 ring-ring bg-accent"
                                )}
                                onClick={() => setProjectType("pcb")}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-24 h-24 flex items-center justify-center">
                                            <Image
                                                src="/illustrations/pcb.png"
                                                alt="PCB illustration"
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <CardTitle className="text-card-foreground font-inter text-sm">
                                                PCB Design
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground text-xs">
                                                Production
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Custom */}
                            <Card
                                className={cn(
                                    "cursor-pointer transition-all duration-200 border-border bg-card hover:bg-accent",
                                    projectType === "custom" && "ring-2 ring-ring bg-accent"
                                )}
                                onClick={() => setProjectType("custom")}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-24 h-24 flex items-center justify-center">
                                            <Image
                                                src="/illustrations/custom.png"
                                                alt="Custom electronics illustration"
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <CardTitle className="text-card-foreground font-inter text-sm">
                                                Custom
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground text-xs">
                                                Other
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>

                    {/* Project Details */}
                    {projectType && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="project-name" className="text-foreground font-inter text-sm font-medium">
                                    Project Name
                                </Label>
                                <Input
                                    id="project-name"
                                    placeholder={getProjectNamePlaceholder()}
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="project-description" className="text-foreground font-inter text-sm font-medium">
                                    What are you building?
                                </Label>
                                <Textarea
                                    id="project-description"
                                    placeholder={getDescriptionPlaceholder()}
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring min-h-[100px] resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Additional Project Questions */}
                    {projectType && (
                        <div className="space-y-6">
                            <div className="border-t border-border pt-6 space-y-6">

                                {/* Breadboard Questions */}
                                {projectType === "breadboard" && (
                                    <div className="space-y-6">
                                        {/* Microcontroller Selection */}
                                        <div className="space-y-3">
                                            <Label className="text-foreground font-inter text-sm font-medium">
                                                Microcontroller
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {["Arduino Uno", "Arduino Nano", "ESP32", "Raspberry Pi Pico", "STM32", "Other"].map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => setMicrocontroller(option)}
                                                        className={cn(
                                                            "p-2 text-sm rounded-lg border transition-all",
                                                            microcontroller === option
                                                                ? "border-ring bg-accent text-foreground"
                                                                : "border-border bg-card text-foreground hover:bg-accent"
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                            {microcontroller === "Other" && (
                                                <Input
                                                    placeholder="Specify your microcontroller..."
                                                    value={microcontrollerOther}
                                                    onChange={(e) => setMicrocontrollerOther(e.target.value)}
                                                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
                                                />
                                            )}
                                        </div>

                                        {/* Complexity Slider */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-foreground font-inter text-sm font-medium">
                                                    Complexity
                                                </Label>
                                                <span className="text-sm text-muted-foreground">
                                                    {complexity <= 33 ? "Beginner" : complexity <= 66 ? "Intermediate" : "Advanced"}
                                                </span>
                                            </div>
                                            <div className="px-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="100"
                                                    value={complexity}
                                                    onChange={(e) => setComplexity(Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                    style={{
                                                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${complexity}%, #E5E7EB ${complexity}%, #E5E7EB 100%)`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Budget Slider */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-foreground font-inter text-sm font-medium">
                                                    Budget
                                                </Label>
                                                <span className="text-sm text-muted-foreground">
                                                    ${budget <= 20 ? "25" : budget <= 40 ? "50" : budget <= 60 ? "100" : budget <= 80 ? "200" : "500+"}
                                                </span>
                                            </div>
                                            <div className="px-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="100"
                                                    value={budget}
                                                    onChange={(e) => setBudget(Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                    style={{
                                                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${budget}%, #E5E7EB ${budget}%, #E5E7EB 100%)`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PCB Questions */}
                                {projectType === "pcb" && (
                                    <div className="space-y-6">
                                        {/* Purpose */}
                                        <div className="space-y-3">
                                            <Label className="text-foreground font-inter text-sm font-medium">
                                                Purpose
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {["Prototype", "Production", "Educational", "Hobby", "Commercial", "Open Source"].map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => setPurpose(option)}
                                                        className={cn(
                                                            "p-2 text-sm rounded-lg border transition-all",
                                                            purpose === option
                                                                ? "border-ring bg-accent text-foreground"
                                                                : "border-border bg-card text-foreground hover:bg-accent"
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Target Audience */}
                                        <div className="space-y-3">
                                            <Label className="text-foreground font-inter text-sm font-medium">
                                                Target Audience
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {["Personal", "Students", "Professionals", "Hobbyists", "General", "Developers"].map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => setTargetAudience(option)}
                                                        className={cn(
                                                            "p-2 text-sm rounded-lg border transition-all",
                                                            targetAudience === option
                                                                ? "border-ring bg-accent text-foreground"
                                                                : "border-border bg-card text-foreground hover:bg-accent"
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Budget Slider */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-foreground font-inter text-sm font-medium">
                                                    Budget
                                                </Label>
                                                <span className="text-sm text-muted-foreground">
                                                    ${budget <= 20 ? "50" : budget <= 40 ? "200" : budget <= 60 ? "500" : budget <= 80 ? "1000" : "2000+"}
                                                </span>
                                            </div>
                                            <div className="px-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="100"
                                                    value={budget}
                                                    onChange={(e) => setBudget(Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                    style={{
                                                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${budget}%, #E5E7EB ${budget}%, #E5E7EB 100%)`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="space-y-3">
                                            <Label className="text-foreground font-inter text-sm font-medium">
                                                Timeline
                                            </Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["ASAP", "1 month", "3 months", "6 months", "1 year", "No rush"].map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => setTimeline(option)}
                                                        className={cn(
                                                            "p-2 text-sm rounded-lg border transition-all",
                                                            timeline === option
                                                                ? "border-ring bg-accent text-foreground"
                                                                : "border-border bg-card text-foreground hover:bg-accent"
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Custom Project Questions */}
                                {projectType === "custom" && (
                                    <div className="space-y-6">
                                        {/* Custom Description */}
                                        <div className="space-y-3">
                                            <Label className="text-foreground font-inter text-sm font-medium">
                                                What type of hardware project?
                                            </Label>
                                            <Textarea
                                                placeholder="Describe your custom hardware project, what you're building, and any specific requirements..."
                                                value={customDescription}
                                                onChange={(e) => setCustomDescription(e.target.value)}
                                                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring min-h-[100px] resize-none"
                                            />
                                        </div>

                                        {/* Experience Level */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-foreground font-inter text-sm font-medium">
                                                    Experience Level
                                                </Label>
                                                <span className="text-sm text-muted-foreground">
                                                    {complexity <= 33 ? "Beginner" : complexity <= 66 ? "Intermediate" : "Advanced"}
                                                </span>
                                            </div>
                                            <div className="px-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="100"
                                                    value={complexity}
                                                    onChange={(e) => setComplexity(Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                    style={{
                                                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${complexity}%, #E5E7EB ${complexity}%, #E5E7EB 100%)`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Budget Slider */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-foreground font-inter text-sm font-medium">
                                                    Budget
                                                </Label>
                                                <span className="text-sm text-muted-foreground">
                                                    ${budget <= 20 ? "25" : budget <= 40 ? "100" : budget <= 60 ? "300" : budget <= 80 ? "500" : "1000+"}
                                                </span>
                                            </div>
                                            <div className="px-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="100"
                                                    value={budget}
                                                    onChange={(e) => setBudget(Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                    style={{
                                                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${budget}%, #E5E7EB ${budget}%, #E5E7EB 100%)`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <TextureButton
                            variant="destructive"
                            onClick={() => setOpen(false)}
                            className="flex-1 order-2 sm:order-1"
                        >
                            Cancel
                        </TextureButton>
                        <TextureButton
                            variant={isFormValid ? "accent" : "minimal"}
                            onClick={handleCreateProject}
                            disabled={!isFormValid}
                            className="flex-1 order-1 sm:order-2"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Project
                        </TextureButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
