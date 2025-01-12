import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: '--',
    syncOperations: '--',
    lastSync: '--',
  });

  const refreshStats = async () => {
    // In a real app, fetch stats from your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStats({
      totalUsers: '42',
      syncOperations: '123',
      lastSync: new Date().toLocaleString(),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      <View style={styles.statsContainer}>
        <Text>Total Users: {stats.totalUsers}</Text>
        <Text>Sync Operations: {stats.syncOperations}</Text>
        <Text>Last Sync: {stats.lastSync}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={refreshStats}>
        <Text style={styles.buttonText}>Refresh Stats</Text>
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
    marginBottom: 16,
  },
  statsContainer: {
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