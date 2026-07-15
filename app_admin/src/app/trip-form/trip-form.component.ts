/**
 * @file trip-form.component.ts
 * @description Shared reusable form component for trip add/edit operations.
 *
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - The original codebase had two nearly identical components (add-trip and
 *   edit-trip) with the same form template duplicated. This violates DRY
 *   (Don't Repeat Yourself). Created this shared component that both can use.
 * - Uses @Input() to receive initial data and mode ('add' vs 'edit')
 * - Uses @Output() to emit the form data back to the parent on submit
 * - Parent components handle the API call logic, this just handles the form
 *
 * @author Mike Brown
 */

import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trip-form.component.html',
  styleUrl: './trip-form.component.css'
})
export class TripFormComponent implements OnInit, OnChanges {
  /** Whether this is an 'add' or 'edit' form - changes the heading */
  @Input() mode: 'add' | 'edit' = 'add';

  /** Trip data to pre-fill (used in edit mode) */
  @Input() tripData: any = null;

  /** Emits the form value when submitted and valid */
  @Output() formSubmit = new EventEmitter<any>();

  public tripForm!: FormGroup;
  submitted = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    // Build the reactive form with validators
    this.tripForm = this.formBuilder.group({
      _id: [null],
      code: ['', Validators.required],
      name: ['', Validators.required],
      length: ['', Validators.required],
      start: ['', Validators.required],
      resort: ['', Validators.required],
      perPerson: ['', Validators.required],
      image: ['', Validators.required],
      description: ['', Validators.required]
    });

    // If we already have trip data on init, patch it in
    if (this.tripData) {
      this.tripForm.patchValue(this.tripData);
    }
  }

  /**
   * Watches for changes to the tripData input.
   * This fires when the parent component fetches trip data async
   * and passes it down after the component already initialized.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tripData'] && this.tripForm && changes['tripData'].currentValue) {
      this.tripForm.patchValue(changes['tripData'].currentValue);
    }
  }

  /**
   * Form submission handler.
   * Only emits if the form passes validation.
   */
  public onSubmit(): void {
    this.submitted = true;
    if (this.tripForm.valid) {
      this.formSubmit.emit(this.tripForm.value);
    }
  }

  // Helper to access form controls in the template
  get f() { return this.tripForm.controls; }
}
