@echo off
echo ===================================================
echo  Satisfactories - Game Data Update Utility
echo ===================================================
echo.
echo This script will fetch the latest game data from the Satisfactory wiki.
echo.
echo Starting data fetch process...
echo.
node src/scripts/runImport.js --fetch-only
echo.
echo ===================================================
echo  Data fetch process completed!
echo ===================================================
echo.
echo The game data has been updated in the src/data directory.
echo.
echo Press any key to exit...
pause > nul 