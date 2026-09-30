import { useState } from "react";
import { motion } from "motion/react";

import { JonworkSessionPanel } from "./jonwork-session-panel";
import { canvasThemes } from "@/lib/canvas-theme";
import { CANVAS_AGENT_PANEL_MOTION_MS, useAgentStore } from "@/stores/use-agent-store";
import { useThemeStore } from "@/stores/use-theme-store";

const PANEL_MOTION_SECONDS = CANVAS_AGENT_PANEL_MOTION_MS / 1000;

export function AgentPanel() {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const width = useAgentStore((state) => state.width);
    const panelOpen = useAgentStore((state) => state.panelOpen);
    const [maximized, setMaximized] = useState(false);

    return (
        <div className="pointer-events-none fixed inset-0 z-[90]">
            <motion.aside
                className={`pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl border shadow-2xl ${maximized ? "inset-x-4 bottom-[88px] top-4" : "bottom-[88px] right-4 max-h-[calc(100vh-112px)]"}`}
                data-canvas-shortcuts-ignore
                initial={false}
                animate={{ y: panelOpen ? 0 : 18, scale: panelOpen ? 1 : 0.96, opacity: panelOpen ? 1 : 0 }}
                transition={{ duration: PANEL_MOTION_SECONDS, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: maximized ? "auto" : `min(${width}px, calc(100vw - 32px))`, height: maximized ? "auto" : "min(620px, calc(100vh - 88px))", background: theme.node.panel, borderColor: theme.node.stroke, color: theme.node.text, pointerEvents: panelOpen ? undefined : "none" }}
            >
                <JonworkSessionPanel maximized={maximized} onToggleMaximize={() => setMaximized((value) => !value)} />
            </motion.aside>
        </div>
    );
}
