/**
 * Audio Recording, Waveform Analysis, Web Audio DSP Feature Extraction, and Synthesis Helpers
 */

export interface AcousticMetrics {
  durationMs: number;
  rmsVolume: number;
  snrDb: number; // Signal-to-noise ratio in dB
  silenceIntervals: { startMs: number; endMs: number; durationMs: number }[];
  vowelSustainedDurations?: { wordIndex: number; durationMs: number; estimatedHarakat: number }[];
  nasalResonanceScore?: number; // 0 to 1 for Ghunnah measurement
  isSilent: boolean;
  isNoisy: boolean;
  clarityGrade: 'excellent' | 'acceptable' | 'noisy' | 'unreliable';
}

export interface AudioRecordingResult {
  blob: Blob;
  base64: string;
  durationMs: number;
  snrDb: number;
  mimeType: string;
  acousticMetrics?: AcousticMetrics;
}

/**
 * Extracts acoustic features (RMS volume, SNR, sustained vowel durations, silence pauses)
 * directly from the audio blob using the browser's Web Audio API.
 */
export async function extractAcousticFeatures(audioBlob: Blob): Promise<AcousticMetrics> {
  const defaultMetrics: AcousticMetrics = {
    durationMs: 0,
    rmsVolume: 0,
    snrDb: 10,
    silenceIntervals: [],
    isSilent: true,
    isNoisy: true,
    clarityGrade: 'unreliable'
  };

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return defaultMetrics;

    const audioCtx = new AudioContextClass();
    const arrayBuffer = await audioBlob.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      await audioCtx.close();
      return defaultMetrics;
    }

    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0); // Analyze primary channel
    const sampleRate = audioBuffer.sampleRate;
    const durationMs = Math.round(audioBuffer.duration * 1000);

    if (durationMs < 400 || channelData.length === 0) {
      await audioCtx.close();
      return {
        ...defaultMetrics,
        durationMs,
        isSilent: true,
        clarityGrade: 'unreliable'
      };
    }

    // 1. Frame-by-Frame RMS energy computation
    const frameSize = Math.floor(sampleRate * 0.025); // 25ms windows
    const hopSize = Math.floor(sampleRate * 0.010); // 10ms hop
    const frameEnergies: number[] = [];

    let totalSquareSum = 0;
    for (let i = 0; i < channelData.length; i += hopSize) {
      let frameSum = 0;
      let count = 0;
      for (let j = i; j < Math.min(i + frameSize, channelData.length); j++) {
        const val = channelData[j];
        frameSum += val * val;
        count++;
      }
      const frameRms = Math.sqrt(frameSum / (count || 1));
      frameEnergies.push(frameRms);
      totalSquareSum += frameSum;
    }

    const overallRms = Math.sqrt(totalSquareSum / channelData.length);

    // 2. Estimate noise floor & active speech energy
    const sortedEnergies = [...frameEnergies].sort((a, b) => a - b);
    const noiseFloor = sortedEnergies[Math.floor(sortedEnergies.length * 0.1)] || 0.001;
    const peakSpeech = sortedEnergies[Math.floor(sortedEnergies.length * 0.95)] || 0.05;

    // SNR in dB = 20 * log10(peakSpeech / noiseFloor)
    const snrDb = Math.max(0, Math.min(45, Math.round(20 * Math.log10((peakSpeech + 1e-5) / (noiseFloor + 1e-5)))));

    const isSilent = overallRms < 0.008 || peakSpeech < 0.015;
    const isNoisy = snrDb < 10;

    // 3. Detect silence / pause intervals
    const speechThreshold = noiseFloor * 2.2 + 0.01;
    const silenceIntervals: { startMs: number; endMs: number; durationMs: number }[] = [];
    let inSilence = false;
    let silenceStartFrame = 0;

    for (let f = 0; f < frameEnergies.length; f++) {
      const isCurrentSilent = frameEnergies[f] < speechThreshold;
      if (isCurrentSilent && !inSilence) {
        inSilence = true;
        silenceStartFrame = f;
      } else if (!isCurrentSilent && inSilence) {
        inSilence = false;
        const silDurMs = Math.round((f - silenceStartFrame) * 10);
        if (silDurMs >= 300) {
          silenceIntervals.push({
            startMs: Math.round(silenceStartFrame * 10),
            endMs: Math.round(f * 10),
            durationMs: silDurMs
          });
        }
      }
    }

    // 4. Detect sustained voiced vowel durations (for Madd analysis)
    // Continuous energy segments > 400ms indicate sustained vowel or Ghunnah
    const vowelSustainedDurations: { wordIndex: number; durationMs: number; estimatedHarakat: number }[] = [];
    let voicedStartFrame = 0;
    let inVoiced = false;
    let detectedVowelIndex = 1;

    for (let f = 0; f < frameEnergies.length; f++) {
      const isVoiced = frameEnergies[f] >= speechThreshold * 1.5;
      if (isVoiced && !inVoiced) {
        inVoiced = true;
        voicedStartFrame = f;
      } else if (!isVoiced && inVoiced) {
        inVoiced = false;
        const voicedDurMs = Math.round((f - voicedStartFrame) * 10);
        // If voiced segment is sustained (> 350ms), measure as potential Madd
        if (voicedDurMs >= 350) {
          const estimatedHarakat = Math.round((voicedDurMs / 280) * 10) / 10;
          vowelSustainedDurations.push({
            wordIndex: detectedVowelIndex++,
            durationMs: voicedDurMs,
            estimatedHarakat
          });
        }
      }
    }

    await audioCtx.close();

    let clarityGrade: 'excellent' | 'acceptable' | 'noisy' | 'unreliable' = 'acceptable';
    if (isSilent || durationMs < 800) {
      clarityGrade = 'unreliable';
    } else if (snrDb >= 20 && overallRms >= 0.03) {
      clarityGrade = 'excellent';
    } else if (snrDb < 12) {
      clarityGrade = 'noisy';
    }

    return {
      durationMs,
      rmsVolume: Math.round(overallRms * 1000) / 1000,
      snrDb,
      silenceIntervals,
      vowelSustainedDurations,
      isSilent,
      isNoisy,
      clarityGrade
    };
  } catch (err) {
    console.warn('Could not extract acoustic features via Web Audio:', err);
    return defaultMetrics;
  }
}

