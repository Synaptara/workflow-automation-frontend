// Add a new integration here whenever you ship a new executor — the landing
// page's integrations section reads straight from this file.
//
// icon: any JSX (an inline SVG works best, so it scales cleanly and needs no
// network request). Brand colors are kept as-is for recognizability, even
// though the rest of the page is monochrome — that's standard practice for
// integration logos (Zapier, Make, etc. all do this).

const Slack = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E01E5A" strokeWidth="1.5">
    <rect x="13" y="2" width="4" height="8" rx="2" />
    <rect x="7" y="14" width="4" height="8" rx="2" />
    <rect x="2" y="7" width="8" height="4" rx="2" />
    <rect x="14" y="13" width="8" height="4" rx="2" />
  </svg>
);

const Discord = (
  <svg width="28" height="28" viewBox="0 0 16 16" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613 1.451.73 1.438 1.613c0 .888-.631 1.612-1.438 1.612" />
  </svg>
);

const Email = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const Http = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const GoogleSheets = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F9D58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const Groq = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F55036" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

export const INTEGRATIONS = [
  {
    key: "slack",
    icon: Slack,
    title: "Slack",
    description: "Post a message to any channel the moment a workflow runs.",
  },
  {
    key: "discord",
    icon: Discord,
    title: "Discord",
    description: "Send alerts, pings, or rich embeds to a Discord channel.",
  },
  {
    key: "email",
    icon: Email,
    title: "Email",
    description: "Send a transactional email with data from the trigger.",
  },
  {
    key: "http",
    icon: Http,
    title: "HTTP Request",
    description: "Call any API — the escape hatch for anything not listed here.",
  },
  {
    key: "google_sheets",
    icon: GoogleSheets,
    title: "Google Sheets",
    description: "Append a row to a spreadsheet with each run's data.",
  },
  {
    key: "groq_ai",
    icon: Groq,
    title: "Groq AI",
    description: "Summarize, classify, or generate text as a step in the flow.",
  },
];
