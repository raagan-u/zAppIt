import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import {
  getCircleMembership,
  getAllJoinedCircleIds,
  getCircleInfo,
  removeCircleMembership,
} from "../utils/encryption";

export interface JoinedCircle {
  id: string;
  name: string;
  description: string;
  joinedAt: number;
  lastActivity?: number;
  postCount?: number;
}

export function MyCirclesScreen() {
  const [circles, setCircles] = useState<JoinedCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demo - in production, this would be stored locally
  const mockJoinedCircles: JoinedCircle[] = [
    {
      id: "circle_1758962014590_p38sas",
      name: "CryptoMaxi",
      description: "Iykyk",
      joinedAt: Date.now() - 86400000, // 1 day ago
      lastActivity: Date.now() - 3600000, // 1 hour ago
      postCount: 12,
    },
    {
      id: "circle_1758962014500_abc123",
      name: "Privacy Advocates",
      description: "Share thoughts on digital privacy and anonymity",
      joinedAt: Date.now() - 172800000, // 2 days ago
      lastActivity: Date.now() - 7200000, // 2 hours ago
      postCount: 8,
    },
  ];

  useEffect(() => {
    loadJoinedCircles();
  }, []);

  const loadJoinedCircles = async () => {
    try {
      setLoading(true);

      // Get all joined circle IDs from local storage
      const circleIds = await getAllJoinedCircleIds();
      console.log("Loaded circle IDs:", circleIds);

      // Load circle info for each ID
      const circlesData: JoinedCircle[] = [];
      for (const circleId of circleIds) {
        const circleInfo = await getCircleInfo(circleId);
        if (circleInfo) {
          circlesData.push({
            id: circleId,
            name: circleInfo.name,
            description: circleInfo.description,
            joinedAt: circleInfo.joinedAt,
            lastActivity: Date.now() - Math.random() * 86400000, // Mock last activity
            postCount: Math.floor(Math.random() * 20), // Mock post count
          });
        }
      }

      console.log("Loaded circles:", circlesData);
      setCircles(circlesData);
    } catch (error) {
      console.error("Error loading circles:", error);
      Alert.alert("Error", "Failed to load your circles");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJoinedCircles();
    setRefreshing(false);
  };

  const handleCirclePress = (circle: JoinedCircle) => {
    // TODO: Navigate to circle feed
    Alert.alert(
      "Enter Circle",
      `Opening ${circle.name}...\n\nThis would take you to the circle's feed where you can view posts and interact with other members.`,
      [
        {
          text: "View Posts",
          onPress: () => console.log("Navigate to circle feed:", circle.id),
        },
        { text: "Cancel" },
      ]
    );
  };

  const handleLeaveCircle = (circle: JoinedCircle) => {
    Alert.alert(
      "Leave Circle",
      `Are you sure you want to leave "${circle.name}"?\n\nYou will lose access to all posts and won't be able to interact with this circle anymore.`,
      [
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await removeCircleMembership(circle.id);
              console.log("Left circle:", circle.id);
              setCircles(circles.filter((c) => c.id !== circle.id));
            } catch (error) {
              console.error("Error leaving circle:", error);
              Alert.alert("Error", "Failed to leave circle");
            }
          },
        },
        { text: "Cancel" },
      ]
    );
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderCircle = (circle: JoinedCircle) => (
    <TouchableOpacity
      key={circle.id}
      style={styles.circleCard}
      onPress={() => handleCirclePress(circle)}
    >
      <View style={styles.circleHeader}>
        <View style={styles.circleInfo}>
          <Text style={styles.circleName}>{circle.name}</Text>
          <Text style={styles.circleDescription}>{circle.description}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleLeaveCircle(circle)}
        >
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.circleStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{circle.postCount || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {circle.lastActivity ? formatTimeAgo(circle.lastActivity) : "Never"}
          </Text>
          <Text style={styles.statLabel}>Last Activity</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTimeAgo(circle.joinedAt)}</Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
      </View>

      <View style={styles.circleActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📝 Post</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>💬 Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📊 Stats</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your circles...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>🔒 My Circles</Text>
      <Text style={styles.subtitle}>
        Your private communities - only you can see this list
      </Text>

      {circles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Circles Yet</Text>
          <Text style={styles.emptyDescription}>
            You haven't joined any circles yet. Create a new circle or join an
            existing one to get started!
          </Text>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>🔍 Discover Circles</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.circlesList}>{circles.map(renderCircle)}</View>
      )}

      <View style={styles.privacyNote}>
        <Text style={styles.privacyTitle}>🔐 Privacy Note</Text>
        <Text style={styles.privacyText}>
          This list is stored locally on your device. No one else can see which
          circles you've joined. Your memberships are protected by
          zero-knowledge proofs.
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#888888",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  circlesList: {
    gap: 15,
  },
  circleCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  circleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  circleDescription: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 20,
  },
  moreButton: {
    padding: 8,
  },
  moreButtonText: {
    color: "#888888",
    fontSize: 18,
    fontWeight: "bold",
  },
  circleStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  statLabel: {
    fontSize: 12,
    color: "#888888",
    marginTop: 2,
  },
  circleActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#333333",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  privacyNote: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 20,
  },
});