/**
 * Browser Speech Recognition Helper
 * Note: Web Speech API is general speech-to-text; it transcribes orthographic letters
 * without Tashkeel (vowels) or Tajweed features. It is used as a supplementary alignment aid.
 */
export class BrowserSpeechTranscriber {
  private recognition: any = null;
  private transcript = '';

  start() {
    this.transcript = '';
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'ar-SA';
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            this.transcript += ' ' + event.results[i][0].transcript;
          }
        }
      };
      this.recognition.onerror = () => {
        // ignore recognition errors
      };
      this.recognition.start();
    } catch (e) {
      // ignore
    }
  }

  stop(): string {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    return this.transcript.trim();
  }
}

/**
 * Converts a Blob to a base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates a synthetic pleasant reference tone or speech audio using Web Audio API
 * Ensures sound plays reliably offline without external network dependencies.
 */
export function playSyntheticQiraahTone(frequency = 220, durationMs = 800) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    // Slight vibrato for warm human vocal simulation
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.02, ctx.currentTime + durationMs / 2000);
    osc.frequency.exponentialRampToValueAtTime(frequency, ctx.currentTime + durationMs / 1000);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.warn('Web Audio synthesis not allowed or supported', e);
  }
}

/**
 * Audio Recorder class managing MediaRecorder and live AnalyserNode
 */
export class RecitationRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private startTime = 0;

  async start(onAudioData?: (dataArray: Uint8Array) => void): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioChunks = [];
      this.startTime = Date.now();

      // Setup Web Audio Analyser for live visualization
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        if (onAudioData) {
          const bufferLength = this.analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          const update = () => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.analyser?.getByteFrequencyData(dataArray);
              onAudioData(dataArray);
              requestAnimationFrame(update);
            }
          };
          requestAnimationFrame(update);
        }
      }

      // Choose supported mimeType
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, selectedMime ? { mimeType: selectedMime } : undefined);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      return false;
    }
  }

  stop(): Promise<AudioRecordingResult> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const dummyBlob = new Blob([], { type: 'audio/webm' });
        resolve({ blob: dummyBlob, base64: '', durationMs: 0, snrDb: 25, mimeType: 'audio/webm' });
        return;
      }

      const durationMs = Date.now() - this.startTime;

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const base64 = await blobToBase64(audioBlob);

        // Extract real acoustic features
        const acousticMetrics = await extractAcousticFeatures(audioBlob);

        // Cleanup tracks
        this.mediaStream?.getTracks().forEach(track => track.stop());
        if (this.audioContext && this.audioContext.state !== 'closed') {
          try {
            await this.audioContext.close();
          } catch (e) {
            // ignore
          }
        }

        resolve({
          blob: audioBlob,
          base64,
          durationMs: acousticMetrics.durationMs || durationMs,
          snrDb: acousticMetrics.snrDb,
          mimeType,
          acousticMetrics
        });
      };

      this.mediaRecorder.stop();
    });
  }
}
