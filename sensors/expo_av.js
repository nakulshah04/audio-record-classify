import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';

export default function useAudioLevels() {
  const [decibels, setDecibels] = useState(null);
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    startRecording();
    return () => stopRecording();
  }, []);

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.warn('Permission to access microphone is required!');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const recordingObject = new Audio.Recording();
      await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recordingObject.startAsync();

      setRecording(recordingObject);

      const interval = setInterval(async () => {
        const status = await recordingObject.getStatusAsync();
        if (status.metering) {
          setDecibels(status.metering); // Audio level in dBFS (decibels relative to full scale)
        }
      }, 500);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  async function stopRecording() {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }
  }

  return decibels;
}