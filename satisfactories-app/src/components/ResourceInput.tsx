'use client'

import React from 'react'
import { Label, TextInput, Button, Select } from 'flowbite-react'
import { HiTrash } from 'react-icons/hi'
import { ResourceFlow, ResourceType, ResourcePurity, TransportMethod } from '../types/storage'

interface ResourceInputProps {
  resources: ResourceFlow[]
  onChange: (resources: ResourceFlow[]) => void
  type: 'input' | 'output'
  error?: string
}

export function ResourceInput({
  resources,
  onChange,
  type,
  error,
}: ResourceInputProps) {
  const handleAdd = () => {
    onChange([
      ...resources,
      {
        itemId: '',
        resourceType: ResourceType.PART,
        amount: 0,
        rate: 0,
        maxRate: 0,
        efficiency: 100,
        transportMethod: TransportMethod.BELT,
        ...(type === 'input' && { purity: ResourcePurity.NORMAL }),
      },
    ])
  }

  const handleRemove = (index: number) => {
    onChange(resources.filter((_, i) => i !== index))
  }

  const handleChange = (
    index: number,
    field: keyof ResourceFlow,
    value: string | number
  ) => {
    const newResources = [...resources]
    newResources[index] = {
      ...newResources[index],
      [field]:
        field === 'itemId' || field === 'resourceType' || field === 'transportMethod' || field === 'purity'
          ? value
          : Number(value),
    }

    // Auto-calculate efficiency if rate and maxRate are set
    if ((field === 'rate' || field === 'maxRate') && newResources[index].maxRate > 0) {
      newResources[index].efficiency = Math.round(
        (newResources[index].rate / newResources[index].maxRate) * 100
      )
    }

    onChange(newResources)
  }

  const groupId = `${type}-resources`
  const titleId = `${groupId}-title`

  return (
    <div role="group" aria-labelledby={titleId} className="space-y-4">
      {error && (
        <div
          className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}

      {resources.map((resource, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor={`${type}-${index}-item`}>Item ID</Label>
                <TextInput
                  id={`${type}-${index}-item`}
                  value={resource.itemId}
                  onChange={(e) => handleChange(index, 'itemId', e.target.value)}
                  color={error && !resource.itemId.trim() ? 'failure' : undefined}
                />
              </div>

              <div>
                <Label htmlFor={`${type}-${index}-type`}>Resource Type</Label>
                <Select
                  id={`${type}-${index}-type`}
                  value={resource.resourceType}
                  onChange={(e) => handleChange(index, 'resourceType', e.target.value)}
                >
                  {Object.values(ResourceType).map((rt) => (
                    <option key={rt} value={rt}>
                      {rt.charAt(0) + rt.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </div>

              {type === 'input' && (
                <div>
                  <Label htmlFor={`${type}-${index}-purity`}>Purity</Label>
                  <Select
                    id={`${type}-${index}-purity`}
                    value={resource.purity}
                    onChange={(e) => handleChange(index, 'purity', e.target.value)}
                  >
                    {Object.values(ResourcePurity).map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor={`${type}-${index}-transport`}>Transport Method</Label>
                <Select
                  id={`${type}-${index}-transport`}
                  value={resource.transportMethod}
                  onChange={(e) => handleChange(index, 'transportMethod', e.target.value)}
                >
                  {Object.values(TransportMethod).map((tm) => (
                    <option key={tm} value={tm}>
                      {tm.charAt(0) + tm.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`${type}-${index}-amount`}>Amount</Label>
                  <TextInput
                    type="number"
                    id={`${type}-${index}-amount`}
                    value={resource.amount}
                    onChange={(e) => handleChange(index, 'amount', e.target.value)}
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor={`${type}-${index}-rate`}>Rate/min</Label>
                  <TextInput
                    type="number"
                    id={`${type}-${index}-rate`}
                    value={resource.rate}
                    onChange={(e) => handleChange(index, 'rate', e.target.value)}
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`${type}-${index}-maxrate`}>Max Rate</Label>
                  <TextInput
                    type="number"
                    id={`${type}-${index}-maxrate`}
                    value={resource.maxRate}
                    onChange={(e) => handleChange(index, 'maxRate', e.target.value)}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div>
                  <Label htmlFor={`${type}-${index}-efficiency`}>Efficiency %</Label>
                  <TextInput
                    type="number"
                    id={`${type}-${index}-efficiency`}
                    value={resource.efficiency}
                    onChange={(e) => handleChange(index, 'efficiency', e.target.value)}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            color="failure"
            size="sm"
            onClick={() => handleRemove(index)}
            className="w-full sm:w-auto"
            aria-label={`Remove ${type} resource ${index + 1}`}
          >
            <HiTrash className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button size="sm" onClick={handleAdd} className="w-full sm:w-auto">
        Add {type === 'input' ? 'Input' : 'Output'} Resource
      </Button>
    </div>
  )
}
