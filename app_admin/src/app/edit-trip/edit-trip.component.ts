/**
 * @file edit-trip.component.ts
 * @description Handles loading and updating an existing trip.
 *
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Refactored to use the shared TripFormComponent (eliminates duplicate template)
 * - Still uses localStorage for trip code passing (will be moved to route params
 *   in Category 2 enhancement), but at least the form duplication is gone
 * - Added error feedback instead of just console.log
 *
 * @author Mike Brown
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TripDataService } from '../services/trip-data.service';
import { TripFormComponent } from '../trip-form/trip-form.component';
import { Trip } from '../models/trip';

@Component({
  selector: 'app-edit-trip',
  standalone: true,
  imports: [CommonModule, TripFormComponent],
  templateUrl: './edit-trip.component.html',
  styleUrl: './edit-trip.component.css'
})
export class EditTripComponent implements OnInit {
  tripData: any = null;
  message: string = '';

  constructor(
    private router: Router,
    private tripDataService: TripDataService
  ) {}

  ngOnInit(): void {
    // Get trip code from localStorage (set by trip-card when user clicks edit)
    const tripCode = localStorage.getItem('tripCode');

    if (!tripCode) {
      this.message = 'Error: No trip code found. Redirecting...';
      this.router.navigate(['']);
      return;
    }

    // Fetch the trip data to pre-fill the form
    this.tripDataService.getTrip(tripCode).subscribe({
      next: (value: any) => {
        // API might return array or single object depending on endpoint
        this.tripData = Array.isArray(value) ? value[0] : value;
        this.message = `Editing trip: ${tripCode}`;
      },
      error: (error: any) => {
        console.log('Error fetching trip:', error);
        this.message = 'Error loading trip data';
      }
    });
  }

  /**
   * Handles form submission from the shared trip-form component.
   * Calls the API to update the trip, then navigates back to the list.
   * @param formData - Updated trip object emitted from TripFormComponent
   */
  onFormSubmit(formData: any): void {
    this.tripDataService.updateTrip(formData).subscribe({
      next: (value: any) => {
        console.log('Trip updated:', value);
        this.router.navigate(['']);
      },
      error: (error: any) => {
        console.log('Error updating trip:', error);
      }
    });
  }
}
