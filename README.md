# Gloop - Social Media App

A fun social media website where users can give each other "gloops" and compete on leaderboards.

## Features

- **Global & Daily Leaderboards**: See who has the most gloops all-time and today
- **User Search**: Search for any user by name
- **Real-time Updates**: Gloop counts update automatically every 5 seconds
- **Invite System**: Invite friends to get 10x Gloop Boost for 1 minute
- **Mobile Responsive**: Works great on desktop and mobile
- **Purple Theme**: Clean, modern design with purple accents

## Setup Instructions

1. **Clone the project**
   ```bash
   cd gloop-app
   npm install
   ```

2. **Set up Supabase Database**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the SQL from `database-setup.sql`
   - Get your project URL and API keys from Settings > API

3. **Configure Environment Variables**
   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel**
   - Connect your GitHub repo to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy!

## How It Works

1. **Sign Up**: Users enter email, first name, and last name
2. **Give Gloops**: Click on anyone's name to give them a gloop
3. **Leaderboards**: Global shows all-time leaders, Daily shows today's leaders
4. **Invite Friends**: Generate unique invite links that give you gloop boosts
5. **Real-time Updates**: All gloop counts update automatically

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Real-time**: Polling every 5 seconds

## Database Schema

- **users**: Store user info and gloop counts
- **gloops**: Track individual gloop events
- **invite_links**: Manage invite codes and usage

The app is designed to be simple, fun, and engaging with satisfying click animations and real-time competitive elements!

