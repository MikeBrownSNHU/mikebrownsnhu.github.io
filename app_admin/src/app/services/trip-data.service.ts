import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { Trip } from '../models/trip';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { BROWSER_STORAGE } from '../storage';

/**
 * Response envelope from the enhanced GET /api/trips endpoint.
 * Contains paginated data array and metadata.
 */
interface TripListResponse {
  data: Trip[];
  meta: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

@Injectable({
  providedIn: 'root'
})

export class TripDataService {

  constructor(
    private http: HttpClient,
    @Inject(BROWSER_STORAGE) private storage: Storage
    ) {}

  url = 'http://localhost:3000/api/trips';
  baseUrl = 'http://localhost:3000/api';
  
  /**
   * Gets all trips from the API.
   * Maps the paginated envelope response to extract just the data array
   * for backward compatibility with existing components.
   */
  getTrips() : Observable<Trip[]> {
    return this.http.get<TripListResponse>(this.url).pipe(
      map(response => response.data)
    );
  }

  addTrip(formData: Trip) : Observable<Trip> {
    return this.http.post<Trip>(this.url, formData);
  }

  // Get a single trip by code
  getTrip(tripCode: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.url}/${tripCode}`);
  }

  // Update an existing trip
  updateTrip(formData: Trip): Observable<Trip> {
    return this.http.put<Trip>(`${this.url}/${formData.code}`, formData);
  }

  // Call to our /login endpoint, returns JWT
  login(user: User, passwd: string) : Observable<AuthResponse> {
    // console.log('Inside TripDataService::login');
    return this.handleAuthAPICall('login', user, passwd);
  }

  // Call to our /register endpoint, creates user and returns JWT
  register(user: User, passwd: string) : Observable<AuthResponse> {
    // console.log('Inside TripDataService::register');
    return this.handleAuthAPICall('register', user, passwd);
  }

  // helper method to process both login and register methods
  handleAuthAPICall(endpoint: string, user: User, passwd: string) : Observable<AuthResponse> {
    // console.log('Inside TripDataService::handleAuthAPICall');
    let formData = {
      name: user.name,
      email: user.email,
      password: passwd
    };

    return this.http.post<AuthResponse>(this.baseUrl + '/' + endpoint, formData);
  }
}
