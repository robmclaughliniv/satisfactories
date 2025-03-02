import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Satisfactories</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The ultimate planning tool for Satisfactory, the factory-building game.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Users Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-4">Users</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage users and their Satisfactory game worlds.
          </p>
          <div className="mt-auto">
            <Link 
              href="/users" 
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Users
            </Link>
          </div>
        </div>

        {/* Worlds Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-4">My Worlds</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage your Satisfactory game worlds and track your progress.
          </p>
          <div className="mt-auto">
            <Link 
              href="/worlds" 
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Worlds
            </Link>
          </div>
        </div>

        {/* Factories Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-4">Factories</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Plan and optimize your factories for maximum efficiency.
          </p>
          <div className="mt-auto">
            <Link 
              href="/factories" 
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Factories
            </Link>
          </div>
        </div>

        {/* Recipes Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-4">Recipes</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Browse all available recipes and plan your production lines.
          </p>
          <div className="mt-auto">
            <Link 
              href="/recipes" 
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Recipes
            </Link>
          </div>
        </div>

        {/* Resources Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-4">Resources</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Track resource nodes and manage your resource extraction.
          </p>
          <div className="mt-auto">
            <Link 
              href="/resources" 
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Resources
            </Link>
          </div>
        </div>

        {/* Game Data Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-4">Game Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Browse game data including items, recipes, and buildings.
          </p>
          <div className="mt-auto">
            <Link 
              href="/game-data" 
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Game Data
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
