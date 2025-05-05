import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from './Components/Register';
import 'whatwg-fetch';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => mockNavigate),
}));

global.fetch = jest.fn();

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the registration form with the initial email step', () => {
    renderComponent();
    expect(screen.getByText('Regisztráció')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email cím/i)).toBeInTheDocument();
    expect(screen.getByText('Tovább →')).toBeInTheDocument();
    expect(screen.queryByText('← Vissza')).not.toBeInTheDocument();
  });

  it('validates email and shows error for invalid format, then proceeds with a valid email', async () => {
    renderComponent();
    const emailInput = screen.getByLabelText(/Email cím/i);
    const nextButton = screen.getByText('Tovább →');

    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.click(nextButton);
    expect(screen.getByText('Érvénytelen email formátum.')).toBeInTheDocument();

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'valid@email.com');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Profil beállítások')).toBeInTheDocument();
    });
  });

  it('validates age correctly, showing error for underage and proceeding with valid age', async () => {
    renderComponent();
    const emailInput = screen.getByLabelText(/Email cím/i);
    const nextButton = screen.getByText('Tovább →');

    await userEvent.type(emailInput, 'valid@email.com');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Profil beállítások')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText(/Felhasználónév/i), 'testuser');
    const dobInput = screen.getByLabelText(/Születési dátum/i);

    const today = new Date();
    const underageDate = new Date(today);
    underageDate.setFullYear(today.getFullYear() - 17);
    fireEvent.change(dobInput, { target: { value: underageDate.toISOString().split('T')[0] } });
    fireEvent.click(nextButton);
    expect(screen.getByText('Legalább 18 évesnek kell lenned!')).toBeInTheDocument();

    const validAgeDate = new Date(today);
    validAgeDate.setFullYear(today.getFullYear() - 20);
    fireEvent.change(dobInput, { target: { value: validAgeDate.toISOString().split('T')[0] } });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Biztonság')).toBeInTheDocument();
    });
  });

  it('validates password and confirm password correctly', async () => {
    renderComponent();
    const emailInput = screen.getByLabelText(/Email cím/i);
    const nextButton = screen.getByText('Tovább →');

    await userEvent.type(emailInput, 'valid@email.com');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Profil beállítások')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText(/Felhasználónév/i), 'testuser');
    const dobInput = screen.getByLabelText(/Születési dátum/i);
    const today = new Date();
    const validAgeDate = new Date(today);
    validAgeDate.setFullYear(today.getFullYear() - 20);
    fireEvent.change(dobInput, { target: { value: validAgeDate.toISOString().split('T')[0] } });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Biztonság')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/Jelszó\* \(minimum/i);
    const confirmPasswordInput = screen.getByLabelText(/Jelszó megerősítése/i);

    await userEvent.type(passwordInput, '12345');
    await userEvent.type(confirmPasswordInput, '12345');
    fireEvent.click(nextButton);
    expect(screen.getByText('A jelszónak legalább 6 karakter hosszúnak kell lennie.')).toBeInTheDocument();

    await userEvent.clear(passwordInput);
    await userEvent.clear(confirmPasswordInput);
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password456');
    fireEvent.click(nextButton);
    expect(screen.getByText('A jelszavak nem egyeznek!')).toBeInTheDocument();

    await userEvent.clear(confirmPasswordInput);
    await userEvent.type(confirmPasswordInput, 'password123');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Helyzet')).toBeInTheDocument();
    });
  });
});