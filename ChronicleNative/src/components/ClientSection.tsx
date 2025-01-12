import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const ClientSection = () => {
  const [syncStatus, setSyncStatus] = useState('Not synced');

  const handleSync = async () => {
    setSyncStatus('Syncing...');
    try {
      // In a real app, this would communicate with the Safari extension
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSyncStatus('Synced');
    } catch (error) {
      setSyncStatus('Sync failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client Section</Text>
      <Text style={styles.status}>Status: {syncStatus}</Text>
      <TouchableOpacity style={styles.button} onPress={handleSync}>
        <Text style={styles.buttonText}>Sync History</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});