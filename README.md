# CV Coach - Film Industry Interview & Career Platform

CV Coach is a personalized web application designed to help a film student land their first industry gig through AI-powered CV tailoring, skills assessment, and interview coaching.

## Overview

CV Coach provides:
- **CV Tailoring**: AI-powered CV customization for specific film industry roles
- **Skills Assessment**: Track and evaluate technical, creative, and soft skills
- **Interview Coaching**: Practice with industry-specific questions
- **Audio Recording**: Record practice answers (browser-based)
- **AI Feedback**: Personalized coaching on interview responses
- **Progress Tracking**: Monitor improvement and build confidence over time
- **Mobile-Friendly**: Accessible from desktop or mobile devices

## Tech Stack

- **Frontend**: Next.js 15 with React and TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js (email/password)
- **Database**: PostgreSQL (Neon Serverless)
- **AI Coaching**: Claude API (Anthropic)
- **Deployment**: Vercel
- **Audio**: Browser MediaRecorder API (no external services)

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add:
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
- **ANTHROPIC_API_KEY**: Get from https://console.anthropic.com/

### 3. Database Setup (Neon)

1. Deploy to Vercel (see deployment section below)
2. Add Neon Postgres integration in Vercel
3. Run the schema from `lib/db/schema.sql` in Neon SQL Editor

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Key Features

### CV Tailoring
- Enter CV information (experience, education, skills, projects)
- Add job role descriptions
- AI suggests tailored summaries, highlighted experience, and improvements
- Match score (0-100) for role fit

### Skills Assessment
- Track technical, creative, production, and soft skills
- Self-rate proficiency (1-5)
- Monitor improvement over time

### Interview Coaching
- Practice with film industry-specific questions
- Record audio or write text answers
- Get AI feedback on strengths and improvements
- Track progress across categories

## Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial CV Coach setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cv-coach.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Add environment variables:
   - `NEXTAUTH_SECRET`
   - `ANTHROPIC_API_KEY`
   - `NEXTAUTH_URL` (your Vercel URL)
4. Deploy

### 3. Add Neon Postgres

1. In Vercel project → **Storage** tab
2. Connect **Neon** database
3. Run schema from `lib/db/schema.sql`

## AI Coaching Cost Estimate

With Claude 3.5 Sonnet:
- CV tailoring: ~$0.006 per request
- Interview feedback: ~$0.0045 per request
- **Monthly estimate**: ~$0.30 for active use (10 CV sessions + 50 interview practices)

## Security

- API key stored securely in Vercel environment variables
- All AI requests go through server-side API routes
- Single-user authentication system

## License

Private use - All rights reserved
