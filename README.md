# Satisfactories

The ultimate planning tool for Satisfactory, the factory-building game. This web application helps you keep track of your in-game worlds and factories—from managing production rates and resource flows to planning future builds.

## Features

- **World Management**: Track multiple game worlds and their resources
- **Factory Planning**: Design and optimize your factories for maximum efficiency
- **Recipe Browser**: Access all in-game recipes and plan your production lines
- **Resource Tracking**: Map and manage resource nodes across your world
- **Production Analytics**: Analyze your factory performance and identify bottlenecks

## Tech Stack

- **Next.js**: Server-rendered React application
- **PostgreSQL**: Database for storing game data
- **Prisma**: ORM for database access
- **Tailwind CSS**: Utility-first CSS framework for styling
- **TypeScript**: Type-safe JavaScript
- **Jest & Playwright**: Testing frameworks

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/satisfactory-planner.git
   cd satisfactory-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL connection string

4. Set up the database:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Database Management

- Generate Prisma client: `npm run prisma:generate`
- Create a migration: `npm run prisma:migrate`
- Open Prisma Studio: `npm run prisma:studio`

### Testing

- Run unit tests: `npm test`
- Run end-to-end tests: `npm run test:e2e`

## Deployment

The application can be deployed to any platform that supports Next.js applications, such as Vercel, Netlify, or a custom server.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Satisfactory](https://www.satisfactorygame.com/) - The game that inspired this project
- [Coffee Stain Studios](https://www.coffeestainstudios.com/) - Developers of Satisfactory
