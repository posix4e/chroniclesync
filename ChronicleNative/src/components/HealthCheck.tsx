import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const HealthCheck = () => {
  const [status, setStatus] = useState('Unknown');
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    setStatus('Checking...');
    
    try {
      // In a real app, check system health
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('Healthy');
    } catch (error) {
      setStatus('Error');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Health</Text>
      <Text style={styles.status}>Status: {status}</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={checkHealth}
        disabled={isChecking}
      >
        <Text style={styles.buttonText}>Check Health</Text>
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