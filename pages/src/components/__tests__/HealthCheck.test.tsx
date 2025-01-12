import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HealthCheck } from '../HealthCheck';

// Mock the checkSystemStatus function
const mockCheckSystemStatus = jest.fn();
declare global {
  interface Window {
    checkSystemStatus: jest.Mock;
  }
}
window.checkSystemStatus = mockCheckSystemStatus;

describe('HealthCheck', () => {
  beforeEach(() => {
    mockCheckSystemStatus.mockReset();
  });

  it('renders initial state correctly', () => {
    render(<HealthCheck />);
    
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument();
  });

  it('displays loading state while checking status', async () => {
    mockCheckSystemStatus.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<HealthCheck />);
    
    fireEvent.click(screen.getByRole('button', { name: /check status/i }));
    
    expect(screen.getByText(/checking system status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check status/i })).toBeDisabled();
  });

  it('displays success message when system is healthy', async () => {
    mockCheckSystemStatus.mockResolvedValue({ status: 'healthy' });
    
    render(<HealthCheck />);
    
    fireEvent.click(screen.getByRole('button', { name: /check status/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/system is healthy/i)).toBeInTheDocument();
    });
  });

  it('displays error message when system check fails', async () => {
    mockCheckSystemStatus.mockRejectedValue(new Error('Connection failed'));
    
    render(<HealthCheck />);
    
    fireEvent.click(screen.getByRole('button', { name: /check status/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/error checking system status/i)).toBeInTheDocument();
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
    });
  });

  it('allows retrying after error', async () => {
    mockCheckSystemStatus
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce({ status: 'healthy' });
    
    render(<HealthCheck />);
    
    // First attempt
    fireEvent.click(screen.getByRole('button', { name: /check status/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/error checking system status/i)).toBeInTheDocument();
    });

    // Retry
    fireEvent.click(screen.getByRole('button', { name: /check status/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/system is healthy/i)).toBeInTheDocument();
    });
    
    expect(mockCheckSystemStatus).toHaveBeenCalledTimes(2);
  });
});