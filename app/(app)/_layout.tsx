import { Tabs } from 'expo-router';
import { Home, User, Trophy, MessageSquare, CreditCard, Gamepad2, Users, Award, Book, UserGroup } from 'lucide-react-native';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ImmersiveBackground from '@/components/ImmersiveBackground';

function TabBarBackground() {
  return (
    <View style={styles.tabBarBackground}>
      <LinearGradient
        colors={['#1A0B2E', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Subtle circuit pattern */}
      <View style={styles.circuitPattern}>
        <View style={styles.circuit} />
        <View style={styles.circuit2} />
        <View style={styles.circuitDot} />
        <View style={styles.circuitDot2} />
      </View>
    </View>
  );
}

export default function AppLayout() {
  return (
    <>
      {/* Global immersive background */}
      <ImmersiveBackground intensity="low" />
      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopColor: 'rgba(51, 51, 51, 0.5)',
            borderTopWidth: 1,
            elevation: 0,
            height: Platform.OS === 'ios' ? 90 : 70,
            paddingTop: 10,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
            position: 'absolute',
          },
          tabBarBackground: TabBarBackground,
          tabBarActiveTintColor: '#00FFA9',
          tabBarInactiveTintColor: '#666',
          tabBarLabelStyle: {
            fontFamily: 'Poppins-Medium',
            fontSize: 10,
            marginTop: 2,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="games"
          options={{
            title: 'Games',
            tabBarIcon: ({ color, size }) => <Gamepad2 size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="competitions"
          options={{
            title: 'Compete',
            tabBarIcon: ({ color, size }) => <Award size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="study-groups"
          options={{
            title: 'Groups',
            tabBarIcon: ({ color, size }) => <UserGroup size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: 'Journal',
            tabBarIcon: ({ color, size }) => <Book size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: 'Community',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="subscription"
          options={{
            title: 'Subscribe',
            tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circuitPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  circuit: {
    position: 'absolute',
    height: 1,
    width: '30%',
    top: '30%',
    left: '10%',
    backgroundColor: '#00FFA9',
  },
  circuit2: {
    position: 'absolute',
    height: 1,
    width: '20%',
    bottom: '40%',
    right: '15%',
    backgroundColor: '#00FFA9',
  },
  circuitDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    top: '30%',
    left: '40%',
    backgroundColor: '#00FFA9',
  },
  circuitDot2: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    bottom: '40%',
    right: '15%',
    backgroundColor: '#00FFA9',
  },
});