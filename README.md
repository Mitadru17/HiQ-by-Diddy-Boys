# Resume Analyzer API

A Node.js backend service that analyzes resumes using the Google Gemini API. The service accepts PDF resume uploads, extracts the text, and uses AI to analyze the content, providing scores, grammar checks, improvement suggestions, and keyword analysis.

## Features

- PDF resume upload handling
- Text extraction from PDF files
- AI-powered resume analysis using Google Gemini
- Comprehensive analysis including:
  - Overall resume score
  - Grammar and spelling mistake detection
  - Improvement suggestions
  - Missing industry-specific keywords

## Technology Stack

- **Express.js**: Backend framework
- **Multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **Google Gemini API**: AI analysis
- **CORS**: Cross-origin resource sharing

## Prerequisites

- Node.js (v14 or later)
- Google Gemini API key

## Setup

1. Clone the repository:

   ```
   git clone <repository-url>
   cd resume-analyzer
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. Replace `your_gemini_api_key_here` with your actual Google Gemini API key.

## Running the Application

Start the server:

```
node server.js
```

The server will start at `http://localhost:3000` (or the port specified in your .env file).

## API Endpoint

### Analyze Resume

- **URL**: `/analyze-resume`
- **Method**: POST
- **Content Type**: `multipart/form-data`
- **Request Parameter**:
  - `resume`: PDF file (max 5MB)

### Response Format

```json
{
  "success": true,
  "score": 85,
  "grammar_issues": [
    "Misspelled 'experience' as 'experiance'",
    "Missing period at the end of the second bullet point"
  ],
  "improvements": [
    "Add quantifiable achievements for each job role",
    "Use more action verbs to describe responsibilities",
    "Improve the summary section to highlight key strengths"
  ],
  "missing_keywords": ["project management", "team leadership", "data analysis"]
}
```

## Error Handling

The API handles various error scenarios:

- Invalid file formats (only PDFs are accepted)
- File size limits (max 5MB)
- PDF parsing errors
- AI analysis errors

Error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## License

ISC
