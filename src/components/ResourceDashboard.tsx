import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export type ResourceTotal = {
  id: string;
  name: string;
  rate: number;
  icon?: string;
};

type ResourceDashboardProps = {
  inputTotals: ResourceTotal[];
  outputTotals: ResourceTotal[];
};

export function ResourceDashboard({ inputTotals, outputTotals }: ResourceDashboardProps) {
  const formatRate = (rate: number) => {
    return `${rate}/min`;
  };

  const getTotalRate = (resources: ResourceTotal[]) => {
    return resources.reduce((total, resource) => total + resource.rate, 0);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Inputs
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatRate(getTotalRate(inputTotals))} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inputTotals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inputs configured</p>
          ) : (
            <div className="space-y-2">
              {inputTotals.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {resource.icon && (
                      <img 
                        src={resource.icon} 
                        alt={resource.name} 
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="text-sm font-medium">{resource.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatRate(resource.rate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Outputs
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatRate(getTotalRate(outputTotals))} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outputTotals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outputs configured</p>
          ) : (
            <div className="space-y-2">
              {outputTotals.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {resource.icon && (
                      <img 
                        src={resource.icon} 
                        alt={resource.name} 
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="text-sm font-medium">{resource.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatRate(resource.rate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 