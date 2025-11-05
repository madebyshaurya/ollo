export type ProjectStageId =
  | "breadboard:parts"
  | "breadboard:wiring"
  | "breadboard:validation"
  | "pcb:parts"
  | "pcb:schematic"
  | "pcb:layout"
  | "pcb:bringup"
  | "custom:architecture"
  | "custom:integration"
  | "custom:validation"

export interface ProjectStage {
  id: ProjectStageId
  title: string
  description: string
  tasks: string[]
  suggestedArtifacts: string[]
}

export const PROJECT_WORKFLOW: Record<"breadboard" | "pcb" | "custom", ProjectStage[]> = {
  breadboard: [
    {
      id: "breadboard:parts",
      title: "Source core modules",
      description:
        "Lock in power regulation, sensor modules, and your primary controller so inventory can be secured early.",
      tasks: [
        "Pick a microcontroller breakout and confirm available stock",
        "Select regulators or buck converters sized for the build",
        "Choose sensor boards and accessories needed for prototyping",
      ],
      suggestedArtifacts: ["BOM snapshot", "Cart link screenshot"],
    },
    {
      id: "breadboard:wiring",
      title: "Wire up first prototype",
      description:
        "Lay out the breadboard wiring harness and confirm power and signal integrity before firmware.",
      tasks: [
        "Assemble power rail and confirm voltage with multimeter",
        "Route sensor buses keeping wire length balanced",
        "Label jumpers / capture wiring diagram for future revisions",
      ],
      suggestedArtifacts: ["Annotated wiring photo", "Wiring legend"],
    },
    {
      id: "breadboard:validation",
      title: "Firmware bring-up & validation",
      description:
        "Flash the initial firmware, log sensor data, and validate the prototype meets baseline requirements.",
      tasks: [
        "Flash proof-of-life firmware and confirm boot",
        "Stream sensor data to host and log captured output",
        "Document deviations and next iteration needs",
      ],
      suggestedArtifacts: ["Validation checklist", "Log snippet"],
    },
  ],
  pcb: [
    {
      id: "pcb:parts",
      title: "Lock critical components",
      description:
        "Select MCUs, regulators, and key passives before schematic work so footprints and availability are aligned.",
      tasks: [
        "Pick MCU / SoC package and confirm lifecycle",
        "Select power tree components with derating applied",
        "Identify connectors and mechanical envelopes",
      ],
      suggestedArtifacts: ["Sourcing spreadsheet", "Footprint notes"],
    },
    {
      id: "pcb:schematic",
      title: "Draft schematic",
      description:
        "Capture the design in CAD, annotate net names, and run early ERC before layout.",
      tasks: [
        "Capture core schematics with hierarchical sheets",
        "Assign reference designators and annotate nets",
        "Run ERC and resolve warnings",
      ],
      suggestedArtifacts: ["PDF schematic", "ERC report"],
    },
    {
      id: "pcb:layout",
      title: "PCB layout & fabrication",
      description:
        "Place key components, route critical nets, and prep manufacturing outputs for fab submission.",
      tasks: [
        "Complete placement respecting constraints",
        "Route high-speed / differential pairs first",
        "Generate Gerbers, drill files, and fab notes",
      ],
      suggestedArtifacts: ["Gerber zip", "Fabrication drawing"],
    },
    {
      id: "pcb:bringup",
      title: "Board bring-up & validation",
      description:
        "Assemble first articles, power-on safely, and validate firmware + hardware interactions.",
      tasks: [
        "Perform staged power-on with current limiting",
        "Flash firmware and log telemetry",
        "Record validation checklist results",
      ],
      suggestedArtifacts: ["Bring-up checklist", "Issue log"],
    },
  ],
  custom: [
    {
      id: "custom:architecture",
      title: "System architecture",
      description:
        "Define the electrical, mechanical, and firmware boundaries before building integration rigs.",
      tasks: [
        "Draft block diagram and data flows",
        "Select compute platforms / SBCs",
        "Outline mechanical mounting or enclosure constraints",
      ],
      suggestedArtifacts: ["Architecture diagram", "Subsystem checklist"],
    },
    {
      id: "custom:integration",
      title: "Subsystem integration",
      description:
        "Integrate electrical and mechanical subsystems, ensuring harnessing and firmware interfaces align.",
      tasks: [
        "Assemble harness / cabling with strain relief",
        "Integrate sensors/actuators and validate I/O",
        "Capture integration test plan",
      ],
      suggestedArtifacts: ["Integration test report", "Harness drawing"],
    },
    {
      id: "custom:validation",
      title: "System validation",
      description:
        "Run end-to-end tests, collect performance data, and prep documentation for handoff or production.",
      tasks: [
        "Execute validation matrix and log results",
        "Collect long-run telemetry for thermal/power",
        "Summarize outstanding issues and next steps",
      ],
      suggestedArtifacts: ["Validation matrix", "Telemetry plots"],
    },
  ],
}

export function getInitialStage(type: "breadboard" | "pcb" | "custom"): ProjectStageId {
  const stages = PROJECT_WORKFLOW[type]
  return stages[0]?.id ?? "breadboard:parts"
}

export function getNextStage(type: "breadboard" | "pcb" | "custom", currentId: ProjectStageId | null) {
  const stages = PROJECT_WORKFLOW[type]
  if (!currentId) return stages[0]?.id
  const index = stages.findIndex((stage) => stage.id === currentId)
  if (index === -1) return stages[0]?.id
  return stages[index + 1]?.id ?? null
}

export function getStageIndex(type: "breadboard" | "pcb" | "custom", currentId: ProjectStageId | null) {
  const stages = PROJECT_WORKFLOW[type]
  if (!currentId) return 0
  const index = stages.findIndex((stage) => stage.id === currentId)
  return index === -1 ? 0 : index
}

export function toProjectStageId(
  type: "breadboard" | "pcb" | "custom",
  stage: unknown
): ProjectStageId | null {
  if (typeof stage !== "string") {
    return null
  }

  return PROJECT_WORKFLOW[type].some(({ id }) => id === stage) ? (stage as ProjectStageId) : null
}
