# ProjectPro - Project Management Application

ProjectPro is a comprehensive project management application built with React, TypeScript, and Supabase.

## Features

- User authentication with Supabase Auth
- Project management with tasks and subtasks
- Real-time updates
- Team collaboration
- Dashboard with project statistics

## Setup Instructions

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file based on `.env.example` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Run the development server with `npm run dev`

## Supabase Setup

1. Create a new Supabase project
2. Execute the migration scripts in the `supabase/migrations` folder
3. Set up authentication with email/password providers
4. Create users through the Supabase dashboard or API

## Test Users

For testing purposes, you can use these credentials:
- Email: nickole@cannabizcredit.com
- Password: Cannabiz1!

- Email: dhruval@golakiya.com
- Password: Cannabiz1!

## Project Structure

- `src/components`: UI components
- `src/context`: Application state management
- `src/data`: Data handling logic
- `src/lib`: Utilities and libraries
- `src/pages`: Application pages
- `src/types`: TypeScript type definitions

## Technologies Used

- React
- TypeScript
- Supabase (Auth, Database)
- Tailwind CSS
- React Router
- Lucide React (icons)