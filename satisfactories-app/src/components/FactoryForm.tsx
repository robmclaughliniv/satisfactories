'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Modal, Label, TextInput, Select, Button, Accordion } from 'flowbite-react'
import { Factory, FactoryCategory, FactoryStatus } from '../types/storage'
import { ResourceInput } from './ResourceInput'
import { localStorageService } from '../services/localStorageService'
import { HiTrash } from 'react-icons/hi'

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface FactoryFormProps {
  worldId: string
  initialFactory?: Factory
  isOpen: boolean
  onClose: () => void
  onSubmit: (factory: Factory) => void
}

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

interface BuildingCount {
  name: string;
  count: number;
}

export function FactoryForm({
  worldId,
  initialFactory,
  isOpen,
  onClose,
  onSubmit,
}: FactoryFormProps) {
  const [name, setName] = useState(initialFactory?.name || '')
  const [description, setDescription] = useState(initialFactory?.description || '')
  const [category, setCategory] = useState<FactoryCategory>(
    initialFactory?.category || FactoryCategory.PROCESSING
  )
  const [status, setStatus] = useState<FactoryStatus>(
    initialFactory?.status || FactoryStatus.OPERATIONAL
  )
  const [location, setLocation] = useState<Coordinates>(
    initialFactory?.location || { x: 0, y: 0, z: 0 }
  )
  const [powerUsage, setPowerUsage] = useState(initialFactory?.powerUsage || 0)
  const [powerProduction, setPowerProduction] = useState(initialFactory?.powerProduction || 0)
  const [efficiency, setEfficiency] = useState(initialFactory?.efficiency || 100)
  const [buildingCounts, setBuildingCounts] = useState<BuildingCount[]>(
    Object.entries(initialFactory?.buildingCount || {}).map(([name, count]) => ({
      name,
      count: count as number,
    }))
  )
  const [newBuildingName, setNewBuildingName] = useState('')
  const [inputs, setInputs] = useState(initialFactory?.inputs || [])
  const [outputs, setOutputs] = useState(initialFactory?.outputs || [])
  const [notes, setNotes] = useState(initialFactory?.notes || '')
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialFactory?.name || '')
      setDescription(initialFactory?.description || '')
      setCategory(initialFactory?.category || FactoryCategory.PROCESSING)
      setStatus(initialFactory?.status || FactoryStatus.OPERATIONAL)
      setLocation(initialFactory?.location || { x: 0, y: 0, z: 0 })
      setPowerUsage(initialFactory?.powerUsage || 0)
      setPowerProduction(initialFactory?.powerProduction || 0)
      setEfficiency(initialFactory?.efficiency || 100)
      setBuildingCounts(
        Object.entries(initialFactory?.buildingCount || {}).map(([name, count]) => ({
          name,
          count: count as number,
        }))
      )
      setNewBuildingName('')
      setInputs(initialFactory?.inputs || [])
      setOutputs(initialFactory?.outputs || [])
      setNotes(initialFactory?.notes || '')
      setError(null)
      setIsPreview(false)
    }
  }, [isOpen, initialFactory])

  const handleLocationChange = (
    axis: keyof Coordinates,
    value: string
  ) => {
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      setLocation(prev => ({
        ...prev,
        [axis]: numValue
      }))
    }
  }

  const handleAddBuilding = () => {
    const trimmedName = newBuildingName.trim()
    if (trimmedName && !buildingCounts.some(b => b.name === trimmedName)) {
      setBuildingCounts([...buildingCounts, { name: trimmedName, count: 1 }])
      setNewBuildingName('')
    }
  }

  const handleRemoveBuilding = (name: string) => {
    setBuildingCounts(buildingCounts.filter(b => b.name !== name))
  }

  const handleBuildingCountChange = (name: string, value: string) => {
    const numValue = Number(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setBuildingCounts(
        buildingCounts.map(b =>
          b.name === name ? { ...b, count: numValue } : b
        )
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Factory name is required')
      return
    }

    if (!inputs.every((input) => input.itemId.trim())) {
      setError('All input resources must have an item ID')
      return
    }

    if (!outputs.every((output) => output.itemId.trim())) {
      setError('All output resources must have an item ID')
      return
    }

    const factory: Factory = {
      id: initialFactory?.id || crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      category,
      status,
      location,
      powerUsage,
      powerProduction,
      efficiency,
      buildingCount: buildingCounts.reduce(
        (acc, { name, count }) => ({ ...acc, [name]: count }),
        {}
      ),
      inputs,
      outputs,
      notes,
      lastModified: Date.now(),
    }

    try {
      localStorageService.updateFactory(worldId, factory)
      onSubmit(factory)
      onClose()
    } catch (err) {
      setError('Failed to save factory. Please try again.')
    }
  }

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      size="6xl"
      dismissible
      popup={false}
      root={document.body}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }}
    >
      <Modal.Header>
        {initialFactory ? 'Edit Factory' : 'Create New Factory'}
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-gray-800 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="factory-name">Factory Name</Label>
                <TextInput
                  id="factory-name"
                  name="factory-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  color={error && !name.trim() ? 'failure' : undefined}
                  helperText={
                    error && !name.trim() ? 'Factory name is required' : undefined
                  }
                />
              </div>

              <div>
                <Label htmlFor="factory-description">Description</Label>
                <TextInput
                  id="factory-description"
                  name="factory-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="factory-category">Category</Label>
                <Select
                  id="factory-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FactoryCategory)}
                  required
                >
                  {Object.values(FactoryCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="factory-status">Status</Label>
                <Select
                  id="factory-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FactoryStatus)}
                  required
                >
                  {Object.values(FactoryStatus).map((stat) => (
                    <option key={stat} value={stat}>
                      {stat.split('_').map(word => 
                        word.charAt(0) + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Location</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="location-x" className="text-xs">X</Label>
                    <TextInput
                      id="location-x"
                      type="number"
                      value={location.x}
                      onChange={(e) => handleLocationChange('x', e.target.value)}
                      sizing="sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location-y" className="text-xs">Y</Label>
                    <TextInput
                      id="location-y"
                      type="number"
                      value={location.y}
                      onChange={(e) => handleLocationChange('y', e.target.value)}
                      sizing="sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location-z" className="text-xs">Z</Label>
                    <TextInput
                      id="location-z"
                      type="number"
                      value={location.z}
                      onChange={(e) => handleLocationChange('z', e.target.value)}
                      sizing="sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="power-usage">Power Usage (MW)</Label>
                  <TextInput
                    id="power-usage"
                    type="number"
                    value={powerUsage}
                    onChange={(e) => setPowerUsage(Number(e.target.value))}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div>
                  <Label htmlFor="power-production">Power Production (MW)</Label>
                  <TextInput
                    id="power-production"
                    type="number"
                    value={powerProduction}
                    onChange={(e) => setPowerProduction(Number(e.target.value))}
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="efficiency">Efficiency %</Label>
                <TextInput
                  id="efficiency"
                  type="number"
                  value={efficiency}
                  onChange={(e) => setEfficiency(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>

              <div>
                <Label>Buildings</Label>
                <div className="flex gap-2 mb-2">
                  <TextInput
                    value={newBuildingName}
                    onChange={(e) => setNewBuildingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddBuilding()
                      }
                    }}
                    placeholder="Building name..."
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAddBuilding()
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {buildingCounts.map(({ name, count }) => (
                    <div key={name} className="flex items-center gap-2">
                      <TextInput
                        type="number"
                        value={count}
                        onChange={(e) => handleBuildingCountChange(name, e.target.value)}
                        min={0}
                        className="w-24"
                      />
                      <span className="flex-1">{name}</span>
                      <Button
                        color="failure"
                        size="xs"
                        onClick={() => handleRemoveBuilding(name)}
                      >
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resources - Mobile: Accordion, Desktop: Side-by-side */}
          <div className="block lg:hidden">
            <Accordion>
              <Accordion.Panel>
                <Accordion.Title>Input Resources</Accordion.Title>
                <Accordion.Content>
                  <ResourceInput
                    resources={inputs}
                    onChange={setInputs}
                    type="input"
                    error={error?.includes('input') ? error : undefined}
                  />
                </Accordion.Content>
              </Accordion.Panel>
              <Accordion.Panel>
                <Accordion.Title>Output Resources</Accordion.Title>
                <Accordion.Content>
                  <ResourceInput
                    resources={outputs}
                    onChange={setOutputs}
                    type="output"
                    error={error?.includes('output') ? error : undefined}
                  />
                </Accordion.Content>
              </Accordion.Panel>
            </Accordion>
          </div>

          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
            <div>
              <Label>Input Resources</Label>
              <ResourceInput
                resources={inputs}
                onChange={setInputs}
                type="input"
                error={error?.includes('input') ? error : undefined}
              />
            </div>
            <div>
              <Label>Output Resources</Label>
              <ResourceInput
                resources={outputs}
                onChange={setOutputs}
                type="output"
                error={error?.includes('output') ? error : undefined}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="factory-notes">Notes (Markdown)</Label>
              <Button
                size="xs"
                color="light"
                onClick={() => setIsPreview(!isPreview)}
              >
                {isPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
            <div data-color-mode="light">
              <MDEditor
                value={notes}
                onChange={(value) => setNotes(value || '')}
                preview={isPreview ? 'preview' : 'edit'}
                height={300}
                textareaProps={{
                  id: 'factory-notes',
                  'aria-label': 'Factory notes in Markdown format',
                }}
              />
            </div>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end gap-2">
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {initialFactory ? 'Save Changes' : 'Create Factory'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
