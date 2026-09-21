# Triple S Production — ATS
**Applicant Tracking System** — Internal hiring tool for Triple S Production

---

## Local Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
npm run dev
```

### 3. Open in browser
```
http://localhost:3000
```

That's it. No database, no env vars needed for local testing.

---

## What's included

| Module | Description |
|---|---|
| **Dashboard** | Stats, top candidates, role breakdown, recent activity |
| **Candidates** | Full table with 7 filters: role, status, city, gender, age, experience, search |
| **Upload** | Bulk PDF drag-and-drop, client-side parsing via pdf.js, auto role detection & scoring |
| **Contracts** | 6 agency-grade agreements with rich text editor and PDF export |
| **Roles** | 12 pre-loaded roles + Add Role feature |

---

## Scoring Algorithm

| Parameter | Weight |
|---|---|
| Skills Match (keywords vs resume) | 40% |
| Experience Level | 25% |
| Education | 20% |
| Profile Completeness | 15% |

Score range: **0–100**
- 🟢 70–100: Strong candidate
- 🟡 45–69: Decent candidate  
- 🔴 0–44: Weak candidate

---

## Pre-loaded Roles
1. Web/App Developer (Full-time)
2. Dev Intern
3. Graphic Designer
4. Video Editor
5. Digital Marketer
6. Social Media Manager
7. Sales Executive
8. Performance Marketer
9. Content Strategist
10. Model (Male)
11. Model (Female)
12. Cameraman

---

## Production (Supabase + Vercel)

When ready to go live:
1. Create a Supabase project
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run the SQL migration (provided separately)
4. Deploy to Vercel via GitHub

---

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom CSS variables
- **PDF Parsing**: pdf.js (client-side)
- **State**: React Context
- **Fonts**: Syne + DM Mono (Google Fonts)
