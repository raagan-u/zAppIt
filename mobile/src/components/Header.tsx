import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>🔒 AnonReddit</Text>
      <TouchableOpacity style={styles.settingsButton}>
        <Text style={styles.settingsText}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
  },
  settingsText: {
    fontSize: 18,
    color: '#ffffff',
  },
});
