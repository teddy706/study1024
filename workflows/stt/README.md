# Study1024 STT Workflow

This n8n workflow handles the Speech-to-Text (STT) processing for uploaded audio files.

## Workflow Overview

1. Start: HTTP Webhook trigger on audio file upload
2. Process: Azure Speech Services STT
3. Store: Save results to Supabase
4. Notify: Send processing completion webhook to Retool

## Configuration

```json
{
  "name": "audio-stt",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "stt",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        250,
        300
      ]
    },
    {
      "parameters": {
        "resource": "stt",
        "subscriptionKey": "{{$env.AZURE_SPEECH_KEY}}",
        "region": "{{$node.Webhook.json[\"region\"]}}",
        "language": "{{$node.Webhook.json[\"language\"]}}",
        "binary": true
      },
      "name": "Azure Speech Services",
      "type": "n8n-nodes-base.microsoftSpeech",
      "typeVersion": 1,
      "position": [
        450,
        300
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "extracted_contents",
        "columns": "document_id,content_type,raw_content,processed_content,confidence",
        "values": {
          "document_id": "={{$node.Webhook.json[\"document_id\"]}}",
          "content_type": "stt",
          "raw_content": "={{$node[\"Azure Speech Services\"].json[\"text\"]}}",
          "processed_content": "={{$node[\"Azure Speech Services\"].json[\"text\"]}}",
          "confidence": "={{$node[\"Azure Speech Services\"].json[\"confidence\"]}}"
        }
      },
      "name": "Supabase",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        650,
        300
      ]
    }
  ]
}
```

## Usage

1. Deploy the workflow to your n8n instance
2. Configure environment variables:
   - `AZURE_SPEECH_KEY`: Azure Speech Services API key
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_KEY`: Supabase service role key

3. Test the workflow with a sample audio file:
```bash
curl -X POST -H "Content-Type: multipart/form-data" \
  -F "file=@sample.mp3" \
  -F "document_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "language=ko-KR" \
  http://localhost:5678/webhook/stt
```