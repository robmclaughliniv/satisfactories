# Satisfactories - Game Data Import

## What We've Accomplished

We've created a robust system for importing Satisfactory game data from the official wiki into the application:

1. **Data Fetching**:
   - Created a script that fetches the latest game data from the Satisfactory wiki
   - Implemented error handling to gracefully handle API failures
   - Added fallback mechanisms to use existing data if fetching fails

2. **Data Processing**:
   - Implemented parsers for the JSON data format from the wiki
   - Created data models for items, recipes, and buildings
   - Added validation to ensure data integrity

3. **Database Integration**:
   - Created Prisma models for game data
   - Implemented import scripts to populate the database
   - Added relationship handling for complex data structures (recipes, ingredients, etc.)

4. **User Interface**:
   - Created a user-friendly batch file for updating game data
   - Added clear instructions in the README
   - Implemented progress reporting during the import process

## How to Use

### Fetching Game Data Only

To fetch the latest game data from the wiki without importing it to the database:

```bash
npm run update:game-data
```

or double-click the `update-game-data.bat` file.

### Full Import Process

To fetch the latest game data and import it into your database:

```bash
npm run import:game-data
```

or double-click the `import-game-data.bat` file.

## Next Steps

1. **Database Setup**: Configure your PostgreSQL database with the correct credentials in the `.env` file.
2. **Data Exploration**: Use the `/game-data` page to browse and search the imported game data.
3. **Application Integration**: Connect your application models to the game data using the provided API endpoints.

## Troubleshooting

- If you encounter database connection errors, check your PostgreSQL credentials in the `.env` file.
- If the wiki API is unavailable, the script will use existing data files if available.
- For TypeScript errors, we've provided JavaScript versions of the import scripts that avoid type issues.