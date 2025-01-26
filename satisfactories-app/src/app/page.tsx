'use client'

import { Button, Card } from 'flowbite-react'
import { useState } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Mobile-first container with responsive padding */}
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl" role="heading" aria-level={1}>
          Welcome to Satisfactories
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature Card 1 */}
          <Card className="transition-transform hover:scale-105">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Mobile-First Design
            </h2>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Responsive layout that adapts between smaller screens and larger screens
            </p>
          </Card>

          {/* Feature Card 2 */}
          <Card className="transition-transform hover:scale-105">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              PWA Support
            </h2>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Install the web app on your home screen and use it offline
            </p>
          </Card>

          {/* Feature Card 3 */}
          <Card className="transition-transform hover:scale-105">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Accessibility
            </h2>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Built with a11y best practices including ARIA attributes and keyboard navigation
            </p>
          </Card>
        </div>

        {/* Interactive Demo Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Interactive Demo</h2>
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg text-gray-700" role="status" aria-live="polite">
              Count: {count}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setCount(c => c - 1)}
                aria-label="Decrease count"
                className="focus:ring-2 focus:ring-primary-500 focus:outline-none"
                tabIndex={0}
              >
                Decrease
              </Button>
              <Button
                color="success"
                onClick={() => setCount(c => c + 1)}
                aria-label="Increase count"
                className="focus:ring-2 focus:ring-primary-500 focus:outline-none"
                tabIndex={0}
              >
                Increase
              </Button>
            </div>
          </div>
        </div>

        {/* Responsive Features Section - Hidden on mobile, visible on desktop only */}
        <div className="mt-8" style={{ display: 'none' }} data-testid="additional-features">
          <style jsx>{`
            @media (min-width: 1024px) {
              [data-testid="additional-features"] {
                display: block !important;
              }
            }
          `}</style>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Additional Features on Larger Screens</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="transition-transform hover:scale-105">
                <h3 className="text-lg font-semibold">Feature {i + 1}</h3>
                <p className="text-gray-600">Additional feature visible on larger screens</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
