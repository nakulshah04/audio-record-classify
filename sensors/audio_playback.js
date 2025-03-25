import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { processAudioWithYAMNet } from './yamnet_processor';
import debounce from 'lodash.debounce';

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [normalizedDecibels, setNormalizedDecibels] = useState(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

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
      const { recording } = await Audio.Recording.createAsync(recordingSettings);
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

  const debouncedProcessAudio = debounce(async (uri) => {
    const result = await processAudioWithYAMNet(uri);
    console.log('YAMNet processing result:', result);
  }, 300);

  async function stopRecording() {
    console.log('Stopping recording..');
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log("Recording saved at:", uri);
  
    setRecording(null);
    setSound({ uri });
  
    debouncedProcessAudio(uri); // Use debounced function
  }

  const recordingSettings = {
    isMeteringEnabled: true,
    android: {
      extension: '.wav',
      outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
      audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
      sampleRate: 16000, // YAMNet-compatible
      numberOfChannels: 1, // Mono
      bitRate: 256000, 
    },
    ios: {
      extension: '.wav',
      outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
      audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
      sampleRate: 16000, // YAMNet-compatible
      numberOfChannels: 1, // Mono
      bitRate: 256000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    }
  };

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
