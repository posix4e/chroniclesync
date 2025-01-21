import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPanel } from '../AdminPanel';
import { API_URL } from '../../utils/api';
import React from 'react';


global.fetch = jest.fn() as jest.Mock;

describe('AdminPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays client stats', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ clientId: '123', lastSync: 1700000000000, dataSize: 1024 }],
    });

    render(<AdminPanel />);

    await waitFor(() => expect(screen.getByText('123')).toBeInTheDocument());
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  it('deletes a client successfully', async () => {
    // Mock confirm dialog to return true
    jest.spyOn(global, 'confirm').mockImplementation(() => true);
    jest.spyOn(global, 'alert').mockImplementation(() => {});
  
    // Mock initial fetch to load client data
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { clientId: '123', lastSync: 1700000000000, dataSize: 1024 },
      ],
    });
  
    render(<AdminPanel />);
  
    // Wait for the client data to load
    await waitFor(() => expect(screen.getByText('123')).toBeInTheDocument());
  
    // Mock fetch for client deletion
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
  
    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
  
    // Wait for the delete operation to be triggered
    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete client 123?');
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/admin/client?clientId=123`,
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(global.alert).toHaveBeenCalledWith('Client deleted successfully');
    });
  
    // Restore mocks to avoid side effects
    jest.restoreAllMocks();
  });
  
  it('views client data successfully', async () => {
    // Mock alert to avoid actual alerts during test execution
    jest.spyOn(global, 'alert').mockImplementation(() => {});
  
    // Mock the initial fetch to load client data into the component
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { clientId: '123', lastSync: 1700000000000, dataSize: 1024 },
      ],
    });
  
    render(<AdminPanel />);
  
    // Wait until the table is populated
    await waitFor(() => expect(screen.getByText('123')).toBeInTheDocument());
  
    // Mock the API response for viewing client data
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ clientId: '123', data: 'Sample data' }),
    });
  
    // Click on the View Data button
    const viewButton = screen.getByRole('button', { name: /view data/i });
    fireEvent.click(viewButton);
  
    // Wait for the API call and assert the alert was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}?clientId=123`,
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer francesisthebest' }),
        })
      );
  
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('"clientId": "123"'));
    });
  
    // Restore mocks to avoid side effects
    jest.restoreAllMocks();
  });
});
