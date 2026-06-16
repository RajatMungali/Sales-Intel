# AI-Powered Lead Generation Intelligence Platform

An AI-powered internal sales intelligence platform that automatically discovers, enriches, and prioritizes companies likely to require sales outreach, appointment-setting, or outbound infrastructure services.

The platform transforms manual lead research into an automated workflow using public intent signals, AI enrichment, and a centralized dashboard.

---

## Overview

Traditional lead generation often involves manually researching companies across multiple sources, making the process time-consuming, inconsistent, and difficult to scale.

This project automates that workflow by:

- Discovering companies from public data sources
- Detecting growth and buying-intent signals
- Enriching company information using AI
- Assigning intent scores
- Presenting actionable leads through an interactive dashboard

The objective is to help sales teams quickly identify and prioritize high-intent prospects.

---

## Problem Statement

Sales teams spend significant time researching companies that may require:

- Sales outreach services
- Appointment-setting services
- Outbound sales infrastructure

This process relies on identifying indicators such as:

- Recent funding announcements
- Sales-related hiring activity
- Growth and expansion signals
- Public discussions around scaling

The platform automates this workflow and provides a consistent, scalable solution.

---

## Features

### Company Discovery

Automatically discovers companies using public intent signals.

### AI Enrichment

Generates additional company information, including:

- Industry
- Company stage
- Growth summaries
- Outreach suggestions

### Intent Scoring

Ranks companies based on detected signals.

### Dashboard

Provides a centralized interface to:

- Search companies
- Filter results
- Sort by intent score
- View detailed lead information

### Automation Pipeline

Uses n8n to orchestrate the entire workflow.

---

## System Architecture

```text
Data Sources
        ↓
Signal Extraction
        ↓
AI Analysis (Groq)
        ↓
Intent Scoring Engine
        ↓
Supabase Database
        ↓
React Dashboard
```

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS

### Backend & Database

- Supabase

### AI

- Groq API

### Automation

- n8n

### External Services

- News API
- Logo API

---

## Intent Scoring Logic

The scoring system combines multiple signals.

| Signal | Score |
|--------|-------|
| Sales Hiring | +40 |
| Funding | +35 |
| Growth | +25 |

### Lead Categories

| Score | Tier |
|-------|------|
| 80–100 | Hot |
| 50–79 | Warm |
| 0–49 | Cold |

---

## How AI Is Used

AI is used in four major areas.

### 1. Signal Extraction

Analyze unstructured data to identify buying-intent indicators.

### 2. Company Enrichment

Generate:

- Industry
- Company stage
- Growth summaries

### 3. Intent Scoring

Predict lead quality based on combined signals.

### 4. Outreach Angle Generation

Explain why a company may need outbound support.

---

## Project Structure

```text
Frontend (React Dashboard)
│
├── Dashboard UI
├── Search & Filters
├── Lead Details
└── Analytics

n8n Automation
│
├── Data Collection
├── Signal Extraction
├── AI Enrichment
├── Intent Scoring
└── Database Updates

Supabase
│
└── Company Storage
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/RajatMungali/Sales-Intel.git

cd Sales-Intel
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory.

```env


GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
NEWS_API=your_newsapi_key


```

### 4. Start the frontend

```bash
npm run dev
```

### 5. Start n8n

```bash
n8n start
```

---

## V1 Scope

The initial version focuses on validating product value quickly.

### Implemented Features

- Company discovery
- AI enrichment
- Intent scoring
- Dashboard interface
- Search, filtering, and sorting
- Automation workflows

---

## V2 Roadmap

Planned enhancements include:

- Contact discovery
- Apollo integration
- Real-time monitoring
- Automated outreach
- ICP-based filtering
- Better scoring models
- Multi-agent research workflows

---

## Design Decisions

The platform intentionally does not rely entirely on n8n.

n8n is used as an orchestration layer rather than the entire application because:

- Large workflows become difficult to maintain
- Deployment complexity increases
- Authentication management becomes cumbersome
- Dashboard capabilities are limited

Instead, responsibilities are separated across the stack.

| Component | Responsibility |
|-----------|----------------|
| n8n | Workflow automation |
| Groq | AI enrichment and scoring |
| Supabase | Data management |
| React | Product experience |

This architecture is easier to maintain, extend, and scale.

---

## Live Demo

https://sales-intel-sand.vercel.app/

---

## Walkthrough Video

https://drive.google.com/file/d/1CdtO3aHnqlMzDvAKrHNQ0EBa5Km1geUf/view

---

## Repository

https://github.com/RajatMungali/Sales-Intel

---

## Author

**Rajat Mungali**

Aspiring Software Engineer | AI & Full-Stack Developer
