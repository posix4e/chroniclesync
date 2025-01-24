import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Notification } from '../Notification';

describe('Notification', () => {
  it('renders success notification with message', () => {
    render(<Notification message="Operation successful" type="success" />);
    
    const notification = screen.getByText('Operation successful');
    expect(notification).toBeInTheDocument();
    expect(notification.parentElement).toHaveClass('notification-success');
  });

  it('renders error notification with message', () => {
    render(<Notification message="Operation failed" type="error" />);
    
    const notification = screen.getByText('Operation failed');
    expect(notification).toBeInTheDocument();
    expect(notification.parentElement).toHaveClass('notification-error');
  });

  it('defaults to success type when not specified', () => {
    render(<Notification message="Operation completed" />);
    
    const notification = screen.getByText('Operation completed');
    expect(notification).toBeInTheDocument();
    expect(notification.parentElement).toHaveClass('notification-success');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<Notification message="Test message" onClose={onClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when onClose is not provided', () => {
    render(<Notification message="Test message" />);
    
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });
});