import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import '../Styles/Register.css'; // Make sure the path is correct

const calculateAge = (dobString) => {
    if (!dobString) return 0; // Handle case where dob is not yet set
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const Register = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    dob: '', // Születési dátum (YYYY-MM-DD string)
    
    location: '', // Lakhely
    sex: 'female', // Alapértelmezett lehet 'female' vagy 'male'
    searchedSex: 'male', // Alapértelmezett
    minAge: '',
    maxAge: '',
    bio: '',
  });

    const [step, setStep] = useState(0);
    const [visitedSteps, setVisitedSteps] = useState([true, false, false, false, false, false, false, false]);
    // State to hold validation errors for the current step
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

  // Regisztrációs lépések definíciója
  const steps = [
    {
      label: "Email",
      content: (
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      ),
      // Egyszerű email formátum ellenőrzés
      isValid: () => /\S+@\S+\.\S+/.test(formData.email),
    },
    {
      label: "Felhasználónév",
      content: (
        <div className="form-group">
          <label>Felhasználónév</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
        </div>
      ),
      isValid: () => formData.username.trim() !== "",
    },
    {
      label: "Jelszó",
      content: (
        <div className="form-group">
          <label>Jelszó (minimum 6 karakter)</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6} // HTML5 validáció segítésére
          />
          <label>Jelszó megerősítése</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          {/* Dinamikus hibaüzenet jelszó eltérésre */}
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="error-message">A jelszavak nem egyeznek!</p>
          )}
           {/* Dinamikus hibaüzenet túl rövid jelszóra */}
           {formData.password && formData.password.length < 6 && (
            <p className="error-message">A jelszónak legalább 6 karakternek kell lennie.</p>
          )}
        </div>
      ),
      // Érvényes, ha a jelszó min 6 karakter ÉS a két jelszó mező egyezik
      isValid: () => formData.password.length >= 6 && formData.password === formData.confirmPassword,
    },
    {
      label: "Születési dátum",
      content: (
        <div className="form-group">
          <label>Születési dátum</label>
          <input
            type="date" // Dátumválasztó
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            max={new Date().toISOString().split("T")[0]} // Max dátum a mai nap
            required
          />
           {/* Dinamikus hibaüzenet, ha a kor nem megfelelő */}
           {formData.dob && calculateAge(formData.dob) < 18 && (
             <p className="error-message">A regisztrációhoz legalább 18 évesnek kell lenned.</p>
           )}
        </div>
      ),
      // Érvényes, ha van dátum ÉS az életkor >= 18
      isValid: () => {
          if (!formData.dob) return false; // Dátum megadása kötelező
          const age = calculateAge(formData.dob);
          return age >= 18; // Minimum korhatár ellenőrzése
      },
    },
    {
      label: "Lakhely", // Új lépés
      content: (
        <div className="form-group">
          <label>Lakhely (város)</label>
          <input
            type="text"
            value={formData.location}
            placeholder="Pl. Budapest"
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
      ),
      // Érvényes, ha nem üres a mező (trim() eltávolítja a szóközöket az elejéről/végéről)
      isValid: () => formData.location.trim() !== "",
    },
    {
      label: "Nemed",
      content: (
        <div className="form-group">
          <label>Nemed</label>
          <select
            value={formData.sex}
            onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
          >
            <option value="female">Nő</option>
            <option value="male">Férfi</option>
            {/* <option value="other">Egyéb</option> */}
          </select>
        </div>
      ),
      // Mindig érvényes, mert van alapértelmezett érték és választani kell
      isValid: () => true,
    },
    {
      label: "Partner neme",
      content: (
        <div className="form-group">
          <label>Milyen nemű partnert keresel?</label>
          <select
            value={formData.searchedSex}
            onChange={(e) => setFormData({ ...formData, searchedSex: e.target.value })}
          >
            <option value="male">Férfi</option>
            <option value="female">Nő</option>
            {/* <option value="both">Mindegy</option> */}
          </select>
        </div>
      ),
      // Érvényes, ha van érték (ami itt mindig van az alapértelmezett miatt)
      isValid: () => !!formData.searchedSex,
    },
    {
      label: "Korhatárok",
      content: (
        <div className="form-group">
          <div className="age-range">
            <div>
              <label>Minimum kor</label>
              <input
                type="number"
                min="18"
                max="120" // Reálisabb felső határ
                value={formData.minAge}
                onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Maximum kor</label>
              <input
                type="number"
                min="18"
                max="120" // Reálisabb felső határ
                value={formData.maxAge}
                onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                required
              />
            </div>
          </div>
          {/* Dinamikus hibaüzenet, ha a min > max */}
          {formData.minAge && formData.maxAge && parseInt(formData.minAge) > parseInt(formData.maxAge) && (
            <p className="error-message">A minimum kor nem lehet nagyobb a maximumnál!</p>
          )}
        </div>
      ),
      // Érvényes, ha mindkét érték megvan, 18 és 120 között van, ÉS min <= max
      isValid: () => {
          const min = parseInt(formData.minAge);
          const max = parseInt(formData.maxAge);
          // NaN ellenőrzés fontos, ha a bemenet nem szám
          if (isNaN(min) || isNaN(max)) return false;
          return min >= 18 && max >= 18 && max <= 120 && min <= max;
      }
    },
    {
      label: "Bemutatkozás",
      content: (
        <div className="form-group">
          <label>Rövid bemutatkozás (minimum 10 karakter)</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            minLength="10" // HTML5 validáció
            required
            rows={4} // Jobb láthatóságért
          />
           {/* Dinamikus hibaüzenet */}
           {formData.bio && formData.bio.trim().length < 10 && (
             <p className="error-message">A bemutatkozásnak legalább 10 karakter hosszúnak kell lennie.</p>
           )}
        </div>
      ),
      isValid: () => formData.bio.trim().length >= 10,
    },
  ];

  // Vissza lépés
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // Tovább lépés (a frissített logikával)
  const handleNext = () => {
    const currentStep = steps[step]; // Aktuális lépés objektuma

    // 1. Ellenőrizzük az aktuális lépés érvényességét az isValid függvénnyel
    if (currentStep.isValid()) {
        // Opcionális extra ellenőrzések itt, pl. korhatár min < max
        if (currentStep.label === "Korhatárok" && formData.minAge && formData.maxAge && parseInt(formData.minAge) > parseInt(formData.maxAge)) {
             alert("A minimum kor nem lehet nagyobb a maximumnál!");
             return; // Ne lépjen tovább, hiába lenne az isValid() igaz
         }

        // 3. Ha minden rendben, lépjünk a következő lépésre
        setStep(step + 1);

    } else {
        // 4. Ha az aktuális lépés NEM érvényes (isValid() false-t adott vissza)
        //    Adjunk specifikusabb hibaüzenetet, ha lehetséges.

        if (currentStep.label === "Születési dátum") {
            // Ha a születési dátum lépés érvénytelen, ÉS van megadott dátum,
            // akkor az csak azért lehet, mert a kor < 18.
            if (formData.dob && calculateAge(formData.dob) < 18) { // Explicit kor ellenőrzés itt a hibaüzenethez
                alert("A regisztrációhoz legalább 18 évesnek kell lenned.");
            } else {
                // Ha nincs dátum megadva, vagy más (valószínűtlen) hiba van a dátummal
                alert("Kérjük, add meg az érvényes születési dátumodat.");
            }
        } else if (currentStep.label === "Jelszó") {
            // Specifikusabb hiba a jelszóra
            if (formData.password.length < 6) {
                alert("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
            } else if (formData.password !== formData.confirmPassword) {
                alert("A megadott jelszavak nem egyeznek.");
            } else {
                alert("Kérjük, add meg a jelszót és erősítsd meg."); // Általános jelszó hiba
            }
        } else if (currentStep.label === "Korhatárok") {
             // Specifikusabb hiba a korhatárokra
            if (formData.minAge && formData.maxAge && parseInt(formData.minAge) > parseInt(formData.maxAge)) {
                alert("A minimum kor nem lehet nagyobb a maximumnál!");
            } else if (!formData.minAge || !formData.maxAge) {
                 alert("Kérjük, add meg a minimum és maximum korhatárt.");
            } else {
                 alert("Kérjük, érvényes korhatárokat adj meg (18 és 120 között, minimum <= maximum)."); // Általános korhatár hiba
            }
        } else if (currentStep.label === "Bemutatkozás") {
             alert("A bemutatkozásnak legalább 10 karakter hosszúnak kell lennie.");
        }
        // ... további specifikus hibaüzenetek más lépésekhez ...
        else {
            // Általános hibaüzenet minden más érvénytelen lépésre
            alert(`Kérjük, töltsd ki helyesen a(z) "${currentStep.label}" mezőt!`);
        }
        // Mivel a lépés érvénytelen volt, itt NEM hívjuk meg a setStep(step + 1)-et.
    }
  };


  // Űrlap elküldése
  const handleSubmit = async (e) => {
    e.preventDefault(); // Megakadályozza az oldal újratöltődését

    // Végső ellenőrzés az összes lépésre (bár a handleNext már sokat kezel)
    for (let i = 0; i < steps.length; i++) {
        if (!steps[i].isValid()) {
            alert(`Hiba a(z) "${steps[i].label}" lépésnél. Kérjük, ellenőrizd az adataidat.`);
            setStep(i); // Opcionálisan ugorjunk az első hibás lépésre
            return; // Megszakítjuk a küldést
        }
    }

    // Ha minden rendben van, elküldjük az adatokat
    try {
        console.log("Küldendő adatok:", { // Konzol log a teszteléshez
            email: formData.email,
            username: formData.username,
            password: formData.password, // Fontos: Csak HTTPS-en küldd!
            dob: formData.dob,           // Születési dátum (string)
            location: formData.location, // Lakhely
            sex: formData.sex,
            searchedSex: formData.searchedSex,
            // Korhatárokat érdemes számként küldeni
            minAge: parseInt(formData.minAge),
            maxAge: parseInt(formData.maxAge),
            bio: formData.bio,
        });

        // Fetch API hívás a backendhez
        const response = await fetch('http://localhost:5000/auth/register', { // Cseréld le a valós API végpontodra
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Szükség esetén Authorization header (pl. JWT tokenhez később)
                // 'Authorization': `Bearer ${token}`
            },
            // A formData állapotot alakítjuk JSON stringgé
            body: JSON.stringify({
                email: formData.email,
                username: formData.username,
                password: formData.password,
                dob: formData.dob,
                location: formData.location,
                sex: formData.sex,
                searchedSex: formData.searchedSex,
                minAge: parseInt(formData.minAge),
                maxAge: parseInt(formData.maxAge),
                bio: formData.bio,
            }),
            // credentials: 'include', // Ha cookie-kat (pl. session) kell küldeni/fogadni
        });

        // Feldolgozzuk a backend válaszát
        const data = await response.json();

        if (!response.ok) {
            // Ha a backend hibát jelzett (status kód nem 2xx)
            throw new Error(data.message || `Szerverhiba: ${response.status}`);
        }

        // Sikeres regisztráció esetén
        console.log("Sikeres regisztráció:", data);
        alert("Sikeres regisztráció! 🎉 Most átirányítunk a bejelentkezéshez.");
        navigate("/login"); // Átirányítás a bejelentkezési oldalra

    } catch (error) {
        // Hiba történt a hálózati kérés vagy a feldolgozás során
        console.error("Regisztrációs hiba:", error);
        alert(`Hiba történt a regisztráció során: ${error.message}`);
    }
  };

    // Use the actual errors state to determine if the button should *logically* proceed,
    // though the visual disabling might still use the simpler isValid for immediate feedback.
    const isCurrentStepValidForProceeding = Object.keys(validateStep(step, formData)).length === 0;
    // Keep simpler check for button visual state if preferred:
    const isCurrentStepValidForButton = steps[step]?.isValid() ?? false;


    return (
        <div className="auth-container">
            {/* Header */}
            <div className="registration-header">
                <h1>Regisztráció</h1>
                <p>Hozd létre a profilodat és találd meg a számodra ideális partnert!</p>
            </div>

            {/* Progress Dots */}
            <ol className="progress-indicator" aria-label="Regisztráció folyamata">
                {steps.map((s, index) => ( <li key={`dot-${index}`} className={`progress-dot ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''}`} aria-current={index === step ? 'step' : undefined}></li> ))}
            </ol>

            {/* Step Tabs */}
            <div className="step-indicator" role="tablist" aria-label="Regisztrációs lépések">
                {steps.map((s, index) => ( <button key={`tab-${index}`} id={`step-tab-${index}`} className={`step ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''} ${!visitedSteps[index] ? 'locked' : ''}`} onClick={() => handleStepClick(index)} disabled={!visitedSteps[index]} role="tab" aria-selected={index === step} aria-controls={`step-panel-${index}`}> {s.label} {index < step && visitedSteps[index] && <div className="step-status" aria-hidden="true">✓</div>} </button> ))}
            </div>

            {/* Form element */}
            <form onSubmit={handleSubmit} noValidate>
                {/* Scrollable Step Content */}
                <div
                    className="step-content"
                    role="tabpanel"
                    id={`step-panel-${step}`}
                    aria-labelledby={`step-tab-${step}`}
                >
                    {/* Render current step content - errors are now displayed within */}
                    {steps[step]?.content}
                </div>

                 {/* Navigation Buttons */}
                <div className="navigation-buttons">
                    <div className="step-counter" aria-live="polite"> {step + 1} / {steps.length} lépés </div>
                    {step > 0 && ( <button type="button" className="nav-button back-button" onClick={handleBack}> ← Vissza </button> )}
                    {/* Use the simpler isValid for quick visual disabling, but handleNext/Submit does the real check */}
                    {step < steps.length - 1 ? (
                        <button
                            type="button"
                            className="nav-button next-button"
                            onClick={handleNext}
                            // disabled={!isCurrentStepValidForButton} // Or keep this for visual cue
                            // aria-disabled={!isCurrentStepValidForButton}
                        > Tovább → </button>
                     ) : (
                        <button
                            type="submit"
                            className="nav-button submit-button"
                            // disabled={!isCurrentStepValidForButton} // Or keep this for visual cue
                            // aria-disabled={!isCurrentStepValidForButton}
                         > Regisztráció Befejezése </button>
                     )}
                </div>
            </form>

             {/* Login Redirect */}
            <div className="login-redirect">
                <p>Már van fiókod? <a href="/login">Jelentkezz be itt</a></p>
            </div>
        </div>
    );
};

export default Register;