'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Navbar,
  Sidebar,
  Spinner,
  Table,
} from 'flowbite-react'
import { localStorageService } from '@/services/localStorageService'
import type { World, Factory } from '@/types/storage'
import { FactoryForm } from '@/components/FactoryForm'
import { WorldForm } from '@/components/WorldForm'

export default function Home() {
  const [worlds, setWorlds] = useState<World[]>([])
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isWorldModalOpen, setIsWorldModalOpen] = useState(false)
  const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false)
  const [editingWorld, setEditingWorld] = useState<World | undefined>(undefined)
  const [editingFactory, setEditingFactory] = useState<Factory | undefined>(undefined)

  // Skip to main content link for accessibility
  const SkipLink = () => (
    <a
      href="#main-content"
      className="fixed left-0 top-0 -translate-y-full bg-blue-700 p-2 text-white transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
  )

  useEffect(() => {
    const loadWorlds = () => {
      try {
        const loadedWorlds = localStorageService.getWorlds()
        setWorlds(loadedWorlds)
        if (loadedWorlds.length > 0) {
          setSelectedWorld(loadedWorlds[0])
        }
      } catch (err) {
        setError('Failed to load worlds')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadWorlds()
  }, [])

  // Calculate total input/output rates for the selected world
  const calculateWorldMetrics = (factories: Factory[]) => {
    return factories.reduce(
      (acc, factory) => {
        factory.inputs.forEach((input) => {
          acc.totalInputRate += input.rate
        })
        factory.outputs.forEach((output) => {
          acc.totalOutputRate += output.rate
        })
        return acc
      },
      { totalInputRate: 0, totalOutputRate: 0 }
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <>
      <SkipLink />
      
      {/* Mobile Navigation */}
      <Navbar fluid className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 lg:hidden">
        <Navbar.Brand>
          <Image
            src="/globe.svg"
            className="mr-3"
            alt=""
            width={32}
            height={32}
            priority
          />
          <span className="self-center whitespace-nowrap text-xl font-semibold">
            Satisfactories
          </span>
        </Navbar.Brand>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              color="light"
              onClick={() => {
                setEditingWorld(undefined)
                setIsWorldModalOpen(true)
              }}
              aria-label="Create new world"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Button>
            <Dropdown label={selectedWorld?.name || 'Select World'} inline>
              {worlds.map((world) => (
                <Dropdown.Item
                  key={world.id}
                  onClick={() => setSelectedWorld(world)}
                >
                  {world.name}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </div>
          <Button color="gray" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span className="sr-only">Toggle sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </div>
      </Navbar>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Desktop Sidebar - Hidden on mobile */}
        <Sidebar
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white transition-transform dark:bg-gray-900 lg:block ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:relative lg:translate-x-0`}
        >
          <Sidebar.Items>
            <Sidebar.ItemGroup>
              {worlds.map((world) => (
                <Sidebar.Item
                  key={world.id}
                  active={selectedWorld?.id === world.id}
                  onClick={() => setSelectedWorld(world)}
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src="/globe.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="opacity-70"
                    />
                    <span>{world.name}</span>
                  </div>
                </Sidebar.Item>
              ))}
            </Sidebar.ItemGroup>
          </Sidebar.Items>
        </Sidebar>

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 bg-gray-50 p-4 lg:p-8"
          tabIndex={-1}
        >
          {error ? (
            <Alert color="failure">
              <span className="font-medium">Error!</span> {error}
            </Alert>
          ) : worlds.length === 0 ? (
            <Alert color="info">
              <h2 className="text-lg font-medium">Welcome to Satisfactories!</h2>
              <p>You haven't created any worlds yet. Create your first world to get started.</p>
              <Button color="blue" className="mt-4" onClick={() => {
                setEditingWorld(undefined)
                setIsWorldModalOpen(true)
              }}>
                Create World
              </Button>
            </Alert>
          ) : selectedWorld ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold">Factories</h2>
                    <p className="mt-2 text-3xl font-bold text-blue-600">
                      {selectedWorld.factories.length}
                    </p>
                  </div>
                </Card>
                {selectedWorld.factories.length > 0 && (
                  <>
                    <Card>
                      <div className="flex flex-col items-center">
                        <h2 className="text-xl font-bold">Total Input Rate</h2>
                        <p className="mt-2 text-3xl font-bold text-green-600">
                          {calculateWorldMetrics(selectedWorld.factories).totalInputRate}/min
                        </p>
                      </div>
                    </Card>
                    <Card>
                      <div className="flex flex-col items-center">
                        <h2 className="text-xl font-bold">Total Output Rate</h2>
                        <p className="mt-2 text-3xl font-bold text-purple-600">
                          {calculateWorldMetrics(selectedWorld.factories).totalOutputRate}/min
                        </p>
                      </div>
                    </Card>
                  </>
                )}
              </div>

              {/* Factories Section */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Factories</h2>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingFactory(undefined)
                      setIsFactoryModalOpen(true)
                    }}
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Factory
                  </Button>
                </div>
                <Card>
                  <div className="overflow-x-auto">
                    <Table hoverable>
                      <Table.Head>
                        <Table.HeadCell>Name</Table.HeadCell>
                        <Table.HeadCell>Inputs</Table.HeadCell>
                        <Table.HeadCell>Outputs</Table.HeadCell>
                        <Table.HeadCell>Last Modified</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        {selectedWorld.factories.map((factory) => (
                          <Table.Row
                            key={factory.id}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => {
                              setEditingFactory(factory)
                              setIsFactoryModalOpen(true)
                            }}
                          >
                            <Table.Cell className="font-medium">
                              {factory.name}
                            </Table.Cell>
                            <Table.Cell>
                              {factory.inputs
                                .map((i) => `${i.amount} ${i.itemId}`)
                                .join(', ')}
                            </Table.Cell>
                            <Table.Cell>
                              {factory.outputs
                                .map((o) => `${o.amount} ${o.itemId}`)
                                .join(', ')}
                            </Table.Cell>
                            <Table.Cell>
                              {new Date(factory.lastModified).toLocaleDateString()}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                </Card>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* World Form Modal */}
      <WorldForm
        initialWorld={editingWorld}
        isOpen={isWorldModalOpen}
        onClose={() => {
          setIsWorldModalOpen(false)
          setEditingWorld(undefined)
        }}
        onSubmit={(world: World) => {
          const updatedWorlds = localStorageService.getWorlds()
          setWorlds(updatedWorlds)
          setSelectedWorld(world)
        }}
      />

      {/* Factory Form Modal */}
      {selectedWorld && (
        <FactoryForm
          worldId={selectedWorld.id}
          initialFactory={editingFactory}
          isOpen={isFactoryModalOpen}
          onClose={() => {
            setIsFactoryModalOpen(false)
            setEditingFactory(undefined)
          }}
          onSubmit={(factory: Factory) => {
            // Refresh the world data after factory update
            const updatedWorlds = localStorageService.getWorlds()
            setWorlds(updatedWorlds)
            setSelectedWorld(updatedWorlds.find(w => w.id === selectedWorld.id) || null)
          }}
        />
      )}
    </>
  )
}
