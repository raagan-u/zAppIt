import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Circle } from '../types';

const mockCircles: Circle[] = [
  {
    id: '1',
    name: 'Crypto Enthusiasts',
    description: 'Discuss the latest in cryptocurrency and blockchain technology',
    memberCount: 1234,
    isJoined: false,
  },
  {
    id: '2',
    name: 'Privacy Advocates',
    description: 'Share thoughts on digital privacy and anonymity',
    memberCount: 567,
    isJoined: true,
  },
  {
    id: '3',
    name: 'ZK Researchers',
    description: 'Advanced discussions on zero-knowledge proofs and cryptography',
    memberCount: 89,
    isJoined: false,
  },
];

export function CircleList() {
  const [circles, setCircles] = useState<Circle[]>(mockCircles);

  const handleJoinCircle = (circleId: string) => {
    // TODO: Implement join circle logic with ZK proof
    console.log('Joining circle:', circleId);
  };

  const renderCircle = ({ item }: { item: Circle }) => (
    <TouchableOpacity
      style={[styles.circleCard, item.isJoined && styles.joinedCard]}
      onPress={() => handleJoinCircle(item.id)}
    >
      <View style={styles.circleHeader}>
        <Text style={styles.circleName}>{item.name}</Text>
        <Text style={styles.memberCount}>{item.memberCount} members</Text>
      </View>
      <Text style={styles.circleDescription}>{item.description}</Text>
      <View style={styles.circleFooter}>
        {item.isJoined ? (
          <Text style={styles.joinedText}>✓ Joined</Text>
        ) : (
          <Text style={styles.joinText}>Join Circle</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Available Circles</Text>
      <FlatList
        data={circles}
        renderItem={renderCircle}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  circleCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  joinedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1a',
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  memberCount: {
    fontSize: 12,
    color: '#888888',
  },
  circleDescription: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 12,
    lineHeight: 20,
  },
  circleFooter: {
    alignItems: 'flex-end',
  },
  joinText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  joinedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
