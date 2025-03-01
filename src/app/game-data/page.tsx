'use client';

import { useState } from 'react';
import GameDataBrowser from '@/components/GameDataBrowser';

type GameItem = {
  className: string;
  name: string;
  description?: string;
};

type GameRecipe = {
  className: string;
  name: string;
  inputs: any[];
  outputs: any[];
};

type GameBuilding = {
  className: string;
  name: string;
  description?: string;
};

export default function GameDataPage() {
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<GameRecipe | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<GameBuilding | null>(null);
  const [creationStatus, setCreationStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Handle creating an item from game data
  const handleCreateItem = async () => {
    if (!selectedItem) return;
    
    try {
      const response = await fetch('/api/connect-game-data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'item',
          gameClassName: selectedItem.className,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCreationStatus({
          success: true,
          message: `Successfully created item: ${data.result.name}`,
        });
      } else {
        setCreationStatus({
          success: false,
          message: data.error || 'Failed to create item',
        });
      }
    } catch (error) {
      setCreationStatus({
        success: false,
        message: 'An error occurred while creating the item',
      });
    }
  };

  // Handle creating a recipe from game data
  const handleCreateRecipe = async () => {
    if (!selectedRecipe) return;
    
    try {
      const response = await fetch('/api/connect-game-data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'recipe',
          gameClassName: selectedRecipe.className,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCreationStatus({
          success: true,
          message: `Successfully created recipe: ${data.result.name}`,
        });
      } else {
        setCreationStatus({
          success: false,
          message: data.error || 'Failed to create recipe',
        });
      }
    } catch (error) {
      setCreationStatus({
        success: false,
        message: 'An error occurred while creating the recipe',
      });
    }
  };

  // Handle creating a building from game data
  const handleCreateBuilding = async (factoryId: string) => {
    if (!selectedBuilding || !factoryId) return;
    
    try {
      const response = await fetch('/api/connect-game-data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'building',
          gameClassName: selectedBuilding.className,
          factoryId,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCreationStatus({
          success: true,
          message: `Successfully created building: ${data.result.name}`,
        });
      } else {
        setCreationStatus({
          success: false,
          message: data.error || 'Failed to create building',
        });
      }
    } catch (error) {
      setCreationStatus({
        success: false,
        message: 'An error occurred while creating the building',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Satisfactory Game Data</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <GameDataBrowser
            onSelectItem={setSelectedItem}
            onSelectRecipe={setSelectedRecipe}
            onSelectBuilding={setSelectedBuilding}
          />
        </div>
        
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Selected Data</h2>
            
            {/* Status message */}
            {creationStatus && (
              <div className={`p-4 mb-4 rounded ${creationStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {creationStatus.message}
              </div>
            )}
            
            {/* Selected item */}
            {selectedItem && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Selected Item</h3>
                <div className="border rounded p-4 mb-4">
                  <p><strong>Name:</strong> {selectedItem.name}</p>
                  <p><strong>Class Name:</strong> {selectedItem.className}</p>
                  {selectedItem.description && (
                    <p><strong>Description:</strong> {selectedItem.description.replace(/<br>/g, ' ')}</p>
                  )}
                </div>
                
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={handleCreateItem}
                >
                  Create Item in App
                </button>
              </div>
            )}
            
            {/* Selected recipe */}
            {selectedRecipe && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Selected Recipe</h3>
                <div className="border rounded p-4 mb-4">
                  <p><strong>Name:</strong> {selectedRecipe.name}</p>
                  <p><strong>Class Name:</strong> {selectedRecipe.className}</p>
                  
                  <div className="mt-2">
                    <p><strong>Inputs:</strong></p>
                    <ul className="list-disc pl-5">
                      {selectedRecipe.inputs?.map((input, index) => (
                        <li key={index}>
                          {input.amount} × {input.item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-2">
                    <p><strong>Outputs:</strong></p>
                    <ul className="list-disc pl-5">
                      {selectedRecipe.outputs?.map((output, index) => (
                        <li key={index}>
                          {output.amount} × {output.item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={handleCreateRecipe}
                >
                  Create Recipe in App
                </button>
              </div>
            )}
            
            {/* Selected building */}
            {selectedBuilding && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Selected Building</h3>
                <div className="border rounded p-4 mb-4">
                  <p><strong>Name:</strong> {selectedBuilding.name}</p>
                  <p><strong>Class Name:</strong> {selectedBuilding.className}</p>
                  {selectedBuilding.description && (
                    <p><strong>Description:</strong> {selectedBuilding.description.replace(/<br>/g, ' ')}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Factory ID (required to create building)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded"
                    placeholder="Enter factory ID"
                    id="factoryId"
                  />
                </div>
                
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => {
                    const factoryId = (document.getElementById('factoryId') as HTMLInputElement).value;
                    if (factoryId) {
                      handleCreateBuilding(factoryId);
                    } else {
                      setCreationStatus({
                        success: false,
                        message: 'Factory ID is required',
                      });
                    }
                  }}
                >
                  Create Building in App
                </button>
              </div>
            )}
            
            {!selectedItem && !selectedRecipe && !selectedBuilding && (
              <p className="text-gray-500">
                Select an item, recipe, or building from the browser to see details and create it in your app.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 