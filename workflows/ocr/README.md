# Study1024 OCR Workflow

This n8n workflow handles the OCR (Optical Character Recognition) processing for uploaded documents.

## Workflow Overview

1. Start: HTTP Webhook trigger on document upload
2. Process: Azure Computer Vision OCR
3. Store: Save results to Supabase
4. Notify: Send processing completion webhook to Retool

## Configuration

```json
{
  "name": "document-ocr",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ocr",
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
        "resource": "ocr",
        "endpoint": "https://{{$node.Webhook.json[\"region\"]}}.api.cognitive.microsoft.com/vision/v3.2/ocr",
        "language": "{{$node.Webhook.json[\"language\"]}}",
        "binary": true
      },
      "name": "Azure Computer Vision",
      "type": "n8n-nodes-base.microsoftComputerVision",
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
          "content_type": "ocr",
          "raw_content": "={{$node[\"Azure Computer Vision\"].json[\"text\"]}}",
          "processed_content": "={{$node[\"Azure Computer Vision\"].json[\"text\"]}}",
          "confidence": "={{$node[\"Azure Computer Vision\"].json[\"confidence\"]}}"
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
   - `AZURE_VISION_KEY`: Azure Computer Vision API key
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_KEY`: Supabase service role key

3. Test the workflow with a sample document:
```bash
curl -X POST -H "Content-Type: multipart/form-data" \
  -F "file=@sample.pdf" \
  -F "document_id=123e4567-e89b-12d3-a456-426614174000" \
  http://localhost:5678/webhook/ocr
```