import Tflite from 'tflite-react-native';
import { decode } from 'wav-decoder';

const modelPath = './assets/yamnet.tflite';

let tfliteModel = null; // Initialize as null

export async function loadModel() {
  try {
    if (!tfliteModel) {
      console.log('Initializing TFLite model instance...');
      tfliteModel = new Tflite(); // Create the instance only once
    }

    console.log('Attempting to load YAMNet model...');
    await tfliteModel.loadModel({
      model: modelPath,
      modelType: 'FLOAT32',
    });
    console.log('YAMNet model loaded successfully');
  } catch (error) {
    console.error('Failed to load YAMNet model:', error);
  }
}

async function preprocessAudio(audioPath) {
  try {
    const response = await fetch(audioPath);
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await decode(arrayBuffer);

    // Normalize audio data between -1 and 1
    const audioTensor = new Float32Array(decoded.channelData[0].map(sample => sample / Math.max(...decoded.channelData[0])));
    return audioTensor;
  } catch (error) {
    console.error('Error during audio preprocessing:', error);
    return null;
  }
}

export async function processAudioWithYAMNet(audioPath) {
  try {
    console.log('Starting YAMNet processing...');
    if (!tfliteModel) {
      console.log('Loading model...');
      await loadModel();
    }

    console.log('Preprocessing audio...');
    const audioTensor = await preprocessAudio(audioPath);

    console.log('Running inference...');
    const result = await tfliteModel.runModelOnBinary({ input: audioTensor });

    console.log('Inference complete:', result);
    return result;
  } catch (error) {
    console.error('YAMNet processing error:', error);
    return null;
  }
}

export async function unloadModel() {
  if (tfliteModel) {
    await tfliteModel.close();
    console.log('YAMNet model unloaded successfully');
  }
}
