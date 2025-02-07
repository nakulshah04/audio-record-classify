import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [normalizedDecibels, setNormalizedDecibels] = useState(null);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  async function startRecording() {
    try {
        if (recording) {
            await recording.stopAndUnloadAsync();
          }
        console.log('Requesting permissions..');
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);

      // Start monitoring audio levels
      const interval = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording && status.metering !== undefined) {
          const normalized = Math.max(0, Math.min(120, ((status.metering + 160) / 160) * 120));
          setNormalizedDecibels(normalized);
        }
      }, 500);

      return () => clearInterval(interval);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setSound({ uri });
  }

  async function playSound() {
    console.log('Playing Sound');
    if (sound) {
      const { sound: playbackObject } = await Audio.Sound.createAsync({ uri: sound.uri });
      setSound(playbackObject);
      await playbackObject.playAsync();
      setIsPlaying(true);
      playbackObject.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.levelText}>
        Audio Level: {normalizedDecibels ? `${normalizedDecibels.toFixed(2)} dB` : 'Not recording'}
      </Text>
      <Button
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? stopRecording : startRecording}
      />
      <Button
        title="Play Recording"
        onPress={playSound}
        disabled={!sound || isPlaying || isRecording}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    marginBottom: 20,
  },
});