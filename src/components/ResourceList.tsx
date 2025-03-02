import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

type Resource = {
  id: string;
  rate: number;
  item: {
    id: string;
    name: string;
    icon?: string;
  };
  factoryOrigin?: {
    id: string;
    name: string;
  } | null;
  factoryDestination?: {
    id: string;
    name: string;
  } | null;
};

type ResourceListProps = {
  title: string;
  resources: Resource[];
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
  deletingId: string | null;
};

export function ResourceList({
  title,
  resources,
  onDelete,
  isDeleting,
  deletingId,
}: ResourceListProps) {
  const formatRate = (rate: number) => {
    return `${rate}/min`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No resources configured</p>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {resource.item.icon && (
                      <img
                        src={resource.item.icon}
                        alt={resource.item.name}
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="font-medium">{resource.item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatRate(resource.rate)}
                    </span>
                  </div>
                  
                  {(resource.factoryOrigin || resource.factoryDestination) && (
                    <div className="text-xs text-muted-foreground">
                      {resource.factoryOrigin && (
                        <span>Source: {resource.factoryOrigin.name}</span>
                      )}
                      {resource.factoryDestination && (
                        <span>Destination: {resource.factoryDestination.name}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(resource.id)}
                  disabled={isDeleting}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                >
                  {isDeleting && deletingId === resource.id ? (
                    <span className="h-4 w-4 animate-spin">⏳</span>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 