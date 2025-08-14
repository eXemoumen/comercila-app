# Technology Stack

## Framework & Runtime
- **Next.js 15.2.4** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety and development experience
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **CSS Variables** - Theme customization

## Database & Storage
- **Supabase** - Backend as a Service (PostgreSQL)
- **Hybrid Storage** - Local storage + Supabase sync
- **Migration System** - Data migration utilities

## Charts & Visualization
- **Recharts** - Chart library for analytics
- **Leaflet** - Map integration for location features

## Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Turbopack** - Fast bundler (dev mode)

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Development Server
- Default port: `http://localhost:3000`
- Uses Turbopack for faster development builds

## Key Dependencies
- **@supabase/supabase-js** - Supabase client
- **html2canvas & jspdf** - PDF generation
- **uuid** - Unique identifier generation
- **class-variance-authority** - Component variant management
- **clsx & tailwind-merge** - Conditional styling utilities

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Build Configuration
- TypeScript strict mode enabled
- Path aliases configured (`@/*` → `./src/*`)
- ES2017 target for broad compatibility