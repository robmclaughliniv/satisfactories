'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Modal, Label, TextInput, Textarea, Button } from 'flowbite-react'
import { World } from '../types/storage'
import { localStorageService } from '../services/localStorageService'

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

export function WorldForm({
  initialWorld,
  isOpen,
  onClose,
  onSubmit,
}: WorldFormProps) {
  const [name, setName] = useState(initialWorld?.name || '')
  const [biome, setBiome] = useState(initialWorld?.biome || '')
  const [notes, setNotes] = useState(initialWorld?.notes || '')
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialWorld?.name || '')
      setBiome(initialWorld?.biome || '')
      setNotes(initialWorld?.notes || '')
      setError(null)
      setIsPreview(false)
    }
  }, [isOpen, initialWorld])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('World name is required')
      return
    }

    const world: World = {
      id: initialWorld?.id || crypto.randomUUID(),
      name: name.trim(),
      biome: biome.trim(),
      notes,
      factories: initialWorld?.factories || [],
      lastModified: Date.now(),
    }

    try {
      localStorageService.updateWorld(world)
      onSubmit(world)
      onClose()
    } catch (err) {
      setError('Failed to save world. Please try again.')
    }
  }

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      size="3xl"
      dismissible
      popup={false}
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
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end gap-2">
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {initialWorld ? 'Save Changes' : 'Create World'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
