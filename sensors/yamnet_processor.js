import Tflite from 'tflite-react-native';
import { decode } from 'wav-decoder'; // Add wav-decoder for audio preprocessing

const modelPath = './assets/yamnet.tflite'; // Ensure this file is correctly placed

let tfliteModel = new Tflite(); // Create a new instance of Tflite

async function loadModel() {
  try {
    await tfliteModel.loadModel({
      model: modelPath,
      modelType: 'TFLITE',
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
    
    // Convert decoded audio data to a tensor (Float32Array in this case)
    const audioTensor = new Float32Array(decoded.channelData[0]); // Mono channel data
    return audioTensor;
  } catch (error) {
    console.error('Error during audio preprocessing:', error);
    return null;
  }
}

export async function processAudioWithYAMNet(audioPath) {
  try {
    if (!tfliteModel) {
      console.log('Model not loaded, loading...');
      await loadModel();
    }

    const audioTensor = await preprocessAudio(audioPath);
    if (!audioTensor) {
      throw new Error('Failed to preprocess audio');
    }

    // Run inference
    const result = await tfliteModel.runForMultipleInputsOutputs([audioTensor]);

    console.log('YAMNet Inference Result:', result);
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