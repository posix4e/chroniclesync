import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../src/popup';

describe('Popup Component', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<App />);
    
    // Check for main elements
    expect(screen.getByText('ChronicleSync')).toBeInTheDocument();
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Client ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    
    // Sync button should not be visible initially
    expect(screen.queryByRole('button', { name: 'Sync with Server' })).not.toBeInTheDocument();
  });

  it('shows sync button after initialization', async () => {
    render(<App />);
    
    // Fill in client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'test-client' } });
    
    // Click initialize button
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);
    
    // Initialize button should change to Sync button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    });
    
    // Initialize button should still be there
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
  });

  it('does not show sync button if client ID is empty', () => {
    render(<App />);
    
    // Click initialize button without entering client ID
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);
    
    // Initialize button should still be there
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    // Sync button should not appear
    expect(screen.queryByRole('button', { name: 'Sync with Server' })).not.toBeInTheDocument();
  });

  it('shows success message after sync', async () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<App />);
    
    // Initialize with client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'test-client' } });
    fireEvent.click(screen.getByRole('button', { name: 'Initialize' }));
    
    // Click initialize button
    const initButton = await screen.findByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);
    
    // Check if alert was shown
    expect(alertMock).toHaveBeenCalledWith('Sync successful');
    
    // Clean up
    alertMock.mockRestore();
  });

  it('preserves client ID after initialization', () => {
    render(<App />);
    
    // Fill in client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'test-client' } });
    
    // Click initialize button
    fireEvent.click(screen.getByRole('button', { name: 'Initialize' }));
    
    // Client ID should still be visible and have the same value
    expect(screen.getByPlaceholderText('Client ID')).toHaveValue('test-client');
  });
});