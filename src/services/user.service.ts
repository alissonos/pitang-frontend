import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:8081/api/v1/users'; //

  constructor(private http: HttpClient, private authService: AuthService) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`);
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  updateUser(userId: number, userData: any) {
    const token = this.authService?.getToken(); // método que retorna o JWT do localStorage ou variável
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put(`${this.apiUrl}/${userId}`, userData, { headers });
  }
}
