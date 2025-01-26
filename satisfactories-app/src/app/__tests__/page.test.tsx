import { render, screen, fireEvent } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', {
      name: /welcome to satisfactories/i,
      level: 1,
    })
    expect(heading).toBeInTheDocument()
  })

  it('displays feature cards', () => {
    render(<Home />)
    expect(screen.getByText(/mobile-first design/i)).toBeInTheDocument()
    expect(screen.getByText(/pwa support/i)).toBeInTheDocument()
    expect(screen.getByText(/accessibility/i)).toBeInTheDocument()
  })

  it('handles counter interactions', () => {
    render(<Home />)
    
    // Initial state
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument()
    
    // Increase count
    const increaseButton = screen.getByRole('button', { name: /increase/i })
    fireEvent.click(increaseButton)
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument()
    
    // Decrease count
    const decreaseButton = screen.getByRole('button', { name: /decrease/i })
    fireEvent.click(decreaseButton)
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument()
  })

  it('has accessible buttons with proper ARIA labels', () => {
    render(<Home />)
    
    const increaseButton = screen.getByRole('button', { name: /increase/i })
    const decreaseButton = screen.getByRole('button', { name: /decrease/i })
    
    expect(increaseButton).toHaveAttribute('aria-label', 'Increase count')
    expect(decreaseButton).toHaveAttribute('aria-label', 'Decrease count')
  })

  it('updates counter status with live region', () => {
    render(<Home />)
    
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    
    const increaseButton = screen.getByRole('button', { name: /increase/i })
    fireEvent.click(increaseButton)
    
    expect(status).toHaveTextContent(/count: 1/i)
  })
})
