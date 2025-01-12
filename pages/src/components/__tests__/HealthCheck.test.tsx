import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HealthCheck } from '../HealthCheck';
import React from 'react';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('HealthCheck', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockFetch.mockReset();
  });

  it('renders initial state correctly', () => {
    render(<HealthCheck />);

    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check Health' })).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Checking...')).toBeInTheDocument();
    expect(screen.getByText('Last Check:')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('displays healthy status after successful check', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ healthy: true })
    });

    render(<HealthCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Check Health' }));

    await waitFor(() => {
      expect(screen.getByText('✅ Healthy')).toBeInTheDocument();
    });

    // Verify last check time is updated
    expect(screen.queryByText('Never')).not.toBeInTheDocument();
  });

  it('displays unhealthy status with error message', async () => {
    const errorMessage = 'Database connection failed';
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ healthy: false, error: errorMessage })
    });

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<HealthCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Check Health' }));

    await waitFor(() => {
      expect(screen.getByText('❌ Unhealthy')).toBeInTheDocument();
    });

    expect(alertMock).toHaveBeenCalledWith(`Health check failed: ${errorMessage}`);
    alertMock.mockRestore();
  });

  it('handles network errors gracefully', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<HealthCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Check Health' }));

    await waitFor(() => {
      expect(screen.getByText('❌ Error')).toBeInTheDocument();
    });

    expect(alertMock).toHaveBeenCalledWith(`Health check error: ${networkError.message}`);
    alertMock.mockRestore();
  });
});