import { useState, useEffect } from 'react';

type GameItem = {
  className: string;
  name: string;
  description?: string;
  stackSize?: number;
  form?: string;
};

type GameRecipe = {
  className: string;
  name: string;
  unlockedBy?: string;
  duration: number;
  alternate?: boolean;
  inputs: {
    id: string;
    amount: number;
    item: GameItem;
  }[];
  outputs: {
    id: string;
    amount: number;
    item: GameItem;
  }[];
  producedIn: {
    id: string;
    building: GameBuilding;
  }[];
};

type GameBuilding = {
  className: string;
  name: string;
  description?: string;
  unlockedBy?: string;
  powerUsage?: number;
  powerGenerated?: number;
};

type GameDataBrowserProps = {
  onSelectItem?: (item: GameItem) => void;
  onSelectRecipe?: (recipe: GameRecipe) => void;
  onSelectBuilding?: (building: GameBuilding) => void;
};

export default function GameDataBrowser({
  onSelectItem,
  onSelectRecipe,
  onSelectBuilding
}: GameDataBrowserProps) {
  const [dataType, setDataType] = useState<'items' | 'recipes' | 'buildings'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<GameItem[]>([]);
  const [recipes, setRecipes] = useState<GameRecipe[]>([]);
  const [buildings, setBuildings] = useState<GameBuilding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data based on type and search query
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams({
          type: dataType,
          ...(searchQuery && { query: searchQuery })
        });
        
        const response = await fetch(`/api/game-data?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (dataType === 'items') {
          setItems(data);
        } else if (dataType === 'recipes') {
          setRecipes(data);
        } else if (dataType === 'buildings') {
          setBuildings(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dataType, searchQuery]);

  // Handle item selection
  const handleItemSelect = (item: GameItem) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  // Handle recipe selection
  const handleRecipeSelect = (recipe: GameRecipe) => {
    if (onSelectRecipe) {
      onSelectRecipe(recipe);
    }
  };

  // Handle building selection
  const handleBuildingSelect = (building: GameBuilding) => {
    if (onSelectBuilding) {
      onSelectBuilding(building);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Game Data Browser</h2>
        
        {/* Data type selector */}
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${dataType === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setDataType('items')}
          >
            Items
          </button>
          <button
            className={`px-4 py-2 rounded ${dataType === 'recipes' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setDataType('recipes')}
          >
            Recipes
          </button>
          <button
            className={`px-4 py-2 rounded ${dataType === 'buildings' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setDataType('buildings')}
          >
            Buildings
          </button>
        </div>
        
        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={`Search ${dataType}...`}
            className="w-full px-4 py-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Results */}
      {!loading && (
        <div className="overflow-y-auto max-h-96">
          {dataType === 'items' && (
            <div className="grid grid-cols-1 gap-4">
              {items.length === 0 ? (
                <p className="text-gray-500">No items found.</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.className}
                    className="border rounded p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleItemSelect(item)}
                  >
                    <h3 className="font-bold">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description.replace(/<br>/g, ' ')}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {item.stackSize && <span className="mr-2">Stack: {item.stackSize}</span>}
                      {item.form && <span>Form: {item.form}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {dataType === 'recipes' && (
            <div className="grid grid-cols-1 gap-4">
              {recipes.length === 0 ? (
                <p className="text-gray-500">No recipes found.</p>
              ) : (
                recipes.map((recipe) => (
                  <div
                    key={recipe.className}
                    className="border rounded p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRecipeSelect(recipe)}
                  >
                    <h3 className="font-bold">{recipe.name}</h3>
                    {recipe.unlockedBy && (
                      <p className="text-sm text-gray-600">Unlocked by: {recipe.unlockedBy.replace(/<br>/g, ' ')}</p>
                    )}
                    <p className="text-sm">Craft time: {recipe.duration}s</p>
                    
                    <div className="mt-2">
                      <h4 className="font-semibold text-sm">Inputs:</h4>
                      <div className="flex flex-wrap gap-2">
                        {recipe.inputs?.map((input) => (
                          <span key={input.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {input.amount} × {input.item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <h4 className="font-semibold text-sm">Outputs:</h4>
                      <div className="flex flex-wrap gap-2">
                        {recipe.outputs?.map((output) => (
                          <span key={output.id} className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {output.amount} × {output.item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <h4 className="font-semibold text-sm">Produced in:</h4>
                      <div className="flex flex-wrap gap-2">
                        {recipe.producedIn?.map((prod) => (
                          <span key={prod.id} className="text-xs bg-green-100 px-2 py-1 rounded">
                            {prod.building.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {dataType === 'buildings' && (
            <div className="grid grid-cols-1 gap-4">
              {buildings.length === 0 ? (
                <p className="text-gray-500">No buildings found.</p>
              ) : (
                buildings.map((building) => (
                  <div
                    key={building.className}
                    className="border rounded p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleBuildingSelect(building)}
                  >
                    <h3 className="font-bold">{building.name}</h3>
                    {building.description && (
                      <p className="text-sm text-gray-600">{building.description.replace(/<br>/g, ' ')}</p>
                    )}
                    {building.unlockedBy && (
                      <p className="text-sm">Unlocked by: {building.unlockedBy.replace(/<br>/g, ' ')}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {building.powerUsage !== undefined && building.powerUsage > 0 && (
                        <span className="mr-2">Power usage: {building.powerUsage} MW</span>
                      )}
                      {building.powerGenerated !== undefined && building.powerGenerated > 0 && (
                        <span>Power generated: {building.powerGenerated} MW</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 