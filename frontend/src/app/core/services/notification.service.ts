import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 6000, politeness: 'assertive' });
  }
}
