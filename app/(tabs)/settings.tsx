import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { getAvailableChains, getChainConfig } from '../../constants/config';
import { useWallet } from '../../contexts/WalletContext';

export default function SettingsScreen() {
  const { isConnected, disconnectWallet, currentChain, switchChain } = useWallet();
  const [fadeAnim] = useState(new Animated.Value(0));
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectWallet();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect wallet');
            }
          },
        },
      ]
    );
  };

  const handleChainSwitch = async (newChain: string) => {
    if (newChain === currentChain) return;
    
    try {
      await switchChain(newChain);
      Alert.alert('Success', `Switched to ${getChainConfig(newChain).name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch chain');
    }
  };

  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#F9FAFB' : '#1F2937';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  interface SettingsItem {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    action?: () => void;
    value?: string;
    disabled?: boolean;
  }

  interface SettingsSection {
    id: string;
    title: string;
    items: SettingsItem[];
  }

  const settingsData: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'wallet-info',
          icon: 'wallet-outline',
          title: 'Wallet Information',
          subtitle: isConnected ? 'View wallet details' : 'No wallet connected',
          action: () => {},
          disabled: !isConnected,
        },
        {
          id: 'backup',
          icon: 'cloud-upload-outline',
          title: 'Backup & Recovery',
          subtitle: 'Secure your wallet',
          action: () => Alert.alert('Coming Soon', 'Backup feature will be available soon'),
        },
      ],
    },
    {
      id: 'network',
      title: 'Network',
      items: [
        {
          id: 'current-network',
          icon: 'globe-outline',
          title: 'Current Network',
          subtitle: isConnected ? getChainConfig(currentChain).name : 'Not connected',
          value: isConnected ? getChainConfig(currentChain).chainId.toString() : undefined,
          disabled: !isConnected,
        },
      ],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      items: [
        {
          id: 'auto-lock',
          icon: 'lock-closed-outline',
          title: 'Auto-lock',
          subtitle: 'Automatically lock wallet',
          action: () => Alert.alert('Coming Soon', 'Auto-lock feature will be available soon'),
        },
        {
          id: 'privacy',
          icon: 'eye-off-outline',
          title: 'Privacy Settings',
          subtitle: 'Manage your privacy',
          action: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon'),
        },
      ],
    },
    {
      id: 'app',
      title: 'Application',
      items: [
        {
          id: 'version',
          icon: 'information-circle-outline',
          title: 'App Version',
          subtitle: 'zAppVault v1.0.0',
          value: '1.0.0',
        },
        {
          id: 'support',
          icon: 'help-circle-outline',
          title: 'Help & Support',
          subtitle: 'Get help and support',
          action: () => Alert.alert('Support', 'Contact support at support@zappvault.com'),
        },
        {
          id: 'about',
          icon: 'document-text-outline',
          title: 'About',
          subtitle: 'Learn more about zAppVault',
          action: () => Alert.alert('About', 'zAppVault - Your secure multi-chain wallet'),
        },
      ],
    },
  ];

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
        <View style={styles.centerContainer}>
          <Animated.View style={[styles.disconnectedCard, { backgroundColor: surfaceColor, borderColor, opacity: fadeAnim }]}>
            <Ionicons name="settings-outline" size={48} color={textSecondary} />
            <Text style={[styles.disconnectedTitle, { color: textPrimary }]}>
              Settings
            </Text>
            <Text style={[styles.disconnectedText, { color: textSecondary }]}>
              Connect your wallet to access settings
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: textPrimary }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Manage your wallet and preferences
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Connection Status */}
          <View style={[styles.statusCard, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusTitle, { color: textPrimary }]}>
                  Connected
                </Text>
                <Text style={[styles.statusSubtitle, { color: textSecondary }]}>
                  Wallet is active and ready
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.statusAction, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                onPress={() => {}} // View details action
              >
                <Ionicons name="chevron-forward" size={16} color={textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Network Selector */}
          {isConnected && (
            <View style={styles.networkSection}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Available Networks
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.networkScroll}
              >
                {getAvailableChains().map((chain) => {
                  const config = getChainConfig(chain);
                  const isActive = chain === currentChain;
                  
                  return (
                    <TouchableOpacity
                      key={chain}
                      style={[
                        styles.networkCard,
                        { 
                          backgroundColor: surfaceColor,
                          borderColor: isActive ? '#2563EB' : borderColor,
                          borderWidth: isActive ? 2 : 1
                        }
                      ]}
                      onPress={() => handleChainSwitch(chain)}
                    >
                      <View style={[
                        styles.networkIconContainer,
                        { backgroundColor: isActive ? '#2563EB' : isDark ? '#374151' : '#F3F4F6' }
                      ]}>
                        <Text style={[
                          styles.networkIcon,
                          { color: isActive ? '#FFFFFF' : textSecondary }
                        ]}>
                          {config.name.charAt(0)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.networkName,
                        { color: isActive ? '#2563EB' : textPrimary }
                      ]}>
                        {config.name}
                      </Text>
                      <Text style={[
                        styles.networkId,
                        { color: textSecondary }
                      ]}>
                        ID: {config.chainId}
                      </Text>
                      {isActive && (
                        <View style={styles.activeIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Settings Sections */}
          {settingsData.map((section) => (
            <View key={section.id} style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                {section.title}
              </Text>
              <View style={[styles.settingsCard, { backgroundColor: surfaceColor, borderColor }]}>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.settingsItem,
                      { 
                        borderBottomColor: borderColor,
                        borderBottomWidth: index < section.items.length - 1 ? 0.5 : 0,
                        opacity: item.disabled ? 0.5 : 1
                      }
                    ]}
                    onPress={item.action}
                    disabled={item.disabled}
                  >
                    <View style={[styles.settingsIcon, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                      <Ionicons name={item.icon as any} size={20} color={textSecondary} />
                    </View>
                    <View style={styles.settingsContent}>
                      <Text style={[styles.settingsTitle, { color: textPrimary }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.settingsSubtitle, { color: textSecondary }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                    {item.value && (
                      <Text style={[styles.settingsValue, { color: textSecondary }]}>
                        {item.value}
                      </Text>
                    )}
                    {item.action && (
                      <Ionicons name="chevron-forward" size={16} color={textSecondary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Disconnect Button */}
          <View style={styles.dangerSection}>
            <TouchableOpacity 
              style={[styles.disconnectButton, { backgroundColor: '#EF4444' }]}
              onPress={handleDisconnect}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  // Disconnected State
  disconnectedCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disconnectedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  disconnectedText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Connected State
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  
  // Status Card
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
  },
  statusAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Network Section
  networkSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  networkScroll: {
    paddingRight: 20,
  },
  networkCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  networkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  networkIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  networkName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  networkId: {
    fontSize: 12,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  // Settings Sections
  settingsSection: {
    marginBottom: 24,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
  },
  settingsValue: {
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'monospace',
  },
  
  // Danger Section
  dangerSection: {
    marginTop: 20,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});