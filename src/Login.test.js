import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './Components/Login';
import 'whatwg-fetch';

jest.spyOn(console, 'log').mockImplementation(() => {});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => mockNavigate),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

global.fetch = jest.fn();

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form with required fields and elements', () => {
    renderComponent();
    expect(screen.getByText('Üdv újra!')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jelszó/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bejelentkezés/i })).toBeInTheDocument();
    expect(screen.getByText(/Regisztráljon itt/i)).toBeInTheDocument();
  });

  it('handles input changes in email and password fields', async () => {
    renderComponent();
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Jelszó/i);

    await userEvent.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');

    await userEvent.type(passwordInput, 'securepassword123');
    expect(passwordInput).toHaveValue('securepassword123');
  });

  it('submits the form with valid credentials and handles successful login', async () => {
    const fakeAccessToken = 'fake-jwt-token';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: fakeAccessToken }),
    });

    renderComponent();
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Jelszó/i);
    const submitButton = screen.getByRole('button', { name: /Bejelentkezés/i });

    await userEvent.type(emailInput, 'valid@example.com');
    await userEvent.type(passwordInput, 'validpassword');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'valid@example.com', password: 'validpassword' }),
          withCredentials: true,
        })
      );
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', fakeAccessToken);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mainScreen');
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits the form with invalid credentials and shows an error message', async () => {
    const errorMessage = 'Hibás email vagy jelszó';
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage }),
    });

    renderComponent();
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Jelszó/i);
    const submitButton = screen.getByRole('button', { name: /Bejelentkezés/i });

    await userEvent.type(emailInput, 'invalid@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a generic error message on network or server error', async () => {
    const networkErrorMessage = 'Network error';
    global.fetch.mockRejectedValueOnce(new Error(networkErrorMessage));

    renderComponent();
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Jelszó/i);
    const submitButton = screen.getByRole('button', { name: /Bejelentkezés/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText(networkErrorMessage)).toBeInTheDocument();
    });

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('has a link to the registration page', () => {
    renderComponent();
    const registerLink = screen.getByText(/Regisztráljon itt/i);

    expect(registerLink).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Regisztráljon itt/i })).toHaveAttribute('href', '/register');
  });
});