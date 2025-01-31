import { View, Text, StyleSheet} from 'react-native';
import useAudioLevels from './sensors/expo_av';

export default function App() {
  const decibels = useAudioLevels();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Audio Level: {decibels ? `${decibels.toFixed(2)} dB` : 'Measuring...'}</Text>
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
  text: {
    fontSize: 24,
  },
});