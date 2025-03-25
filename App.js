import React from 'react';
import { View, StyleSheet } from 'react-native';
import AudioRecorder from './sensors/audio_playback'

export default function App() {
  return (
    <View style={styles.container}>
      <AudioRecorder />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});