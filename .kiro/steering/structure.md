# Project Structure

## Root Directory
```
├── .env.local              # Environment variables (Supabase config)
├── .kiro/                  # Kiro IDE configuration and steering
├── package.json            # Dependencies and scripts
├── next.config.ts          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── components.json         # shadcn/ui configuration
├── schema.sql              # Database schema
├── prd.md                  # Product Requirements Document
└── public/                 # Static assets (icons, images)
```

## Source Structure (`src/`)
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main dashboard (single-page app)
│   ├── globals.css         # Global styles
│   ├── find-supermarkets/  # Supermarket finder page
│   └── pending-payments/   # Pending payments page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── InvoiceModal.tsx    # Invoice generation
│   ├── MigrationModal.tsx  # Data migration
│   ├── LeafletMapComponent.tsx # Map integration
│   └── *.tsx               # Other feature components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # General utilities
├── types/                  # TypeScript type definitions
│   ├── index.ts            # Main types
│   └── supabase.ts         # Supabase-specific types
└── utils/                  # Business logic utilities
    ├── hybridStorage.ts    # Hybrid storage system
    ├── storage.ts          # Local storage utilities
    ├── supabaseStorage.ts  # Supabase operations
    ├── migration.ts        # Data migration logic
    └── *.ts                # Other utilities
```

## Architecture Patterns

### Single Page Application
- Main app logic in `src/app/page.tsx`
- Tab-based navigation within single page
- State management using React hooks

### Hybrid Storage Pattern
- **Primary**: Local storage for offline capability
- **Secondary**: Supabase for data persistence and sync
- **Migration**: Automatic data migration between storage systems

### Component Organization
- **UI Components**: Reusable shadcn/ui components in `components/ui/`
- **Feature Components**: Business-specific components in `components/`
- **Page Components**: Route-specific components in `app/`

### Type Safety
- Centralized types in `src/types/`
- Separate Supabase types for database schema
- Shared types across storage utilities

### Utility Organization
- **Storage Layer**: Abstracted storage operations
- **Business Logic**: Domain-specific utilities
- **UI Utilities**: Component and styling helpers

## Key Conventions
- Use TypeScript for all source files
- Follow Next.js App Router patterns
- Implement responsive design with Tailwind
- Maintain French language consistency
- Use hybrid storage for data persistence
- Implement proper error handling and loading states