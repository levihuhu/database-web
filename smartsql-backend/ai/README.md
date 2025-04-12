# AI Integration App

This Django app handles the integration with OpenAI's GPT models to provide AI chat functionality for the SmartSQL application.

## Features

- Chat API endpoint that forwards requests to OpenAI
- SQL evaluation through GPT models
- Authentication and permission handling

## Setup

1. Make sure the OpenAI Python package is installed:
   ```
   pip install openai
   ```

2. Set your OpenAI API key in the environment variables:
   ```
   export OPENAI_API_KEY="your-openai-api-key"
   ```

3. Alternatively, you can set it directly in settings.py (not recommended for production):
   ```python
   OPENAI_API_KEY = "your-openai-api-key"
   ```

## API Endpoints

### POST /api/ai/chat/

This endpoint accepts a list of messages and sends them to OpenAI's GPT model, returning the model's response.

**Request format:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a SQL instructor..."},
    {"role": "user", "content": "How do I use JOIN in SQL?"}
  ]
}
```

**Response format:**
```json
{
  "role": "assistant",
  "content": "To use JOIN in SQL..."
}
```

## Error Handling

The API will return appropriate HTTP status codes and error messages for different types of errors:

- 400 Bad Request: Invalid message format or missing messages
- 401 Unauthorized: Missing or invalid authentication
- 500 Internal Server Error: Other errors, including OpenAI API errors 