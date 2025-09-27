import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { storeCircleMembership, storeCircleInfo } from "../utils/encryption";
import { verifyCircleMembership } from "../services/zkProofs";

export function JoinCircleScreen() {
  const [circleId, setCircleId] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoinCircle = async () => {
    if (!circleId.trim()) {
      Alert.alert("Error", "Please enter a circle ID");
      return;
    }

    if (!secret.trim()) {
      Alert.alert("Error", "Please enter the circle secret");
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting to join circle:", {
        circleId: circleId.trim(),
        secret: secret.trim(),
      });

      // Step 1: Verify circle membership using ZK proof
      console.log("🔍 Starting ZK membership verification...");
      const verificationResult = await verifyCircleMembership(
        secret.trim(),
        circleId.trim()
      );

      if (!verificationResult.isValid) {
        console.log("❌ ZK verification failed:", verificationResult.error);
        Alert.alert(
          "Access Denied",
          verificationResult.error ||
            "Invalid secret for this circle. Please check your credentials and try again.",
          [{ text: "OK" }]
        );
        return;
      }

      console.log(
        "✅ ZK verification successful, proceeding with membership..."
      );

      // Step 2: Store circle membership locally (only after ZK verification)
      await storeCircleMembership(circleId.trim(), secret.trim());

      // Step 3: Store circle info
      await storeCircleInfo(circleId.trim(), {
        name: `Circle ${circleId.trim().substring(0, 8)}...`, // Default name
        description: "Private circle", // Default description
        joinedAt: Date.now(),
      });

      console.log("Circle joined successfully:", {
        circleId: circleId.trim(),
        secret: secret.trim(),
        nullifierCommitment: verificationResult.nullifierCommitment,
      });

      Alert.alert(
        "Success! 🎉",
        `You've successfully joined the circle!\n\nCircle ID: ${circleId.trim()}\nZK Verification: ✅ Verified`,
        [
          {
            text: "Go to Circle",
            onPress: () => {
              // TODO: Navigate to circle feed
              console.log("Navigate to circle:", circleId.trim());
            },
          },
          { text: "OK" },
        ]
      );

      // Reset form
      setCircleId("");
      setSecret("");
    } catch (error) {
      Alert.alert("Error", `Failed to join circle: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // TODO: Implement QR code scanning
    Alert.alert("QR Scanner", "QR code scanning will be implemented here");
  };

  const handlePasteInvite = () => {
    // TODO: Implement clipboard paste
    Alert.alert("Paste Invite", "Paste invite link from clipboard");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔐 Join Circle</Text>
      <Text style={styles.subtitle}>
        Enter circle details to join a private community
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Circle ID *</Text>
        <TextInput
          style={styles.input}
          value={circleId}
          onChangeText={setCircleId}
          placeholder="Enter circle ID (e.g., circle_123456_abc123)"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Secret *</Text>
        <TextInput
          style={styles.input}
          value={secret}
          onChangeText={setSecret}
          placeholder="Enter the circle secret"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={handleScanQR}>
          <Text style={styles.quickButtonText}>📷 Scan QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={handlePasteInvite}
        >
          <Text style={styles.quickButtonText}>📋 Paste Invite Link</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Privacy Guarantees</Text>
        <Text style={styles.feature}>✓ Your identity remains anonymous</Text>
        <Text style={styles.feature}>
          ✓ Secret is stored securely on your device
        </Text>
        <Text style={styles.feature}>
          ✓ Zero-knowledge proofs hide your membership
        </Text>
        <Text style={styles.feature}>
          ✓ All content is encrypted before storage
        </Text>
        <Text style={styles.feature}>✓ No central authority can track you</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.joinButton]}
        onPress={handleJoinCircle}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Joining..." : "🚀 Join Circle"}
        </Text>
      </TouchableOpacity>

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>
          • Ask the circle creator for the Circle ID and Secret{"\n"}• Use the
          QR scanner for quick joining{"\n"}• Paste invite links from messages
          or emails{"\n"}• Your secret is never shared with anyone
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888888",
    textAlign: "center",
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#333333",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#333333",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  quickButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15,
  },
  feature: {
    color: "#4CAF50",
    marginBottom: 8,
    fontSize: 14,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  joinButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  helpSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 20,
  },
});
