export const INTEGRATIONS = {
  discord: {
    name: "Discord",
    triggers: {
      new_message: {
        name: "New Message Posted to Channel",
        description: "Triggers when a new message is sent in a specific channel.",
        fields: [
          { key: "channel_id", label: "Channel ID", type: "text", placeholder: "1234567890" }
        ]
      }
    },
    actions: {
      send_message: {
        name: "Send Channel Message",
        description: "Post a new message to a specific Discord channel.",
        fields: [
          { key: "channel_id", label: "Channel ID", type: "text", placeholder: "1234567890" },
          { key: "content", label: "Message Text / @Pings", type: "textarea", placeholder: "Deployment failed! <@123456789>" },
          { key: "embed_title", label: "Embed Title", type: "text", placeholder: "Workflow Alert" },
          { key: "embed_description", label: "Embed Description", type: "textarea", placeholder: "Detailed alert info..." },
          { key: "embed_color", label: "Embed Color (Hex)", type: "text", placeholder: "ff0000" },
        ]
      }
    }
  },

  github: {
    name: "GitHub",
    triggers: {
      new_issue: {
        name: "New Issue Created",
        description: "Triggers when a new issue is opened in a repository.",
        fields: [
          { key: "repo_name", label: "Repository Name", type: "text", placeholder: "owner/repo" }
        ]
      }
    },
    actions: {
      create_repository: {
        name: "Create Repository",
        description: "Programmatically create a new GitHub repository.",
        fields: [
          { key: "repo_name", label: "New Repository Name", type: "text", placeholder: "api-backend-service" },
          { key: "private", label: "Visibility", type: "select", options: [
            { value: "true", label: "Private" },
            { value: "false", label: "Public" }
          ]}
        ]
      },
      push_code: {
        name: "Push Code / Commit",
        description: "Commit and push code to a specific branch.",
        fields: [
          { key: "repo_name", label: "Repository Name", type: "text", placeholder: "owner/repo" },
          { key: "branch", label: "Branch", type: "text", placeholder: "main" },
          { key: "commit_message", label: "Commit Message", type: "text", placeholder: "Automated commit via Orkflo" }
        ]
      }
    }
  },

  youtube: {
    name: "YouTube",
    triggers: {},
    actions: {
      upload_video: {
        name: "Upload Video",
        description: "Automate video distribution by uploading a video directly to a channel.",
        fields: [
          { key: "video_url", label: "Source Video File URL (e.g., from Drive)", type: "text", placeholder: "https://..." },
          { key: "title", label: "Video Title", type: "text", placeholder: "Automated Upload: {{trigger.title}}" },
          { key: "description", label: "Video Description", type: "textarea", placeholder: "Generated via Orkflo automation." },
          { key: "privacy", label: "Privacy Status", type: "select", options: [
            { value: "private", label: "Private" },
            { value: "unlisted", label: "Unlisted" },
            { value: "public", label: "Public" }
          ]}
        ]
      }
    }
  },

  google_sheets: {
    name: "Google Sheets",
    triggers: {
      new_row: {
        name: "New Spreadsheet Row",
        description: "Triggers when a new row is added to the bottom of a sheet.",
        fields: [
          { key: "spreadsheet_id", label: "Spreadsheet ID", type: "text", placeholder: "1BxiMVs0XRYFgPN..." },
          { key: "sheet_name", label: "Worksheet Name", type: "text", placeholder: "Sheet1" }
        ]
      }
    },
    actions: {
      add_row: {
        name: "Create Spreadsheet Row",
        description: "Append a new row of data to an existing sheet.",
        fields: [
          { key: "spreadsheet_id", label: "Spreadsheet ID", type: "text", placeholder: "1BxiMVs0XRYFgPN..." },
          { key: "range", label: "Sheet Name & Range", type: "text", placeholder: "Sheet1!A:A" },
          { key: "values", label: "Row Values (Comma Separated)", type: "textarea", placeholder: "John Doe, john@example.com, $1500" },
        ]
      }
    }
  },

  groq_ai: {
    name: "Groq AI",
    triggers: {},
    actions: {
      generate_text: {
        name: "Generate Text / Chat",
        description: "Send a prompt to a Groq open-source language model.",
        fields: [
          {
            key: "model",
            label: "Model",
            type: "select",
            options: [
              { value: "gemma2-9b-it", label: "Gemma 2 9B (Fast & Reliable)" },
              { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Complex)" },
              { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" }
            ]
          },
          { key: "prompt", label: "Prompt", type: "textarea", placeholder: "Extract the names from this text: {{trigger.email_body}}" },
        ]
      }
    }
  },

  slack: {
    name: "Slack",
    triggers: {},
    actions: {
      send_message: {
        name: "Send Channel Message",
        description: "Post a message to a Slack channel via Webhook.",
        fields: [
          { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://hooks.slack.com/..." },
          { key: "text", label: "Message Text", type: "textarea", placeholder: "Hello {{trigger.name}}" }
        ]
      }
    }
  },

  notion: {
    name: "Notion",
    triggers: {},
    actions: {
      create_page: {
        name: "Create Database Item",
        description: "Create a new page inside a Notion database.",
        fields: [
          { key: "api_key", label: "Notion API Key", type: "text", placeholder: "secret_..." },
          { key: "database_id", label: "Database ID", type: "text", placeholder: "e.g. 1a2b3c4d..." },
          { key: "title", label: "Page Title", type: "text", placeholder: "New Lead: {{trigger.name}}" },
          { key: "content", label: "Page Content", type: "textarea", placeholder: "Lead email: {{trigger.email}}" }
        ]
      }
    }
  },

  http: {
    name: "HTTP Request",
    triggers: {},
    actions: {
      custom_request: {
        name: "Custom Webhook Request",
        description: "Send a custom GET, POST, PUT, or DELETE request.",
        fields: [
          { key: "method", label: "Method (GET, POST, PUT, DELETE)", type: "select", options: [
            { value: "GET", label: "GET" }, { value: "POST", label: "POST" },
            { value: "PUT", label: "PUT" }, { value: "DELETE", label: "DELETE" }
          ]},
          { key: "url", label: "Endpoint URL", type: "text", placeholder: "https://api.example.com/v1/data" },
          { key: "headers", label: "Headers (JSON format)", type: "textarea", placeholder: '{"Authorization": "Bearer token", "Content-Type": "application/json"}' },
          { key: "body", label: "Body (JSON format)", type: "textarea", placeholder: '{"amount": "{{trigger.budget}}"}' }
        ]
      }
    }
  },
};
