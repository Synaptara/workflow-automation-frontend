export const INTEGRATIONS = {
  slack: {
    name: "Slack",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://hooks.slack.com/..." },
      { key: "text", label: "Message Text", type: "textarea", placeholder: "Hello {{trigger.name}}" }
    ]
  },
  email: {
    name: "Email",
    fields: [
      { key: "to", label: "Recipient Email", type: "text", placeholder: "user@example.com" },
      { key: "subject", label: "Subject Line", type: "text", placeholder: "New Alert: {{trigger.status}}" },
      { key: "body", label: "Email Body", type: "textarea", placeholder: "Hello, the budget is {{trigger.budget}}..." }
    ]
  },
  http: {
    name: "HTTP Request",
    fields: [
      { key: "method", label: "Method (GET, POST, PUT, DELETE)", type: "text", placeholder: "POST" },
      { key: "url", label: "Endpoint URL", type: "text", placeholder: "https://api.example.com/v1/data" },
      { key: "headers", label: "Headers (JSON format)", type: "textarea", placeholder: '{"Authorization": "Bearer token", "Content-Type": "application/json"}' },
      { key: "body", label: "Body (JSON format)", type: "textarea", placeholder: '{"amount": "{{trigger.budget}}"}' }
    ]
  },
  discord: {
    name: "Discord",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://discord.com/api/webhooks/..." },
      { key: "content", label: "Message Text / @Pings", type: "textarea", placeholder: "Deployment failed! <@123456789>" },
      { key: "embed_title", label: "Embed Title", type: "text", placeholder: "Workflow Alert" },
      { key: "embed_description", label: "Embed Description", type: "textarea", placeholder: "Detailed alert info..." },
      { key: "embed_color", label: "Embed Color (Hex)", type: "text", placeholder: "ff0000" },
    ],
  },
  
  google_sheets: {
    name: "Google Sheets",
    fields: [
      { key: "access_token", label: "Access Token", type: "text", placeholder: "ya29.a0AfB_..." },
      { key: "spreadsheet_id", label: "Spreadsheet ID", type: "text", placeholder: "1BxiMVs0XRYFgPN..." },
      { key: "range", label: "Sheet Name & Range", type: "text", placeholder: "Sheet1!A:A" },
      { key: "values", label: "Row Values (Comma Separated)", type: "textarea", placeholder: "John Doe, john@example.com, $1500" },
    ],
  },
};