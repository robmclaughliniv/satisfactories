'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Modal, Label, TextInput, Select, Button, Badge, Spinner } from 'flowbite-react'
import { World, GameDifficulty } from '../types/storage'

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface WorldFormProps {
  initialWorld?: World
  isOpen: boolean
  onClose: () => void
  onSubmit: (world: World) => void
}

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export function WorldForm({
  initialWorld,
  isOpen,
  onClose,
  onSubmit,
}: WorldFormProps) {
  const user = { preferences: { defaultGameVersion: '1.0', defaultDifficulty: 'Normal' } }
  const [name, setName] = useState(initialWorld?.name || '')
  const [biome, setBiome] = useState(initialWorld?.biome || '')
  const [gameVersion, setGameVersion] = useState(
    initialWorld?.gameVersion || user.preferences.defaultGameVersion
  )
  const [difficulty, setDifficulty] = useState<GameDifficulty>(
    initialWorld?.difficulty || (user.preferences.defaultDifficulty as GameDifficulty)
  )
  const [coordinates, setCoordinates] = useState<Coordinates>(
    initialWorld?.coordinates || { x: 0, y: 0, z: 0 }
  )
  const [tags, setTags] = useState<string[]>(initialWorld?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [notes, setNotes] = useState(initialWorld?.notes || '')
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { defaultGameVersion, defaultDifficulty } = user.preferences

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialWorld?.name || '')
      setBiome(initialWorld?.biome || '')
      setGameVersion(initialWorld?.gameVersion || defaultGameVersion)
      setDifficulty(initialWorld?.difficulty || defaultDifficulty)
      setCoordinates(initialWorld?.coordinates || { x: 0, y: 0, z: 0 })
      setTags(initialWorld?.tags || [])
      setNewTag('')
      setNotes(initialWorld?.notes || '')
      setError(null)
      setIsPreview(false)
    }
  }, [isOpen, initialWorld, defaultGameVersion, defaultDifficulty])

  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleCoordinateChange = (
    axis: keyof Coordinates,
    value: string
  ) => {
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      setCoordinates(prev => ({
        ...prev,
        [axis]: numValue
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!name.trim()) {
      setError('World name is required')
      setIsLoading(false)
      return
    }

    if (!gameVersion.trim()) {
      setError('Game version is required')
      setIsLoading(false)
      return
    }

    const world: World = {
      id: initialWorld?.id || crypto.randomUUID(),
      name: name.trim(),
      biome: biome.trim(),
      gameVersion: gameVersion.trim(),
      difficulty,
      coordinates,
      tags,
      powerStats: initialWorld?.powerStats || {
        totalProduction: 0,
        totalConsumption: 0,
        maxCapacity: 0,
      },
      notes,
      factories: initialWorld?.factories || [],
      startDate: initialWorld?.startDate || Date.now(),
      lastModified: Date.now(),
    }

    try {
      // Optimistic UI update can be managed by calling onSubmit immediately,
      // but here we perform the API call first to ensure backend consistency.
      const response = await fetch('/api/worlds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(world)
      });

      if (!response.ok) {
        throw new Error('Failed to save world.');
      }
      onSubmit(world)
      onClose()
    } catch (err) {
      setError('Failed to save world. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      size="4xl"
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
        {initialWorld ? 'Edit World' : 'Create New World'}
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
                <Label htmlFor="world-name">World Name</Label>
                <TextInput
                  id="world-name"
                  name="world-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  color={error && !name.trim() ? 'failure' : undefined}
                  helperText={
                    error && !name.trim() ? 'World name is required' : undefined
                  }
                />
              </div>

              <div>
                <Label htmlFor="world-biome">Biome</Label>
                <TextInput
                  id="world-biome"
                  name="world-biome"
                  value={biome}
                  onChange={(e) => setBiome(e.target.value)}
                  placeholder="e.g., Grasslands, Desert, etc."
                />
              </div>

              <div>
                <Label htmlFor="game-version">Game Version</Label>
                <TextInput
                  id="game-version"
                  name="game-version"
                  value={gameVersion}
                  onChange={(e) => setGameVersion(e.target.value)}
                  required
                  placeholder="e.g., Update 8"
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDifficulty(parseGameDifficulty(e.target.value))}
                  required
                >
                  {Object.values(GameDifficulty).map((diff) => (
                    <option key={diff} value={diff}>
                      {diff.charAt(0) + diff.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label>Coordinates</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="coord-x" className="text-xs">X</Label>
                    <TextInput
                      id="coord-x"
                      type="number"
                      value={coordinates.x}
                      onChange={(e) => handleCoordinateChange('x', e.target.value)}
                      sizing="sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coord-y" className="text-xs">Y</Label>
                    <TextInput
                      id="coord-y"
                      type="number"
                      value={coordinates.y}
                      onChange={(e) => handleCoordinateChange('y', e.target.value)}
                      sizing="sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coord-z" className="text-xs">Z</Label>
                    <TextInput
                      id="coord-z"
                      type="number"
                      value={coordinates.z}
                      onChange={(e) => handleCoordinateChange('z', e.target.value)}
                      sizing="sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <TextInput
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Add tag..."
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAddTag()
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      color="info"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full Width */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="world-notes">Notes (Markdown)</Label>
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
                height={200}
                textareaProps={{
                  id: 'world-notes',
                  'aria-label': 'World notes in Markdown format',
                }}
              />
            </div>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end gap-2">
          <Button color="gray" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="worldForm" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" light={true} />
                &nbsp;Saving...
              </>
            ) : (
              initialWorld ? 'Save Changes' : 'Create World'
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
