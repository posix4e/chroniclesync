import React from 'react';
import './Notification.css';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export function Notification({ message, type = 'success', onClose }: NotificationProps) {
  return (
    <div className={`notification notification-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="notification-close">
          ×
        </button>
      )}
    </div>
  );
}