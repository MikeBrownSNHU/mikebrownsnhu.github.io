/**
 * @file login.component.ts
 * @description Login page component for the admin SPA.
 *
 * Enhancement Notes (CS-499 Category 1 - Software Engineering & Design):
 * - Removed the setTimeout race condition. The original used a 3-second delay
 *   hoping the async login would finish in time. This is unreliable - if the
 *   server is slow the redirect fails, if it's fast the user waits for nothing.
 * - Refactored to use the Observable directly from the auth service so we
 *   redirect on actual success instead of guessing with a timer.
 * - Added user feedback while login is in progress
 *
 * @author Mike Brown
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { TripDataService } from '../services/trip-data.service';
import { User } from '../models/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  public formError: string = '';
  public isLoading: boolean = false;
  submitted = false;

  credentials = {
    name: '',
    email: '',
    password: ''
  };

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private tripDataService: TripDataService
  ) {}

  ngOnInit(): void {
    // If user is already logged in, just send them to the main page
    if (this.authenticationService.isLoggedIn()) {
      this.router.navigate(['']);
    }
  }

  public onLoginSubmit(): void {
    this.formError = '';

    if (!this.credentials.email || !this.credentials.password || !this.credentials.name) {
      this.formError = 'All fields are required, please try again';
      return; // Don't navigate away on validation failure
    }

    this.doLogin();
  }

  /**
   * Performs the actual login by calling the API directly and handling
   * the response. Replaces the old approach that used a fire-and-forget
   * service method + a setTimeout to check if it worked.
   */
  private doLogin(): void {
    this.isLoading = true;
    this.formError = '';

    const user = {
      name: this.credentials.name,
      email: this.credentials.email
    } as User;

    // Call the trip data service directly so we get the Observable back
    // and can react to success/failure properly
    this.tripDataService.login(user, this.credentials.password).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.token) {
          // Save the token and redirect
          this.authenticationService.saveToken(response.token);
          this.router.navigate(['']);
        } else {
          this.formError = 'Login failed - no token received';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.formError = 'Login failed. Please check your credentials.';
        console.log('Login error:', error);
      }
    });
  }
}
