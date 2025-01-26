'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Modal, Label, TextInput, Textarea, Button, Accordion } from 'flowbite-react'
import { Factory } from '../types/storage'
import { ResourceInput } from './ResourceInput'
import { localStorageService } from '../services/localStorageService'

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

export function FactoryForm({
  worldId,
  initialFactory,
  isOpen,
  onClose,
  onSubmit,
}: FactoryFormProps) {
  const [name, setName] = useState(initialFactory?.name || '')
  const [description, setDescription] = useState(initialFactory?.description || '')
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
      setInputs(initialFactory?.inputs || [])
      setOutputs(initialFactory?.outputs || [])
      setNotes(initialFactory?.notes || '')
      setError(null)
      setIsPreview(false)
    }
  }, [isOpen, initialFactory])

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
      size="5xl"
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
              <Textarea
                id="factory-description"
                name="factory-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Mobile: Accordion, Desktop: Side-by-side */}
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
