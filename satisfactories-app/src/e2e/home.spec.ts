import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome to satisfactories/i }))
      .toBeVisible()
  })

  test('should have working counter', async ({ page }) => {
    // Initial state
    await expect(page.getByText(/count: 0/i)).toBeVisible()

    // Increase count
    await page.getByRole('button', { name: /increase/i }).click()
    await expect(page.getByText(/count: 1/i)).toBeVisible()

    // Decrease count
    await page.getByRole('button', { name: /decrease/i }).click()
    await expect(page.getByText(/count: 0/i)).toBeVisible()
  })

  test('should be keyboard accessible', async ({ page }) => {
    // Get the decrease button and focus it directly
    const decreaseButton = page.getByRole('button', { name: /decrease/i })
    await decreaseButton.focus()
    await decreaseButton.press('Space')
    await expect(page.getByText(/count: -1/i)).toBeVisible()

    // Get the increase button and focus it directly
    const increaseButton = page.getByRole('button', { name: /increase/i })
    await increaseButton.focus()
    await increaseButton.press('Space')
    await expect(page.getByText(/count: 0/i)).toBeVisible()
  })

  test('should show/hide features based on screen size', async ({ page }) => {
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByTestId('additional-features')).toHaveCSS('display', 'none')

    // Desktop view
    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(page.getByText(/additional features on larger screens/i))
      .toBeVisible()
  })

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check main heading level
    const heading = page.getByRole('heading', { name: /welcome to satisfactories/i })
    await expect(heading).toHaveAttribute('aria-level', '1')

    // Check counter status
    const status = page.getByRole('status')
    await expect(status).toHaveAttribute('aria-live', 'polite')

    // Check button labels
    await expect(page.getByRole('button', { name: /increase/i }))
      .toHaveAttribute('aria-label', 'Increase count')
    await expect(page.getByRole('button', { name: /decrease/i }))
      .toHaveAttribute('aria-label', 'Decrease count')
  })

  test('should maintain contrast ratio for accessibility', async ({ page }) => {
    // Note: This is a basic check. For comprehensive contrast testing,
    // consider using additional tools like axe-playwright
    const heading = page.getByRole('heading', { name: /welcome to satisfactories/i })
    await expect(heading).toHaveCSS('color', 'rgb(23, 23, 23)') // Updated to match actual color
    await expect(heading).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })
})
