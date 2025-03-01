# Todo
Now I want to connect the models we have created to real game data. I have found a page with maintained json with all of the recipes, items, buildings, etc in the game. The page is @https://satisfactory.wiki.gg/wiki/Template:DocsRecipes.json?action=edit . I want to pull and parse this json, add schemas for the various recipies, items, buildings, etc and connect them to the models we have created like inputs and outptus which represent things in our app. Once we do this we will have real game data connected to things that are important in my app.

After that, I would like to create migrations for creating tables in our local postgres database. Once we do that we can run the migrations to create all the tables we will need.

Then we will need REST api endpoints in our next.js application for CRUD operations for all of our models so that we can read/write information to our database.

Once that is all done then we will need a script that we can run manually to pull the json, parse, and add/edit information to our database.


Ensure your database connection is properly configured
Run the migration to add the game data models
Run the import script to load the game data