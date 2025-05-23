import { generateAudio, getAvailableVoices } from './services/ttsService';

export function initializeTTSPanel() {
  const ttsInputText = document.getElementById('tts-input-text') as HTMLTextAreaElement | null;
  const ttsVoiceSelector = document.getElementById('tts-voice-selector') as HTMLSelectElement | null;
  const ttsGenerateButton = document.getElementById('tts-generate-button') as HTMLButtonElement | null;
  const ttsAudioPlayer = document.getElementById('tts-audio-player') as HTMLAudioElement | null;
  const ttsStatusMessage = document.getElementById('tts-status-message') as HTMLDivElement | null;

  if (!ttsInputText || !ttsVoiceSelector || !ttsGenerateButton || !ttsAudioPlayer || !ttsStatusMessage) {
    console.error('One or more TTS panel elements are missing from the DOM.');
    return;
  }

  // Populate voice selector
  const availableVoices = getAvailableVoices();
  ttsVoiceSelector.innerHTML = ''; // Clear "Loading..."
  if (availableVoices.length === 0) {
    const option = document.createElement('option');
    option.value = "";
    option.textContent = "No voices available";
    ttsVoiceSelector.appendChild(option);
    ttsVoiceSelector.disabled = true;
    ttsGenerateButton.disabled = true;
  } else {
    availableVoices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.value;
      option.textContent = voice.name;
      ttsVoiceSelector.appendChild(option);
    });
  }

  // Event listener for the generate button
  ttsGenerateButton.addEventListener('click', async () => {
    const text = ttsInputText.value;
    const selectedVoice = ttsVoiceSelector.value;

    if (!text.trim()) {
      ttsStatusMessage.textContent = 'Please enter some text to generate audio.';
      ttsStatusMessage.style.color = 'var(--color-recording)'; // Use a warning/error color
      return;
    }
    if (!selectedVoice) {
      ttsStatusMessage.textContent = 'Please select a voice.';
      ttsStatusMessage.style.color = 'var(--color-recording)';
      return;
    }

    ttsStatusMessage.textContent = 'Generating audio...';
    ttsStatusMessage.style.color = 'var(--color-text-secondary)';
    ttsGenerateButton.disabled = true;
    ttsInputText.disabled = true;
    ttsVoiceSelector.disabled = true;

    try {
      const audioUrl = await generateAudio(text, selectedVoice);
      ttsAudioPlayer.src = audioUrl;
      // ttsAudioPlayer.play(); // Autoplay can be annoying, let user click play.
      ttsStatusMessage.textContent = 'Audio generated successfully. Press play on the audio player.';
      ttsStatusMessage.style.color = 'var(--color-success)';
    } catch (error) {
      console.error('TTS Generation Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio.';
      ttsStatusMessage.textContent = errorMessage;
      ttsStatusMessage.style.color = 'var(--color-recording)';
      if (ttsAudioPlayer.src) { // Revoke old blob URL if exists
         URL.revokeObjectURL(ttsAudioPlayer.src);
         ttsAudioPlayer.removeAttribute('src');
      }
    } finally {
      ttsGenerateButton.disabled = false;
      ttsInputText.disabled = false;
      ttsVoiceSelector.disabled = false;
    }
  });

  // Optional: Revoke object URL when a new one is set or when page unloads
  // to free up memory.
  let currentObjectUrl: string | null = null;
  ttsAudioPlayer.addEventListener('loadstart', () => {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      console.log("Revoked old object URL:", currentObjectUrl);
    }
    if (ttsAudioPlayer.src && ttsAudioPlayer.src.startsWith('blob:')) {
         currentObjectUrl = ttsAudioPlayer.src;
         console.log("Tracking new object URL:", currentObjectUrl);
    } else {
        currentObjectUrl = null;
    }
  });

  window.addEventListener('beforeunload', () => {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      console.log("Revoked object URL on page unload:", currentObjectUrl);
    }
    if (ttsAudioPlayer.src && ttsAudioPlayer.src.startsWith('blob:')) {
        // This case handles if loadstart didn't fire for the last URL for some reason
        URL.revokeObjectURL(ttsAudioPlayer.src);
    }
  });

}
