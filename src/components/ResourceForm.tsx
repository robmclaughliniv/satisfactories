import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

type Item = {
  id: string;
  name: string;
  icon?: string;
};

type Factory = {
  id: string;
  name: string;
};

type ResourceFormProps = {
  items: Item[];
  factories: Factory[];
  onAddInput: (data: { itemId: string; rate: number; factoryOriginId?: string }) => Promise<void>;
  onAddOutput: (data: { itemId: string; rate: number; factoryDestinationId?: string }) => Promise<void>;
  isLoading: boolean;
};

export function ResourceForm({
  items,
  factories,
  onAddInput,
  onAddOutput,
  isLoading,
}: ResourceFormProps) {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('none');

  const resetForm = () => {
    setSelectedItemId('');
    setRate('');
    setSelectedFactoryId('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemId || !rate) return;
    
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) return;
    
    try {
      if (activeTab === 'input') {
        await onAddInput({
          itemId: selectedItemId,
          rate: rateValue,
          factoryOriginId: selectedFactoryId && selectedFactoryId !== 'none' ? selectedFactoryId : undefined,
        });
      } else {
        await onAddOutput({
          itemId: selectedItemId,
          rate: rateValue,
          factoryDestinationId: selectedFactoryId && selectedFactoryId !== 'none' ? selectedFactoryId : undefined,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Resource</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'input' | 'output')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item">Item</Label>
              <Select
                value={selectedItemId}
                onValueChange={setSelectedItemId}
              >
                <SelectTrigger id="item">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        {item.icon && (
                          <img 
                            src={item.icon} 
                            alt={item.name} 
                            className="h-4 w-4 object-contain"
                          />
                        )}
                        {item.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (per minute)</Label>
              <Input
                id="rate"
                type="number"
                min="0.1"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="factory">
                {activeTab === 'input' ? 'Source Factory (optional)' : 'Destination Factory (optional)'}
              </Label>
              <Select
                value={selectedFactoryId}
                onValueChange={setSelectedFactoryId}
              >
                <SelectTrigger id="factory">
                  <SelectValue placeholder="Select a factory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {factories.map((factory) => (
                    <SelectItem key={factory.id} value={factory.id}>
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" disabled={isLoading || !selectedItemId || !rate}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${activeTab === 'input' ? 'Input' : 'Output'}`
              )}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
} 