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
  }
};