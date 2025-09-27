import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Header } from "./src/components/Header";
import { DemoScreen } from "./src/screens/DemoScreen";
import { CreateCircleScreen } from "./src/screens/CreateCircleScreen";
import { JoinCircleScreen } from "./src/screens/JoinCircleScreen";
import { MyCirclesScreen } from "./src/screens/MyCirclesScreen";
import { initializeZKProofs } from "./src/services/zkProofs";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    "my-circles" | "create" | "join" | "demo"
  >("my-circles");

  // Initialize ZK proof system when app starts
  useEffect(() => {
    const initZK = async () => {
      try {
        console.log("🚀 Initializing ZK proof system...");
        await initializeZKProofs();
        console.log("✅ ZK proof system initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize ZK proof system:", error);
      }
    };

    initZK();
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case "my-circles":
        return <MyCirclesScreen />;
      case "create":
        return <CreateCircleScreen />;
      case "join":
        return <JoinCircleScreen />;
      case "demo":
        return <DemoScreen />;
      default:
        return <MyCirclesScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Header />
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            currentScreen === "my-circles" && styles.activeTab,
          ]}
          onPress={() => setCurrentScreen("my-circles")}
        >
          <Text
            style={[
              styles.tabText,
              currentScreen === "my-circles" && styles.activeTabText,
            ]}
          >
            My Circles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentScreen === "create" && styles.activeTab]}
          onPress={() => setCurrentScreen("create")}
        >
          <Text
            style={[
              styles.tabText,
              currentScreen === "create" && styles.activeTabText,
            ]}
          >
            Create
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentScreen === "join" && styles.activeTab]}
          onPress={() => setCurrentScreen("join")}
        >
          <Text
            style={[
              styles.tabText,
              currentScreen === "join" && styles.activeTabText,
            ]}
          >
            Join
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentScreen === "demo" && styles.activeTab]}
          onPress={() => setCurrentScreen("demo")}
        >
          <Text
            style={[
              styles.tabText,
              currentScreen === "demo" && styles.activeTabText,
            ]}
          >
            Demo
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
    backgroundColor: "#1a1a1a",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#333333",
  },
  tabText: {
    color: "#888888",
    fontSize: 16,
    fontWeight: "bold",
  },
  activeTabText: {
    color: "#ffffff",
  },
});
