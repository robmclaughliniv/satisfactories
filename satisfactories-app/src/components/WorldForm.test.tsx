import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorldForm } from './WorldForm';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
};

// Reset fetch mocks before each test
beforeEach(() => {
  jest.resetAllMocks();
});

describe('WorldForm Component', () => {
  it('renders input fields', () => {
    render(<WorldForm {...defaultProps} />);
    // Assuming the WorldForm component has an input for the world name with a placeholder "World Name"
    const nameInput = screen.getByPlaceholderText(/world name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('submits form and shows success message on successful creation', async () => {
    // Mock the fetch API to simulate a successful response from the POST endpoint.
    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ world: { id: 1, name: 'Test World' } }), { status: 200 })
      )
    ) as jest.Mock;

    render(<WorldForm {...defaultProps} />);

    // Simulate filling in the form fields.
    const nameInput = screen.getByPlaceholderText(/world name/i);
    fireEvent.change(nameInput, { target: { value: 'Test World' } });

    // Simulate form submission. Assuming there's a submit button with role "button" and text "Submit".
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Wait for the success message to appear.
    await waitFor(() => {
      expect(screen.getByText(/world created successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failed submission', async () => {
    // Mock the fetch API to simulate a failure response.
    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'Error creating world.' }), { status: 400 })
      )
    ) as jest.Mock;

    render(<WorldForm {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText(/world name/i);
    fireEvent.change(nameInput, { target: { value: 'Test World' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Wait for the error message to appear.
    await waitFor(() => {
      expect(screen.getByText(/error creating world/i)).toBeInTheDocument();
    });
  });
});
