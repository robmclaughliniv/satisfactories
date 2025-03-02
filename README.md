# Satisfactories

A planning tool for the game Satisfactory.

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

## Game Data Import

This application uses official game data from the Satisfactory wiki. To import or update this data:

### Fetching Latest Game Data

To fetch the latest game data from the Satisfactory wiki:

```bash
npm run update:game-data
```

This will download the latest JSON data for items, recipes, and buildings from the wiki and save it to the `src/data` directory.

### Database Setup

Before importing the game data into your database, you need to set up your PostgreSQL database:

1. Install PostgreSQL if you haven't already
2. Create a new database called `satisfactory_planner`
3. Update the `.env` file with your database credentials:

```
DATABASE_URL="postgresql://username:password@localhost:5432/satisfactory_planner?schema=public"
```

Replace `username` and `password` with your PostgreSQL credentials.

### Importing Game Data to Database

To import the game data into your database:

```bash
npm run import:game-data
```

This will:
1. Fetch the latest game data from the wiki
2. Run Prisma migrations to ensure the database schema is up to date
3. Generate the Prisma client
4. Import all game data into your database

### Accessing Game Data

Once imported, you can browse and use the game data at:

```
/game-data
```

This page allows you to:
- Browse all items, recipes, and buildings from the game
- Search for specific game data
- Create application items, recipes, and buildings based on game data

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
