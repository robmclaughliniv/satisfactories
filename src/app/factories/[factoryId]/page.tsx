'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2 } from 'lucide-react';
import { ResourceDashboard, ResourceTotal } from '@/components/ResourceDashboard';
import { ResourceForm } from '@/components/ResourceForm';
import { ResourceList } from '@/components/ResourceList';

export default function FactoryDetailPage({ params }: { params: { factoryId: string } }) {
  const router = useRouter();
  const [factory, setFactory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Resource states
  const [inputResources, setInputResources] = useState<any[]>([]);
  const [outputResources, setOutputResources] = useState<any[]>([]);
  const [inputTotals, setInputTotals] = useState<ResourceTotal[]>([]);
  const [outputTotals, setOutputTotals] = useState<ResourceTotal[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch factory data
        const factoryResponse = await fetch(`/api/factories/${params.factoryId}`);
        if (!factoryResponse.ok) throw new Error('Failed to fetch factory');
        const factoryData = await factoryResponse.json();
        setFactory(factoryData);
        
        // Fetch resource inputs
        const inputsResponse = await fetch(`/api/factories/${params.factoryId}/resource-inputs`);
        if (!inputsResponse.ok) throw new Error('Failed to fetch resource inputs');
        const inputsData = await inputsResponse.json();
        
        // Extract input resources
        const inputResourcesList = inputsData.flatMap((input: any) => 
          input.resources.map((resource: any) => ({
            ...resource,
            resourceInputId: input.id,
          }))
        );
        setInputResources(inputResourcesList);
        
        // Calculate input totals
        const inputTotalMap = new Map<string, ResourceTotal>();
        inputResourcesList.forEach((resource: any) => {
          const { item, rate } = resource;
          if (inputTotalMap.has(item.id)) {
            const existing = inputTotalMap.get(item.id)!;
            inputTotalMap.set(item.id, {
              ...existing,
              rate: existing.rate + rate,
            });
          } else {
            inputTotalMap.set(item.id, {
              id: item.id,
              name: item.name,
              rate,
              icon: item.icon,
            });
          }
        });
        setInputTotals(Array.from(inputTotalMap.values()));
        
        // Fetch resource outputs
        const outputsResponse = await fetch(`/api/factories/${params.factoryId}/resource-outputs`);
        if (!outputsResponse.ok) throw new Error('Failed to fetch resource outputs');
        const outputsData = await outputsResponse.json();
        
        // Extract output resources
        const outputResourcesList = outputsData.flatMap((output: any) => 
          output.resources.map((resource: any) => ({
            ...resource,
            resourceOutputId: output.id,
          }))
        );
        setOutputResources(outputResourcesList);
        
        // Calculate output totals
        const outputTotalMap = new Map<string, ResourceTotal>();
        outputResourcesList.forEach((resource: any) => {
          const { item, rate } = resource;
          if (outputTotalMap.has(item.id)) {
            const existing = outputTotalMap.get(item.id)!;
            outputTotalMap.set(item.id, {
              ...existing,
              rate: existing.rate + rate,
            });
          } else {
            outputTotalMap.set(item.id, {
              id: item.id,
              name: item.name,
              rate,
              icon: item.icon,
            });
          }
        });
        setOutputTotals(Array.from(outputTotalMap.values()));
        
        // Fetch items
        const itemsResponse = await fetch('/api/game-data?type=items');
        if (!itemsResponse.ok) throw new Error('Failed to fetch items');
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
        
        // Fetch factories
        const factoriesResponse = await fetch('/api/factories');
        if (!factoriesResponse.ok) throw new Error('Failed to fetch factories');
        const factoriesData = await factoriesResponse.json();
        setFactories(factoriesData.filter((f: any) => f.id !== params.factoryId));
        
      } catch (err: any) {
        console.error('Error fetching factory data:', err);
        setError(err.message || 'Failed to load factory data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [params.factoryId]);

  const handleDeleteFactory = async () => {
    if (!confirm('Are you sure you want to delete this factory?')) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/factories/${params.factoryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete factory');
      
      router.push('/factories');
    } catch (err: any) {
      console.error('Error deleting factory:', err);
      alert('Failed to delete factory');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddInput = async (data: { itemId: string; rate: number; factoryOriginId?: string }) => {
    try {
      setIsAddingResource(true);
      const response = await fetch(`/api/factories/${params.factoryId}/resource-inputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to add input resource');
      
      const result = await response.json();
      
      // Update input resources
      setInputResources([...inputResources, { 
        ...result.inputResource,
        resourceInputId: result.resourceInput.id,
      }]);
      
      // Update input totals
      const item = items.find(i => i.id === data.itemId);
      const newTotal = { 
        id: item.id, 
        name: item.name, 
        rate: data.rate,
        icon: item.icon,
      };
      
      setInputTotals(prev => {
        const existing = prev.find(t => t.id === item.id);
        if (existing) {
          return prev.map(t => t.id === item.id 
            ? { ...t, rate: t.rate + data.rate } 
            : t
          );
        }
        return [...prev, newTotal];
      });
      
    } catch (err: any) {
      console.error('Error adding input resource:', err);
      alert('Failed to add input resource');
    } finally {
      setIsAddingResource(false);
    }
  };

  const handleAddOutput = async (data: { itemId: string; rate: number; factoryDestinationId?: string }) => {
    try {
      setIsAddingResource(true);
      const response = await fetch(`/api/factories/${params.factoryId}/resource-outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to add output resource');
      
      const result = await response.json();
      
      // Update output resources
      setOutputResources([...outputResources, { 
        ...result.outputResource,
        resourceOutputId: result.resourceOutput.id,
      }]);
      
      // Update output totals
      const item = items.find(i => i.id === data.itemId);
      const newTotal = { 
        id: item.id, 
        name: item.name, 
        rate: data.rate,
        icon: item.icon,
      };
      
      setOutputTotals(prev => {
        const existing = prev.find(t => t.id === item.id);
        if (existing) {
          return prev.map(t => t.id === item.id 
            ? { ...t, rate: t.rate + data.rate } 
            : t
          );
        }
        return [...prev, newTotal];
      });
      
    } catch (err: any) {
      console.error('Error adding output resource:', err);
      alert('Failed to add output resource');
    } finally {
      setIsAddingResource(false);
    }
  };

  const handleDeleteInputResource = async (id: string) => {
    try {
      setIsDeletingResource(true);
      setDeletingResourceId(id);
      
      const resource = inputResources.find(r => r.id === id);
      if (!resource) return;
      
      const response = await fetch(`/api/input-resources/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete input resource');
      
      // Update input resources
      setInputResources(inputResources.filter(r => r.id !== id));
      
      // Update input totals
      setInputTotals(prev => {
        const item = resource.item;
        const existing = prev.find(t => t.id === item.id);
        
        if (existing && existing.rate === resource.rate) {
          return prev.filter(t => t.id !== item.id);
        }
        
        return prev.map(t => t.id === item.id 
          ? { ...t, rate: t.rate - resource.rate } 
          : t
        );
      });
      
    } catch (err: any) {
      console.error('Error deleting input resource:', err);
      alert('Failed to delete input resource');
    } finally {
      setIsDeletingResource(false);
      setDeletingResourceId(null);
    }
  };

  const handleDeleteOutputResource = async (id: string) => {
    try {
      setIsDeletingResource(true);
      setDeletingResourceId(id);
      
      const resource = outputResources.find(r => r.id === id);
      if (!resource) return;
      
      const response = await fetch(`/api/output-resources/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete output resource');
      
      // Update output resources
      setOutputResources(outputResources.filter(r => r.id !== id));
      
      // Update output totals
      setOutputTotals(prev => {
        const item = resource.item;
        const existing = prev.find(t => t.id === item.id);
        
        if (existing && existing.rate === resource.rate) {
          return prev.filter(t => t.id !== item.id);
        }
        
        return prev.map(t => t.id === item.id 
          ? { ...t, rate: t.rate - resource.rate } 
          : t
        );
      });
      
    } catch (err: any) {
      console.error('Error deleting output resource:', err);
      alert('Failed to delete output resource');
    } finally {
      setIsDeletingResource(false);
      setDeletingResourceId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold">Loading factory...</div>
          <div className="mt-2 text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  if (error || !factory) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-destructive">Error</div>
          <div className="mt-2 text-muted-foreground">
            {error || 'Factory not found'}
          </div>
          <Button asChild className="mt-4">
            <Link href="/factories">Back to Factories</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{factory.name}</h1>
          <p className="text-muted-foreground">
            {factory.description || 'No description provided'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/factories/${params.factoryId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteFactory}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />
      
      {/* Resource Dashboard */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Resource Dashboard</h2>
        <ResourceDashboard 
          inputTotals={inputTotals} 
          outputTotals={outputTotals} 
        />
      </div>
      
      <Separator />
      
      {/* Resource Management */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <ResourceList
            title="Input Resources"
            resources={inputResources}
            onDelete={handleDeleteInputResource}
            isDeleting={isDeletingResource}
            deletingId={deletingResourceId}
          />
        </div>
        
        <div className="space-y-6">
          <ResourceList
            title="Output Resources"
            resources={outputResources}
            onDelete={handleDeleteOutputResource}
            isDeleting={isDeletingResource}
            deletingId={deletingResourceId}
          />
        </div>
      </div>
      
      <Separator />
      
      {/* Add Resource Form */}
      <div className="max-w-md mx-auto">
        <ResourceForm
          items={items}
          factories={factories}
          onAddInput={handleAddInput}
          onAddOutput={handleAddOutput}
          isLoading={isAddingResource}
        />
      </div>
      
      <Separator />

      {/* Buildings Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Buildings</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {factory.buildings && factory.buildings.length > 0 ? (
            factory.buildings.map((building: any) => (
              <Card key={building.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">
                    {building.name}
                  </CardTitle>
                  <CardDescription>
                    {building.type || 'No type specified'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div>Quantity: {building.quantity}</div>
                    {building.powerConsumption && (
                      <div>Power: {building.powerConsumption} MW</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground">
              No buildings added to this factory yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 