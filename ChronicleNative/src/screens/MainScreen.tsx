import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';
import { ClientSection } from '../components/ClientSection';
import { AdminLogin } from '../components/AdminLogin';
import { AdminPanel } from '../components/AdminPanel';
import { HealthCheck } from '../components/HealthCheck';

export const MainScreen = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>ChronicleSync</Text>
        
        <ClientSection />
        
        {!isAdminLoggedIn ? (
          <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />
        ) : (
          <AdminPanel />
        )}
        
        <HealthCheck />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
});