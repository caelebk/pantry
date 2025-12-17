import { CommonModule } from '@angular/common';
import { Component, effect, input, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'pantry-stat-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './stat-card.component.html',
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<number>();
  subtitle = input<string>();
  valueColor = input<string>('text-gray-900 dark:text-white');

  // Animation configuration constants
  private readonly EASING_POWER = 3; // Cubic easing
  private readonly ANIMATION_COMPLETE = 1; // Progress value when animation is complete
  private readonly EASING_INVERT = 1; // Used to invert progress for ease-out effect
  private readonly SMALL_CHANGE_THRESHOLD = 10;
  private readonly MEDIUM_CHANGE_THRESHOLD = 50;
  private readonly LARGE_CHANGE_THRESHOLD = 100;
  private readonly SMALL_CHANGE_DURATION_MS = 500;
  private readonly MEDIUM_CHANGE_DURATION_MS = 1000;
  private readonly LARGE_CHANGE_DURATION_MS = 1500;
  private readonly XLARGE_CHANGE_DURATION_MS = 2000;

  // Display value for the animated ticker
  displayValue = signal(0);
  private animationFrameId?: number;

  constructor() {
    effect(() => {
      const targetValue = this.value();
      this.animateValue(targetValue);
    });
  }

  private animateValue(target: number): void {
    // Cancel any ongoing animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const start = this.displayValue();
    const change = target - start;

    // Calculate duration based on the magnitude of change
    const duration = this.calculateDuration(Math.abs(change));
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, this.ANIMATION_COMPLETE);

      // Easing function
      const easeProgress =
        this.EASING_INVERT - Math.pow(this.EASING_INVERT - progress, this.EASING_POWER);

      const currentValue = start + change * easeProgress;
      this.displayValue.set(Math.round(currentValue));

      if (progress < this.ANIMATION_COMPLETE) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private calculateDuration(change: number): number {
    // Scale duration based on the magnitude of change
    if (change <= this.SMALL_CHANGE_THRESHOLD) return this.SMALL_CHANGE_DURATION_MS;
    if (change <= this.MEDIUM_CHANGE_THRESHOLD) return this.MEDIUM_CHANGE_DURATION_MS;
    if (change <= this.LARGE_CHANGE_THRESHOLD) return this.LARGE_CHANGE_DURATION_MS;
    return this.XLARGE_CHANGE_DURATION_MS;
  }
}
