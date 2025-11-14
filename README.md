# Life Tracker MVP

A minimal, elegant life tracking application built with Next.js 14, Supabase, and TailwindCSS.

## Features

- **Morning Form** (`/manana`) - Track sleep, emotions, morning routine, exercise, and daily goals
- **Afternoon Form** (`/tarde`) - Record afternoon emotions, study sessions, and temptations
- **Night Form** (`/noche`) - Close your day with evening routine, reflections, and insights
- **Temptation Form** (`/tentacion`) - Quick 10-second temptation logging
- **Dashboard** (`/dashboard`) - Central hub for all forms and navigation

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application expects the following Supabase tables:

- `fact_habitos_diarios` - Main fact table with daily records
- `dim_rutina_morning` - Morning routine dimension
- `dim_rutina_night` - Night routine dimension
- `dim_estado_emocional` - Emotional state dimension
- `dim_estudio` - Study session dimension
- `dim_tentacion` - Temptation dimension
- `dim_ejercicio` - Exercise dimension

## Authentication

The app uses Supabase Auth with magic link (OTP) email authentication. Users receive an email with a login link.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Supabase** - Authentication and database
- **TailwindCSS** - Styling
- **React Hook Form** - Form management
- **Heroicons** - Icon library

## Project Structure

```
/app
  /login          - Authentication page
  /dashboard      - Main dashboard
  /manana         - Morning form
  /tarde          - Afternoon form
  /noche          - Night form
  /tentacion      - Temptation form
/components       - Reusable UI components
/lib              - Utility functions and Supabase client
```

## Notes

- All forms automatically create or update the fact record for the current date
- Dimension tables are created on-the-fly when submitting forms
- The app uses `auth.uid()` to identify users
- All routes are protected and redirect to `/login` if not authenticated

