import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientSection } from '../ClientSection';
import { DB } from '../../utils/db';
import { API_URL } from '../../utils/api';

// Mock the DB class
const mockDb = {
    init: jest.fn(),
    getData: jest.fn().mockResolvedValue({ key: 'value' }),
    setData: jest.fn(),
    clientId: '123',
    db: {},
    _clientId: '123',
  } as unknown as DB;

global.fetch = jest.fn();
global.alert = jest.fn();

describe('ClientSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<ClientSection db={mockDb as unknown as DB} />);
    expect(screen.getByText('Client Data')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter client ID')).toBeInTheDocument();
    expect(screen.getByText('Initialize')).toBeInTheDocument();
  });

  it('initializes the client successfully', async () => {
    render(<ClientSection db={mockDb as unknown as DB} />);
    const input = screen.getByPlaceholderText('Enter client ID');
    const initializeButton = screen.getByText('Initialize');

    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(initializeButton);

    await waitFor(() => {
      expect(mockDb.init).toHaveBeenCalledWith('123');
      expect(mockDb.getData).toHaveBeenCalled();
      expect(screen.getByText('Data')).toBeInTheDocument();
    });
  });

  it('shows an alert when initializing without a client ID', () => {
    render(<ClientSection db={mockDb as unknown as DB} />);
    fireEvent.click(screen.getByText('Initialize'));
    expect(global.alert).toHaveBeenCalledWith('Please enter a client ID');
  });

  it('saves data successfully', async () => {
    render(<ClientSection db={mockDb as unknown as DB} />);
    const input = screen.getByPlaceholderText('Enter client ID');
    const initializeButton = screen.getByText('Initialize');

    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(initializeButton);

    await waitFor(() => expect(mockDb.getData).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Save Data'));
    await waitFor(() => {
      expect(mockDb.setData).toHaveBeenCalledWith({ key: 'value' });
      expect(global.alert).toHaveBeenCalledWith('Data saved locally');
    });
  });

  it('handles data parsing errors on save', async () => {
    render(<ClientSection db={mockDb} />);
    
    // Enter client ID and click "Initialize"
    fireEvent.change(screen.getByPlaceholderText('Enter client ID'), {
      target: { value: '123' },
    });
  
    fireEvent.click(screen.getByText('Initialize'));
  
    // Wait for initialization to complete
    await waitFor(() => expect(mockDb.getData).toHaveBeenCalled());
  
    fireEvent.change(screen.getByRole('textbox', { name: '' }), {
        target: { value: '{invalidJson}' },
      });
      
  
    fireEvent.click(screen.getByText('Save Data'));
  
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Error saving data')
      );
    });
  });
  

  it('syncs data with the server successfully', async () => {
    render(<ClientSection db={mockDb} />);
  
    // Set the correct client ID
    fireEvent.change(screen.getByPlaceholderText('Enter client ID'), {
      target: { value: '123' },
    });
  
    fireEvent.click(screen.getByText('Initialize'));
  
    await waitFor(() => expect(mockDb.getData).toHaveBeenCalled());
  
    fireEvent.click(screen.getByText('Sync with Server'));
  
    await waitFor(() => {
      // Check the last call to fetch with correct parameters
      expect(global.fetch).toHaveBeenLastCalledWith(
        `${API_URL}?clientId=123`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });
  
    // Ensure the function was called the expected number of times
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  

  it('handles sync errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(<ClientSection db={mockDb as unknown as DB} />);
    fireEvent.change(screen.getByPlaceholderText('Enter client ID'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Initialize'));

    await waitFor(() => expect(mockDb.getData).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Sync with Server'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Sync error'));
    });
  });
});
