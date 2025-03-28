import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HealthCheck } from '../HealthCheck';
import React from 'react';
import { createFetchMock } from '../../../../shared/test-utils';

// Mock fetch globally
const mockFetch = createFetchMock();
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
    // Use our shared test utility
    mockFetch.mockImplementation(createFetchMock({ healthy: true }, true));

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
    // Use our shared test utility
    mockFetch.mockImplementation(createFetchMock({ healthy: false, error: errorMessage }, true));

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
    // Reset the mock and make it reject with an error
    mockFetch.mockReset();
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