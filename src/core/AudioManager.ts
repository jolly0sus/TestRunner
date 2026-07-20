import { Howl, Howler } from 'howler';
import { AUDIO_URLS, type SoundKey } from './assets';

/**
 * Thin wrapper over Howler for background music + one-shot SFX.
 * Playback is unlocked on the first user gesture (mobile autoplay policy).
 */
export class AudioManager {
  private sounds = new Map<SoundKey, Howl>();
  private musicId: number | null = null;
  private muted = false;

  load(): void {
    (Object.entries(AUDIO_URLS) as [SoundKey, string][]).forEach(
      ([key, url]) => {
        this.sounds.set(
          key,
          new Howl({
            src: [url],
            loop: key === 'music',
            volume: key === 'music' ? 0.4 : 0.7,
            preload: true,
          }),
        );
      },
    );
  }

  play(key: SoundKey): void {
    if (this.muted) return;
    this.sounds.get(key)?.play();
  }

  startMusic(): void {
    if (this.muted) return;
    const music = this.sounds.get('music');
    if (music && this.musicId === null) {
      this.musicId = music.play();
    }
  }

  stopMusic(): void {
    const music = this.sounds.get('music');
    if (music && this.musicId !== null) {
      music.stop(this.musicId);
      this.musicId = null;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    Howler.mute(this.muted);
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
