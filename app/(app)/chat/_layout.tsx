import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare } from 'lucide-react-native';

export default function ChatLayout() {
  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#1A0B2E', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Sticky header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(26, 11, 46, 0.95)', 'rgba(15, 23, 42, 0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <MessageSquare size={24} color="#00FFA9" />
          <Text style={styles.headerTitle}>Jungle Squad Chat</Text>
        </View>
        
        {/* Cyberpunk circuit decoration */}
        <View style={styles.circuitDecoration}>
          <View style={styles.circuit} />
          <View style={styles.circuitDot} />
        </View>
      </View>
      
      {/* Main content */}
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginLeft: 12,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  circuitDecoration: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 20,
    width: 30,
    height: 20,
    opacity: 0.6,
  },
  circuit: {
    position: 'absolute',
    top: 5,
    right: 0,
    width: 20,
    height: 1,
    backgroundColor: '#00FFA9',
  },
  circuitDot: {
    position: 'absolute',
    top: 5,
    right: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#00FFA9',
  },
  content: {
    flex: 1,
  },
});