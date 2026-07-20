import { COURSE, DISTANCE_UNIT, type SpawnDef } from '../config';
import { stage } from '../core/stage';

/**
 * Walks the fixed COURSE by accumulated travel distance and yields the entities
 * due to appear. Entities enter just off the right edge and scroll left.
 *
 * The spawn threshold subtracts the current lead distance (how far the entity
 * must travel from the right edge to reach the player) so that every entity
 * ARRIVES at the player at the same course position regardless of screen width
 * — the course plays identically in portrait and landscape.
 */
export class Spawner {
  private index = 0;

  /** Spawn point: just off the right edge of the current stage. */
  static get spawnX(): number {
    return stage.width + 220;
  }

  reset(): void {
    this.index = 0;
  }

  /**
   * Return every course entry whose spawn threshold has been reached.
   * @param distanceTraveled accumulated world travel, in design px
   * @param leadDistance     spawnX - playerX (world px the entity crosses)
   */
  collect(distanceTraveled: number, leadDistance: number): SpawnDef[] {
    const due: SpawnDef[] = [];
    while (this.index < COURSE.length) {
      const def = COURSE[this.index];
      const threshold = def.distance * DISTANCE_UNIT - leadDistance;
      if (distanceTraveled >= threshold) {
        due.push(def);
        this.index += 1;
      } else {
        break;
      }
    }
    return due;
  }

  get finished(): boolean {
    return this.index >= COURSE.length;
  }
}
