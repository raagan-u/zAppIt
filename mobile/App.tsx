import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { CircleList } from './src/components/CircleList';
import { Header } from './src/components/Header';
import { DemoScreen } from './src/screens/DemoScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'demo'>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'demo':
        return <DemoScreen />;
      default:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Anonymous ZK Reddit</Text>
            <Text style={styles.subtitle}>Private circles with zero-knowledge proofs</Text>
            <CircleList />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Header />
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, currentScreen === 'home' && styles.activeTab]}
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={[styles.tabText, currentScreen === 'home' && styles.activeTabText]}>
            🏠 Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentScreen === 'demo' && styles.activeTab]}
          onPress={() => setCurrentScreen('demo')}
        >
          <Text style={[styles.tabText, currentScreen === 'demo' && styles.activeTabText]}>
            🧪 Demo
          </Text>
        </TouchableOpacity>
      </View>
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#333333',
  },
  tabText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#ffffff',
  },
});