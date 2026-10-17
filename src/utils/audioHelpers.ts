
/**
 * Audio Recording, Waveform Analysis, Web Audio DSP Feature Extraction, and Synthesis Helpers
 */

export interface AcousticMetrics {
  durationMs: number;
  rmsVolume: number;
  snrDb: number;
  silenceIntervals: { startMs: number; endMs: number; durationMs: number }[];
  vowelSustainedDurations?: {
    wordIndex: number;
    durationMs: number;
    estimatedHarakat: number;
  }[];
  nasalResonanceScore?: number;
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
 * Extract acoustic features from recorded audio.
 */
export async function extractAcousticFeatures(
  audioBlob: Blob
): Promise<AcousticMetrics> {
  const defaultMetrics: AcousticMetrics = {
    durationMs: 0,
    rmsVolume: 0,
    snrDb: 10,
    silenceIntervals: [],
    isSilent: true,
    isNoisy: true,
    clarityGrade: 'unreliable'
  };

  let audioCtx: AudioContext | null = null;

  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass || audioBlob.size === 0) {
      return defaultMetrics;
    }

    audioCtx = new AudioContextClass();

    const arrayBuffer = await audioBlob.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      return defaultMetrics;
    }

    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const durationMs = Math.round(audioBuffer.duration * 1000);

    if (durationMs < 400 || channelData.length === 0) {
      return {
        ...defaultMetrics,
        durationMs,
        isSilent: true,
        clarityGrade: 'unreliable'
      };
    }

    const frameSize = Math.max(1, Math.floor(sampleRate * 0.025));
    const hopSize = Math.max(1, Math.floor(sampleRate * 0.010));
    const frameEnergies: number[] = [];

    let totalSquareSum = 0;

    for (let i = 0; i < channelData.length; i += hopSize) {
      let frameSum = 0;
      let count = 0;

      for (
        let j = i;
        j < Math.min(i + frameSize, channelData.length);
        j++
      ) {
        const val = channelData[j];
        frameSum += val * val;
        count++;
      }

      const frameRms = Math.sqrt(frameSum / (count || 1));
      frameEnergies.push(frameRms);
      totalSquareSum += frameSum;
    }

    const overallRms = Math.sqrt(
      totalSquareSum / channelData.length
    );

    const sortedEnergies = [...frameEnergies].sort((a, b) => a - b);

    const noiseFloor =
      sortedEnergies[Math.floor(sortedEnergies.length * 0.1)] || 0.001;

    const peakSpeech =
      sortedEnergies[Math.floor(sortedEnergies.length * 0.95)] || 0.05;

    const snrDb = Math.max(
      0,
      Math.min(
        45,
        Math.round(
          20 * Math.log10(
            (peakSpeech + 1e-5) / (noiseFloor + 1e-5)
          )
        )
      )
    );

    const isSilent = overallRms < 0.008 || peakSpeech < 0.015;
    const isNoisy = snrDb < 10;
    const speechThreshold = noiseFloor * 2.2 + 0.01;

    const silenceIntervals: {
      startMs: number;
      endMs: number;
      durationMs: number;
    }[] = [];

    let inSilence = false;
    let silenceStartFrame = 0;

    for (let f = 0; f < frameEnergies.length; f++) {
      const isCurrentSilent = frameEnergies[f] < speechThreshold;

      if (isCurrentSilent && !inSilence) {
        inSilence = true;
        silenceStartFrame = f;
      } else if (!isCurrentSilent && inSilence) {
        inSilence = false;

        const silDurMs = Math.round(
          (f - silenceStartFrame) * 10
        );

        if (silDurMs >= 300) {
          silenceIntervals.push({
            startMs: Math.round(silenceStartFrame * 10),
            endMs: Math.round(f * 10),
            durationMs: silDurMs
          });
        }
      }
    }

    const vowelSustainedDurations: {
      wordIndex: number;
      durationMs: number;
      estimatedHarakat: number;
    }[] = [];

    let voicedStartFrame = 0;
    let inVoiced = false;
    let detectedVowelIndex = 1;

    for (let f = 0; f < frameEnergies.length; f++) {
      const isVoiced =
        frameEnergies[f] >= speechThreshold * 1.5;

      if (isVoiced && !inVoiced) {
        inVoiced = true;
        voicedStartFrame = f;
      } else if (!isVoiced && inVoiced) {
        inVoiced = false;

        const voicedDurMs = Math.round(
          (f - voicedStartFrame) * 10
        );

        if (voicedDurMs >= 350) {
          vowelSustainedDurations.push({
            wordIndex: detectedVowelIndex++,
            durationMs: voicedDurMs,
            estimatedHarakat:
              Math.round((voicedDurMs / 280) * 10) / 10
          });
        }
      }
    }

    let clarityGrade:
      | 'excellent'
      | 'acceptable'
      | 'noisy'
      | 'unreliable' = 'acceptable';

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
    console.warn(
      'Could not extract acoustic features via Web Audio:',
      err
    );

    return defaultMetrics;
  } finally {
    if (audioCtx && audioCtx.state !== 'closed') {
      try {
        await audioCtx.close();
      } catch {
        // Ignore AudioContext cleanup errors.
      }
    }
  }
}

/**
 * Browser Speech Recognition Helper.
 */
export class BrowserSpeechTranscriber {
  private recognition: any = null;
  private transcript = '';

  start() {
    this.transcript = '';

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'ar-SA';
      this.recognition.continuous = true;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        for (
          let i = event.resultIndex;
          i < event.results.length;
          ++i
        ) {
          if (event.results[i].isFinal) {
            this.transcript +=
              ' ' + event.results[i][0].transcript;
          }
        }
      };

