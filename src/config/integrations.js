
export const INTEGRATIONS = {
  slack: {
    name: "Slack",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://hooks.slack.com/..." },
      { key: "text", label: "Message Text", type: "textarea", placeholder: "Hello {{trigger.name}}" }
    ]
  },
  gmail: {
    name: "Gmail",
    fields: [
      { key: "to", label: "Recipient Email", type: "text", placeholder: "user@example.com" },
      { key: "subject", label: "Subject Line", type: "text", placeholder: "Welcome!" },
      { key: "body", label: "Email Body", type: "textarea", placeholder: "Hi {{trigger.name}}..." }
    ]
  },
  sheets: {
    name: "Google Sheets",
    fields: [
      { key: "spreadsheet_id", label: "Spreadsheet ID", type: "text", placeholder: "1BxiMVs0X..." },
      { key: "row_data", label: "Row Data (Comma separated)", type: "text", placeholder: "{{trigger.name}}, {{trigger.email}}" }
    ]
  }
};