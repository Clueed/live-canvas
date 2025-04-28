/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createWorketFromSrc } from "./audioworklet-registry";
import { audioContext } from "./utils";
import AudioRecordingWorklet from "./worklets/audio-processing";
import VolMeterWorket from "./worklets/vol-meter";
import EventEmitter from "eventemitter3";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    this.starting = new Promise((resolve, reject) => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          this.stream = stream;

          return audioContext({ sampleRate: this.sampleRate });
        })
        .then((audioCtx) => {
          this.audioContext = audioCtx;
          this.source = this.audioContext.createMediaStreamSource(this.stream!);

          const workletName = "audio-recorder-worklet";
          const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

          return this.audioContext.audioWorklet.addModule(src);
        })
        .then(() => {
          if (!this.audioContext) {
            throw new Error("Audio context not initialized");
          }

          const workletName = "audio-recorder-worklet";
          this.recordingWorklet = new AudioWorkletNode(
            this.audioContext,
            workletName,
          );

          this.recordingWorklet.port.onmessage = (ev: MessageEvent) => {
            // worklet processes recording floats and messages converted buffer
            const arrayBuffer = ev.data.data.int16arrayBuffer;

            if (arrayBuffer) {
              const arrayBufferString = arrayBufferToBase64(arrayBuffer);
              this.emit("data", arrayBufferString);
            }
          };
          this.source?.connect(this.recordingWorklet);

          // vu meter worklet
          const vuWorkletName = "vu-meter";

          return this.audioContext.audioWorklet.addModule(
            createWorketFromSrc(vuWorkletName, VolMeterWorket),
          );
        })
        .then(() => {
          if (!this.audioContext) {
            throw new Error("Audio context not initialized");
          }

          const vuWorkletName = "vu-meter";
          this.vuWorklet = new AudioWorkletNode(
            this.audioContext,
            vuWorkletName,
          );
          this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
            this.emit("volume", ev.data.volume);
          };

          this.source?.connect(this.vuWorklet);
          this.recording = true;
          resolve();
          this.starting = null;

          return null;
        })
        .catch((error) => {
          reject(error);
          this.starting = null;

          return null;
        });
    });

    return this.starting;
  }

  stop() {
    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
    };

    if (this.starting) {
      return this.starting.then(handleStop).catch((error) => {
        console.error("Error in start promise:", error);

        return null;
      });
    }

    handleStop();
  }
}
