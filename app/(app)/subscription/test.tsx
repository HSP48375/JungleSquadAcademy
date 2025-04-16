import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

// Basic placeholder component
function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test Screen Placeholder</Text>
    </View>
  );
}

// Add some basic styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', // Dark background
  },
  text: {
    color: '#fff', // White text
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Regular', // Assuming SpaceGrotesk is loaded
  },
});

// Export the component as default
export default TestScreen;
