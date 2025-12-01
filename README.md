# Lab Management System

A Next.js 16 web application for managing lab guides with SSH terminal access, featuring admin authentication, Authentik OAuth integration, and a modern UI with light/dark mode support.

## Features

- **Admin User Management**: Built-in admin user with forced password change on first login
- **OAuth Integration**: Configure Authentik as an OAuth provider for user authentication
- **Lab Guide Management**: Create, edit, and publish lab guides with rich text editor
- **SSH Terminal**: Browser-based terminal connections to external hosts
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Theme Support**: Light and dark mode with system preference detection
- **Docker Support**: Production-ready Docker container setup

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
- Docker (optional, for containerized deployment)

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
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: SQLite database path
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: A random secret key
- `ENCRYPTION_KEY`: A key for encrypting SSH credentials

4. Initialize the database and create admin user:
```bash
npm run prisma:migrate
npm run init-admin
```

5. Generate Prisma Client:
```bash
npm run prisma:generate
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8950`.

### Default Admin Credentials

- **Email**: admin@lab.local
- **Password**: Password123

**Important**: You must change the password on first login.

## Docker Deployment

### Build and Run

1. Build the Docker image:
```bash
docker build -t lab-management .
```

2. Run the container:
```bash
docker run -p 8950:8950 \
  -e DATABASE_URL=file:./prisma/dev.db \
  -e NEXTAUTH_URL=http://localhost:8950 \
  -e NEXTAUTH_SECRET=your-secret-key \
  -e ENCRYPTION_KEY=your-encryption-key \
  lab-management
```

Or use docker-compose:
```bash
docker-compose up -d
```

### Initializing Admin User in Docker

After the container starts, initialize the admin user:
```bash
docker exec -it <container-id> npm run init-admin
```

Or call the API endpoint:
```bash
curl -X POST http://localhost:8950/api/init
```

## Configuration

### Authentik OAuth Setup

1. Log in as admin
2. Navigate to Admin → OAuth Settings
3. Enter your Authentik configuration:
   - Issuer URL: Your Authentik instance URL
   - Client ID: From your Authentik OAuth application
   - Client Secret: From your Authentik OAuth application
   - Authorization URL: `https://your-authentik-instance/application/o/authorize/`
   - Token URL: `https://your-authentik-instance/application/o/token/`
   - User Info URL: `https://your-authentik-instance/application/o/userinfo/`

### SSH Credentials

1. Navigate to Admin → SSH Credentials
2. Click "Add Credential"
3. Enter SSH connection details:
   - Name: Display name for the credential
   - Host: SSH server hostname or IP
   - Port: SSH port (default: 22)
   - Username: SSH username
   - Password or Private Key: Authentication method

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
│   └── generated/         # Prisma generated files
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
- Use strong `NEXTAUTH_SECRET` and `ENCRYPTION_KEY` values
- Keep SSH credentials encrypted in the database
- Use HTTPS in production
- Regularly update dependencies

## License

[Your License Here]
