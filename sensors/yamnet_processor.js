import Tflite from 'tflite-react-native';

let tflite = null;
let isModelLoaded = false;
const modelPath = './assets/yamnet.tflite';

async function initializeTFLite() {
    try {
      console.log('Initializing TFLite...');
      if (!tflite) {
        tflite = new Tflite();
        console.log('TFLite instance created successfully:', tflite);
      } else {
        console.log('TFLite instance already exists.');
      }
    } catch (error) {
      console.error('Error initializing TFLite:', error);
    }
  }

  export async function loadModel() {
    try {
      console.log('Preloading YAMNet model...');
      await initializeTFLite(); // Ensure TFLite is initialized
  
      if (!tflite) {
        throw new Error('TFLite instance is null');
      }
  
      console.log('Loading YAMNet model...');
      await tflite.loadModel(
        { model: modelPath, numThreads: 1 },
        (error) => {
          if (error) {
            console.error('Failed to load YAMNet model:', error);
          } else {
            console.log('YAMNet model loaded successfully');
          }
        }
      );
    } catch (error) {
      console.error('Error in loadModel():', error);
    }
}

async function preprocessAudio(audioPath) {
  try {
    console.log('Fetching audio as raw data...');
    const response = await fetch(audioPath);
    const arrayBuffer = await response.arrayBuffer();
    // Convert the raw audio data into a tensor
    const audioTensor = new Float32Array(arrayBuffer);
    return audioTensor;
  } catch (error) {
    console.error('Error fetching audio:', error);
    return null;
  }
}

export async function processAudioWithYAMNet(audioPath) {
  try {
    console.log('Starting YAMNet processing...');

    // Load the model if it’s not loaded already
    if (!isModelLoaded) {
      await loadModel();
    }

    const audioTensor = await preprocessAudio(audioPath);
    if (!audioTensor) throw new Error('Failed to preprocess audio');

    console.log('Running inference...');
    const waveformInputIndex = 0; // Assuming input index for waveform
    await tflite.setTensor(waveformInputIndex, audioTensor); // Set the tensor input

    await tflite.allocateTensors(); // Allocate tensors for model inference

    const scoresOutputIndex = 0; // Assuming output index for scores
    const scores = await tflite.getTensor(scoresOutputIndex); // Get the output tensor (scores)

    console.log('Inference result:', scores);

    // Find the top class (like Python's argmax on scores)
    const topClassIndex = scores.indexOf(Math.max(...scores));
    console.log('Top class index:', topClassIndex);

    return topClassIndex;
  } catch (error) {
    console.error('YAMNet processing error:', error);
  }
}

export async function unloadModel() {
  try {
    if (tflite) {
      await tflite.close();
      console.log('YAMNet model unloaded successfully');
      tflite = null;
    }
  } catch (error) {
    console.error('Failed to unload model:', error);
  }
}
