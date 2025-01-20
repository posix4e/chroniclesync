import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminLogin } from '../AdminLogin';

describe('AdminLogin Component', () => {
  it('renders input and button correctly', () => {
    render(<AdminLogin onLogin={jest.fn()} />);

    expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('updates input value correctly', () => {
    render(<AdminLogin onLogin={jest.fn()} />);
    
    const input = screen.getByPlaceholderText('Enter admin password');
    fireEvent.change(input, { target: { value: 'francesisthebest' } });
    expect(input).toHaveValue('francesisthebest');
  });

  it('calls onLogin when correct password is entered', () => {
    const mockOnLogin = jest.fn();
    render(<AdminLogin onLogin={mockOnLogin} />);

    const input = screen.getByPlaceholderText('Enter admin password');
    const button = screen.getByRole('button', { name: /login/i });

    fireEvent.change(input, { target: { value: 'francesisthebest' } });
    fireEvent.click(button);

    expect(mockOnLogin).toHaveBeenCalled();
  });

  it('shows alert when incorrect password is entered', () => {
    window.alert = jest.fn(); // Mock alert
    render(<AdminLogin onLogin={jest.fn()} />);

    const input = screen.getByPlaceholderText('Enter admin password');
    const button = screen.getByRole('button', { name: /login/i });

    fireEvent.change(input, { target: { value: 'wrongpassword' } });
    fireEvent.click(button);

    expect(window.alert).toHaveBeenCalledWith('Invalid password');
  });
});
