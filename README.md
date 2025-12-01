# Lab Management System

A Next.js 16 web application for managing lab guides with SSH terminal access, featuring admin authentication, Authentik OAuth integration, and a modern UI with light/dark mode support.

## Features

- **Admin User Management**: Built-in admin user with forced password change on first login
- **OAuth Integration**: Configure Authentik as an OAuth provider for user authentication
- **Lab Guide Management**: Create, edit, and publish lab guides with rich text editor
- **SSH Terminal**: Browser-based terminal connections to external hosts
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Theme Support**: Light and dark mode with system preference detection
- **Docker Support**: Simple single-stage Docker container setup for Raspberry Pi 5

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui with Tailwind CSS
- **Theme**: next-themes
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: SQLite with Prisma ORM
- **Rich Text Editor**: Tiptap
- **Terminal**: xterm.js
- **SSH**: ssh2

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker (for containerized deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ojohnsenCloudian/lab_managemnet.git
cd lab_managemnet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file:
```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:8950"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
ENCRYPTION_KEY="your-encryption-key-change-in-production"
```

4. Initialize the database:
```bash
npm run prisma:migrate
npm run init-admin
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8950`.

### Default Admin Credentials

- **Email**: admin@lab.local
- **Password**: Password123

**Important**: You must change the password on first login.

## Docker Deployment

### Build for Raspberry Pi 5 (ARM64)

```bash
./build-rpi.sh
```

### Run the container:
```bash
docker run -p 8950:8950 \
  -e DATABASE_URL="file:./prisma/dev.db" \
  -e NEXTAUTH_URL="http://localhost:8950" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e ENCRYPTION_KEY="your-encryption-key" \
  -v $(pwd)/prisma/dev.db:/app/prisma/dev.db \
  lab-management
```

## Usage

### Admin Features

- **Dashboard**: Overview of guides, users, SSH credentials, and OAuth status
- **Lab Guides**: Create, edit, and publish lab guides
- **OAuth Settings**: Configure Authentik OAuth provider
- **SSH Credentials**: Manage SSH credentials for terminal access
- **Users**: View all users in the system

### User Features

- **Lab Guides**: Browse and view published lab guides
- **Terminal Access**: Connect to SSH terminals configured in lab guides
- **Step-by-step Instructions**: Follow guided instructions in lab guides

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages
│   ├── guides/            # User-facing guide pages
│   ├── login/             # Authentication pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── guides/            # Lab guide components
│   └── terminal/          # SSH terminal components
├── src/
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript type definitions
├── prisma/                # Prisma schema and migrations
├── scripts/               # Utility scripts
└── Dockerfile             # Docker configuration
```

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run init-admin`: Create admin user
- `npm run prisma:generate`: Generate Prisma Client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:studio`: Open Prisma Studio

## Security Notes

- Change default admin password immediately
- Use strong encryption keys in production
- Keep OAuth secrets secure
- SSH credentials are encrypted in the database
