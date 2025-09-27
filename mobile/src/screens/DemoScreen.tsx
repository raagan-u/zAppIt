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
import { postContentToCircle, voteOnPost } from "../services/contentService";
import { testPinataConnection } from "../services/ipfs";

export function DemoScreen() {
  const [content, setContent] = useState("");
  const [circleId, setCircleId] = useState("crypto-enthusiasts");
  const [userSecret, setUserSecret] = useState("demo-secret-123");
  const [loading, setLoading] = useState(false);

  const handlePostContent = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please enter content to post");
      return;
    }

    setLoading(true);
    try {
      const post = await postContentToCircle({
        content: content.trim(),
        contentType: "text",
        circleId,
        userSecret,
      });

      Alert.alert(
        "Success",
        `Content posted successfully!\nPost ID: ${post.id}\nIPFS Hash: ${post.contentHash}`
      );
      setContent("");
    } catch (error) {
      Alert.alert("Error", `Failed to post content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    setLoading(true);
    try {
      const txHash = await voteOnPost({
        postId: "demo-post-123",
        ipfsHash: "QmDemoHash123",
        voteType,
        circleId,
        userSecret,
      });

      Alert.alert(
        "Success",
        `${voteType} cast successfully!\nTransaction: ${txHash}`
      );
    } catch (error) {
      Alert.alert("Error", `Failed to cast vote: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPinata = async () => {
    setLoading(true);
    try {
      const isConnected = await testPinataConnection();
      if (isConnected) {
        Alert.alert(
          "Success",
          "Pinata connection successful! IPFS uploads should work."
        );
      } else {
        Alert.alert(
          "Error",
          "Pinata connection failed. Check your JWT configuration."
        );
      }
    } catch (error) {
      Alert.alert("Error", `Pinata test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔒 Anonymous ZK Reddit Demo</Text>
      <Text style={styles.subtitle}>
        Test the full encryption and proof flow
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>

        <Text style={styles.label}>Circle ID:</Text>
        <TextInput
          style={styles.input}
          value={circleId}
          onChangeText={setCircleId}
          placeholder="Enter circle ID"
        />

        <Text style={styles.label}>User Secret:</Text>
        <TextInput
          style={styles.input}
          value={userSecret}
          onChangeText={setUserSecret}
          placeholder="Enter your secret"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestPinata}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Testing..." : "🧪 Test Pinata Connection"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Post Content</Text>

        <Text style={styles.label}>Content:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Enter your anonymous post..."
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handlePostContent}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Posting..." : "📝 Post Content"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vote on Post</Text>

        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[styles.button, styles.upvoteButton]}
            onPress={() => handleVote("upvote")}
            disabled={loading}
          >
            <Text style={styles.buttonText}>👍 Upvote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.downvoteButton]}
            onPress={() => handleVote("downvote")}
            disabled={loading}
          >
            <Text style={styles.buttonText}>👎 Downvote</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Privacy Features</Text>
        <Text style={styles.feature}>✓ Content encrypted with circle keys</Text>
        <Text style={styles.feature}>✓ ZK proofs hide user identity</Text>
        <Text style={styles.feature}>
          ✓ Nullifier system prevents double actions
        </Text>
        <Text style={styles.feature}>✓ Decentralized storage on IPFS</Text>
        <Text style={styles.feature}>✓ On-chain verification</Text>
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#cccccc",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
  },
  upvoteButton: {
    backgroundColor: "#2196F3",
    flex: 1,
    marginRight: 10,
  },
  downvoteButton: {
    backgroundColor: "#f44336",
    flex: 1,
  },
  testButton: {
    backgroundColor: "#FF9800",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  voteButtons: {
    flexDirection: "row",
  },
  feature: {
    color: "#4CAF50",
    marginBottom: 8,
    fontSize: 14,
  },
});
