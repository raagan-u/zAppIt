import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { generateRandomSecret, storeCircleMembership } from '../utils/encryption';

export interface Circle {
  id: string;
  name: string;
  description: string;
  secret: string;
  isPrivate: boolean;
  createdAt: number;
}

export function CreateCircleScreen() {
  const [circleName, setCircleName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [customSecret, setCustomSecret] = useState('');
  const [useCustomSecret, setUseCustomSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateSecret = () => {
    const secret = generateRandomSecret();
    setCustomSecret(secret);
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    if (!customSecret.trim()) {
      Alert.alert('Error', 'Please generate or enter a secret');
      return;
    }

    setLoading(true);
    try {
      // Generate circle ID
      const circleId = generateCircleId();
      
      // Store circle membership locally
      await storeCircleMembership(circleId, customSecret);

      const circle: Circle = {
        id: circleId,
        name: circleName.trim(),
        description: description.trim(),
        secret: customSecret,
        isPrivate: isPrivate,
        createdAt: Date.now()
      };

      // TODO: Store circle info locally
      console.log('Circle created:', circle);

      Alert.alert(
        'Circle Created! 🎉',
        `Circle ID: ${circleId}\nSecret: ${customSecret}\n\nShare these with people you want to invite!`,
        [
          {
            text: 'Copy Invite Link',
            onPress: () => copyInviteLink(circleId, customSecret)
          },
          { text: 'OK' }
        ]
      );

      // Reset form
      setCircleName('');
      setDescription('');
      setCustomSecret('');
    } catch (error) {
      Alert.alert('Error', `Failed to create circle: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = (circleId: string, secret: string) => {
    const inviteLink = `anonreddit://join?circle=${circleId}&secret=${secret}`;
    // TODO: Implement actual clipboard copy
    console.log('Invite link:', inviteLink);
    Alert.alert('Invite Link', inviteLink);
  };

  const generateCircleId = (): string => {
    return `circle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔒 Create New Circle</Text>
      <Text style={styles.subtitle}>Set up a private community with secret-based access</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Circle Name *</Text>
        <TextInput
          style={styles.input}
          value={circleName}
          onChangeText={setCircleName}
          placeholder="Enter circle name (e.g., Crypto Enthusiasts)"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what this circle is about..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Private Circle</Text>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={isPrivate ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.helpText}>
          {isPrivate 
            ? 'Only people with the secret can join' 
            : 'Anyone can join this circle'
          }
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Use Custom Secret</Text>
          <Switch
            value={useCustomSecret}
            onValueChange={setUseCustomSecret}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={useCustomSecret ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        
        {useCustomSecret ? (
          <TextInput
            style={styles.input}
            value={customSecret}
            onChangeText={setCustomSecret}
            placeholder="Enter your custom secret"
            secureTextEntry
          />
        ) : (
          <View style={styles.secretSection}>
            <TextInput
              style={[styles.input, styles.secretInput]}
              value={customSecret}
              placeholder="Generated secret will appear here"
              secureTextEntry
              editable={false}
            />
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateSecret}
            >
              <Text style={styles.generateButtonText}>🎲 Generate</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Security Features</Text>
        <Text style={styles.feature}>✓ Secret-based membership</Text>
        <Text style={styles.feature}>✓ Anonymous posting and voting</Text>
        <Text style={styles.feature}>✓ Encrypted content storage</Text>
        <Text style={styles.feature}>✓ Zero-knowledge proof verification</Text>
        <Text style={styles.feature}>✓ Decentralized IPFS storage</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.createButton]}
        onPress={handleCreateCircle}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating...' : '🚀 Create Circle'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
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
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
  },
  secretSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secretInput: {
    flex: 1,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  feature: {
    color: '#4CAF50',
    marginBottom: 8,
    fontSize: 14,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
