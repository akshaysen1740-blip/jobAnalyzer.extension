# LinkedIn Job Analyzer — Chrome Extension

A Chrome Extension that analyzes LinkedIn job postings and extracts structured information using an AI-powered backend.

The extension reads relevant information from the LinkedIn job page, sends the job data to the Job Analyzer API, and displays the analyzed result directly inside the extension UI.

---

## Features

- Automatically detects LinkedIn job pages
- Extracts job posting information from the LinkedIn DOM
- Extracts company name and profile/job title information from the page
- Sends job information to the backend API
- AI-powered job description analysis
- Displays structured job information
- Extracts required skills
- Extracts experience requirements
- Extracts qualifications
- Detects seniority
- Displays job location
- Works with the production HTTPS API
- Built using Chrome Manifest V3

---

## Architecture

```mermaid
flowchart LR
    A[LinkedIn Job Page] --> B[Content Script]

    B --> C[Extract Job Data]

    C --> D[Chrome Extension UI]

    D -->|HTTPS| E[Job Analyzer API]

    E --> F[Gemini API]

    F --> E

    E --> D