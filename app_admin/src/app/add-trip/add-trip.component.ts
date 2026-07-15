/**
 * @file add-trip.component.ts
 * @description Handles creating a new trip via the API.
 *
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Refactored to use the shared TripFormComponent instead of duplicating
 *   the entire form template. This component now only handles the submit
 *   logic (calling the service), while the form UI lives in trip-form.
 *
 * @author Mike Brown
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TripDataService } from '../services/trip-data.service';
import { TripFormComponent } from '../trip-form/trip-form.component';

@Component({
  selector: 'app-add-trip',
  standalone: true,
  imports: [CommonModule, TripFormComponent],
  templateUrl: './add-trip.component.html',
  styleUrl: './add-trip.component.css'
})
export class AddTripComponent {

  constructor(
    private router: Router,
    private tripService: TripDataService
  ) {}

  /**
   * Handles form submission from the shared trip-form component.
   * Calls the API to create the trip, then navigates back to the list.
   * @param formData - Trip object emitted from TripFormComponent
   */
  onFormSubmit(formData: any): void {
    this.tripService.addTrip(formData).subscribe({
      next: (data: any) => {
        console.log('Trip added:', data);
        this.router.navigate(['']);
      },
      error: (error: any) => {
        console.log('Error adding trip:', error);
      }
    });
  }
}
