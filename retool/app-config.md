# Study1024 Retool App Configuration

## Components

### 1. Document Upload Form
```json
{
  "type": "form",
  "name": "documentUploadForm",
  "components": [
    {
      "type": "filepicker",
      "name": "fileInput",
      "label": "문서 선택",
      "allowMultiple": false,
      "accept": ".pdf,.png,.jpg,.jpeg,.doc,.docx"
    },
    {
      "type": "select",
      "name": "processType",
      "label": "처리 유형",
      "options": [
        { "label": "OCR", "value": "ocr" },
        { "label": "STT", "value": "stt" },
        { "label": "OCR + 요약", "value": "ocr_summary" },
        { "label": "STT + 요약", "value": "stt_summary" }
      ]
    },
    {
      "type": "button",
      "name": "submitButton",
      "label": "업로드",
      "style": "primary",
      "onClick": "{{uploadDocument()}}"
    }
  ]
}
```

### 2. Processing Status Table
```json
{
  "type": "table",
  "name": "processingTable",
  "data": "{{queryDocuments.data}}",
  "columns": [
    {
      "name": "title",
      "label": "문서명"
    },
    {
      "name": "status",
      "label": "상태",
      "cellRenderer": "{{statusBadge(item.status)}}"
    },
    {
      "name": "created_at",
      "label": "업로드 시간",
      "format": "YYYY-MM-DD HH:mm:ss"
    },
    {
      "name": "actions",
      "label": "작업",
      "cellRenderer": "{{actionButtons(item)}}"
    }
  ]
}
```

### 3. Results Viewer
```json
{
  "type": "container",
  "name": "resultsViewer",
  "components": [
    {
      "type": "tabs",
      "tabs": [
        {
          "label": "원본",
          "content": "{{selectedDocument.content}}"
        },
        {
          "label": "추출 텍스트",
          "content": "{{selectedDocument.extracted_content}}"
        },
        {
          "label": "AI 요약",
          "content": "{{selectedDocument.summary}}"
        }
      ]
    }
  ]
}
```

## Queries

### 1. List Documents
```javascript
// queryDocuments
return await supabase
  .from('documents')
  .select(`
    *,
    extracted_contents (
      content_type,
      processed_content
    ),
    summaries (
      summary_text
    )
  `)
  .order('created_at', { ascending: false });
```

### 2. Upload Document
```javascript
// uploadDocument
const file = fileInput.files[0];
const fileName = file.name;
const fileType = file.type;

// 1. Get upload URL from Supabase Storage
const { data: uploadData, error: uploadError } = await supabase
  .storage
  .from('documents')
  .upload(`${Date.now()}-${fileName}`, file);

if (uploadError) throw uploadError;

// 2. Create document record
const { data: doc, error: docError } = await supabase
  .from('documents')
  .insert({
    title: fileName,
    file_path: uploadData.path,
    file_type: fileType,
    content_type: processType.value,
    status: 'pending'
  })
  .select()
  .single();

if (docError) throw docError;

// 3. Trigger n8n workflow
await triggerWorkflow(doc.id, processType.value);
```

### 3. Get Document Details
```javascript
// getDocumentDetails
const { data, error } = await supabase
  .from('documents')
  .select(`
    *,
    extracted_contents (
      content_type,
      processed_content,
      confidence
    ),
    summaries (
      summary_text,
      summary_type
    ),
    processing_history (
      process_type,
      status,
      error_message
    )
  `)
  .eq('id', documentId)
  .single();

if (error) throw error;
return data;
```

## Functions

### 1. Status Badge Renderer
```javascript
// statusBadge
function statusBadge(status) {
  const colors = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    error: 'danger'
  };
  
  return {
    type: 'badge',
    text: status,
    color: colors[status]
  };
}
```

### 2. Action Buttons Renderer
```javascript
// actionButtons
function actionButtons(document) {
  return [
    {
      type: 'button',
      icon: 'eye',
      onClick: () => viewDocument(document.id),
      disabled: document.status !== 'completed'
    },
    {
      type: 'button',
      icon: 'download',
      onClick: () => downloadResults(document.id),
      disabled: document.status !== 'completed'
    },
    {
      type: 'button',
      icon: 'refresh',
      onClick: () => retryProcessing(document.id),
      disabled: document.status !== 'error'
    }
  ];
}
```