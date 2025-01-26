'use client'

import React from 'react'
import { Label, TextInput, Button } from 'flowbite-react'
import { HiTrash } from 'react-icons/hi'

interface Resource {
  itemId: string
  amount: number
  rate: number
}

interface ResourceInputProps {
  resources: Resource[]
  onChange: (resources: Resource[]) => void
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
    onChange([...resources, { itemId: '', amount: 0, rate: 0 }])
  }

  const handleRemove = (index: number) => {
    onChange(resources.filter((_, i) => i !== index))
  }

  const handleChange = (
    index: number,
    field: keyof Resource,
    value: string | number
  ) => {
    const newResources = [...resources]
    newResources[index] = {
      ...newResources[index],
      [field]: field === 'itemId' ? value : Number(value),
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
          className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <div className="mb-2">
              <Label htmlFor={`${type}-${index}-item`}>Item ID</Label>
              <TextInput
                id={`${type}-${index}-item`}
                value={resource.itemId}
                onChange={(e) => handleChange(index, 'itemId', e.target.value)}
                color={error && !resource.itemId.trim() ? 'failure' : undefined}
              />
            </div>
          </div>

          <div className="w-full sm:w-24">
            <div className="mb-2">
              <Label htmlFor={`${type}-${index}-amount`}>Amount</Label>
              <TextInput
                type="number"
                id={`${type}-${index}-amount`}
                value={resource.amount}
                onChange={(e) => handleChange(index, 'amount', e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div className="w-full sm:w-24">
            <div className="mb-2">
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

      <Button
        size="sm"
        onClick={handleAdd}
        className="w-full sm:w-auto"
      >
        Add {type === 'input' ? 'Input' : 'Output'} Resource
      </Button>
    </div>
  )
}
