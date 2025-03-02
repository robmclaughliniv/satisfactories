@echo off
echo ===================================================
echo  Satisfactories - Game Data Import Utility
echo ===================================================
echo.
echo This script will:
echo  1. Fetch the latest game data from the Satisfactory wiki
echo  2. Run database migrations
echo  3. Generate the Prisma client
echo  4. Import the game data into your database
echo.
echo Starting import process...
echo.
node src/scripts/runImport.js
echo.
echo ===================================================
echo  Import process completed!
echo ===================================================
echo.
echo If there were no errors, the game data has been imported
echo into your database and is ready to use.
echo.
echo Press any key to exit...
pause > nul 