import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth/login', component: DummyLoginComponent }]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize with null access token and unauthenticated status', () => {
    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should store access token in memory when setAccessToken is called', () => {
    service.setAccessToken('test-access-token-123');
    expect(service.getAccessToken()).toBe('test-access-token-123');
  });

  it('should perform signup and update user signal state', () => {
    const mockSignupResponse = {
      status: 'success',
      data: {
        user: { id: 'usr_1', email: 'test@pantry.app', fullName: 'Test Chef', globalRole: 'user' },
        accessToken: 'signed-access-token',
        expiresIn: 900,
      },
    };

    service
      .signup({ email: 'test@pantry.app', password: 'Password123!', fullName: 'Test Chef' })
      .subscribe((res) => {
        expect(res.accessToken).toBe('signed-access-token');
        expect(service.currentUser()?.email).toBe('test@pantry.app');
      });

    const req = httpMock.expectOne('/api/v1/auth/signup');
    expect(req.request.method).toBe('POST');
    req.flush(mockSignupResponse);

    const profileReq = httpMock.expectOne('/api/v1/me/profile');
    profileReq.flush({
      status: 'success',
      data: {
        user: mockSignupResponse.data.user,
        memberships: [
          { id: 'ktc_1', name: 'Personal Kitchen', role: 'owner', createdAt: '', updatedAt: '' },
        ],
      },
    });
  });

  it('should clear auth state on logout', () => {
    service.setAccessToken('token-123');
    service.logout().subscribe();

    const req = httpMock.expectOne('/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(service.getAccessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