      this.recognition.onerror = () => {
        // Speech recognition is optional.
      };

      this.recognition.start();
    } catch {
      // Speech recognition may be unavailable in WebView.
    }
  }

  stop(): string {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore recognition stop errors.
      }
    }

    return this.transcript.trim();
  }
}

/**
 * Convert a Blob to a base64 data URL.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;

      if (typeof result !== 'string') {
        reject(new Error('تعذر تحويل التسجيل إلى بيانات'));
        return;
      }

      const commaIndex = result.indexOf(',');

      resolve(
        commaIndex >= 0 ? result.slice(commaIndex + 1) : result
      );
    };

    reader.onerror = () => {
      reject(reader.error || new Error('تعذر قراءة التسجيل'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Create a synthetic reference tone.
 */
export function playSyntheticQiraahTone(
  frequency = 220,
  durationMs = 800
) {
  let ctx: AudioContext | null = null;

  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) return;

    ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    osc.frequency.exponentialRampToValueAtTime(
      frequency * 1.02,
      ctx.currentTime + durationMs / 2000
    );

    osc.frequency.exponentialRampToValueAtTime(
      frequency,
      ctx.currentTime + durationMs / 1000
    );

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.2,
      ctx.currentTime + 0.05
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + durationMs / 1000
    );

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.onended = () => {
      void ctx?.close().catch(() => {});
    };

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e);

    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => {});
    }
  }
}

/**
 * Audio Recorder class managing MediaRecorder and live AnalyserNode.
 */
export class RecitationRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private startTime = 0;
  private animationFrameId: number | null = null;

  async start(
    onAudioData?: (dataArray: Uint8Array) => void
  ): Promise<boolean> {
    try {
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        throw new Error(
          'المتصفح الداخلي لا يدعم الوصول إلى الميكروفون'
        );
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new Error(
          'مسجل الصوت غير مدعوم في هذا الجهاز'
        );
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioChunks = [];
      this.startTime = Date.now();

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();

        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const source =
          this.audioContext.createMediaStreamSource(this.mediaStream);

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        source.connect(this.analyser);

        if (onAudioData) {
          const bufferLength = this.analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const update = () => {
            if (
              this.mediaRecorder &&
              this.mediaRecorder.state === 'recording' &&
              this.analyser
            ) {
              this.analyser.getByteFrequencyData(dataArray);
              onAudioData(dataArray);

              this.animationFrameId =
                requestAnimationFrame(update);
            }
          };

          this.animationFrameId =
            requestAnimationFrame(update);
        }
      }

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];

      let selectedMime = '';

      for (const mime of mimeTypes) {
        try {
          if (MediaRecorder.isTypeSupported(mime)) {
            selectedMime = mime;
            break;
          }
        } catch {
          // Try the next format.
        }
      }

      this.mediaRecorder = selectedMime
        ? new MediaRecorder(this.mediaStream, {
            mimeType: selectedMime
          })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
      };

      this.mediaRecorder.start(250);

      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);

      this.mediaStream?.getTracks().forEach(track => track.stop());
      this.mediaStream = null;

      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      if (
        this.audioContext &&
        this.audioContext.state !== 'closed'
      ) {
        try {
          await this.audioContext.close();
        } catch {
          // Ignore cleanup errors.
        }
      }

      this.audioContext = null;
      this.analyser = null;

      return false;
    }
  }

  stop(): Promise<AudioRecordingResult> {
    return new Promise((resolve) => {
      const recorder = this.mediaRecorder;
      const durationMs = Date.now() - this.startTime;

      const cleanup = async () => {
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }

        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.mediaStream = null;

        if (
          this.audioContext &&
          this.audioContext.state !== 'closed'
        ) {
          try {
            await this.audioContext.close();
          } catch {
            // Ignore cleanup errors.
          }
        }

        this.audioContext = null;
        this.analyser = null;
        this.mediaRecorder = null;
      };

      const emptyResult = (
        mimeType = 'audio/webm'
      ): AudioRecordingResult => ({
        blob: new Blob([], { type: mimeType }),
        base64: '',
        durationMs,
        snrDb: 0,
        mimeType
      });

      if (!recorder) {
        void cleanup();
        resolve(emptyResult());
        return;
      }

      if (recorder.state === 'inactive') {
        const mimeType = recorder.mimeType || 'audio/webm';

        void cleanup();
        resolve(emptyResult(mimeType));
        return;
      }

      let resolved = false;

      recorder.onstop = async () => {
        if (resolved) return;
        resolved = true;

        const mimeType = recorder.mimeType || 'audio/webm';

        try {
          const audioBlob = new Blob(this.audioChunks, {
            type: mimeType
          });

          if (audioBlob.size === 0) {
            console.error(
              'Recording stopped but no audio data was received.'
            );

            resolve(emptyResult(mimeType));
            return;
          }

          const base64 = await blobToBase64(audioBlob);
          const acousticMetrics =
            await extractAcousticFeatures(audioBlob);

          resolve({
            blob: audioBlob,
            base64,
            durationMs:
              acousticMetrics.durationMs || durationMs,
            snrDb: acousticMetrics.snrDb,
            mimeType,
            acousticMetrics
          });
        } catch (error) {
          console.error('Audio finalization failed:', error);
          resolve(emptyResult(mimeType));
        } finally {
          await cleanup();
        }
      };

      recorder.onerror = (event: Event) => {
        console.error('MediaRecorder stopped with an error:', event);
      };

      try {
        recorder.stop();
      } catch (error) {
        console.error('Could not stop MediaRecorder:', error);

        if (!resolved) {
          resolved = true;
          void cleanup();
          resolve(emptyResult(recorder.mimeType || 'audio/webm'));
        }
      }
    });
  }
}
