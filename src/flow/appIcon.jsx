import { NetworkIcon, RotateCcwClockIcon, WorkflowIcon, DiscordIcon, GithubIcon, FileSheetIcon, SlackIcon, RobotIcon } from "../components/icons";
import { Mail } from "lucide-react";
import { INTEGRATIONS } from "../config/integrations";

export const BUILTIN_NAMES = { webhook: "Incoming Webhook", schedule: "Schedule", http: "HTTP Request" };
export const appName = (key) => INTEGRATIONS[key]?.name || BUILTIN_NAMES[key] || key;

export function getIntegrationIcon(key) {
  switch (key) {
    case "discord": return <DiscordIcon className="w-4 h-4 text-[#5865F2]" />;
    case "github": return <GithubIcon className="w-4 h-4 text-foreground" />;
    case "google_sheets": return <FileSheetIcon className="w-4 h-4 text-[#0F9D58]" />;
    case "slack": return <SlackIcon className="w-4 h-4" />;
    case "groq_ai": return <RobotIcon className="w-4 h-4 text-orange-500" />;
    case "email": return <Mail className="w-4 h-4 text-blue-400" />;
    case "notion": return <div className="w-4 h-4 bg-foreground text-background font-serif font-bold flex items-center justify-center rounded-[3px] text-[10px]">N</div>;
    case "webhook": return <NetworkIcon className="w-4 h-4 text-foreground" />;
    case "http": return <NetworkIcon className="w-4 h-4 text-blue-500" />;
    case "schedule": return <RotateCcwClockIcon className="w-4 h-4 text-foreground" />;
    default: return <WorkflowIcon className="w-4 h-4" />;
  }
}
