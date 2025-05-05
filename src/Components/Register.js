import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import '../Styles/Register.css'; // Győződj meg róla, hogy az elérési út helyes

// Segédfüggvény az életkor kiszámításához
const calculateAge = (dobString) => {
    if (!dobString) return 0; // Kezeli, ha a dátum még nincs beállítva
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
    // State az űrlap adatok tárolására
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        dob: '',
        city: '',
        sex: 'female', // Alapértelmezett érték
        searchedSex: 'male', // Alapértelmezett érték
        minAge: '18', // Alapértelmezett érték
        maxAge: '60', // Alapértelmezett érték
        bio: '',
    });

    // State az aktuális lépés és a már meglátogatott lépések követésére
    const [step, setStep] = useState(0); // Csak egyszer inicializáljuk!
    const [visitedSteps, setVisitedSteps] = useState([true, false, false, false, false, false, false, false]);
    // State az aktuális lépés validációs hibáinak tárolására
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    // --- Validációs Logika ---
    // Ellenőrzi a feltételeket egy adott lépéshez és egy hiba objektumot ad vissza
    const validateStep = (stepIndex, data) => {
        const stepErrors = {};
        const currentStepConfig = steps[stepIndex]; // Az aktuális lépés konfigurációja

        if (!currentStepConfig) return {}; // Nem szabadna megtörténnie

        // Segédfüggvény az egyes mezők ellenőrzésére
        const checkField = (fieldName, condition, message) => {
            if (!condition) {
                stepErrors[fieldName] = message;
            }
        };

        switch (stepIndex) {
            case 0: // Email
                checkField('email', /\S+@\S+\.\S+/.test(data.email), 'Érvénytelen email formátum.');
                break;
            case 1: // Profil (Felhasználónév és Szül.dátum)
                checkField('username', data.username.trim().length >= 3, 'A felhasználónév legalább 3 karakter legyen.');
                checkField('dob', data.dob !== '', 'Kérjük, add meg a születési dátumodat.');
                if (data.dob) { // Csak akkor ellenőrizzük a kort, ha van dátum
                   checkField('dob_age', calculateAge(data.dob) >= 18, 'Legalább 18 évesnek kell lenned!');
                }
                break;
            case 2: // Jelszó
                checkField('password', data.password.length >= 6, 'A jelszónak legalább 6 karakter hosszúnak kell lennie.');
                checkField('confirmPassword', data.password === data.confirmPassword, 'A jelszavak nem egyeznek!');
                break;
            case 3: // Lakhely (city)
                checkField('city', data.city.trim() !== "", 'Kérjük, add meg a lakhelyedet.');
                break;
            case 4: // Nemed - Nincs validáció (mindig van érték)
                break;
            case 5: // Partner neme - Nincs validáció (mindig van érték)
                break;
            case 6: // Korhatárok
                const minAge = parseInt(data.minAge, 10);
                const maxAge = parseInt(data.maxAge, 10);
                // Ellenőrizzük, hogy számok-e és 18 felettiek
                checkField('minAge', !isNaN(minAge) && minAge >= 18, 'A minimum kor legalább 18 legyen!');
                checkField('maxAge', !isNaN(maxAge) && maxAge >= 18, 'A maximum kor legalább 18 legyen!');
                 // Csak akkor ellenőrizzük a tartományt, ha mindkettő érvényes szám >= 18
                if (!isNaN(minAge) && minAge >= 18 && !isNaN(maxAge) && maxAge >= 18) {
                    checkField('ageRange', minAge <= maxAge, 'A minimum kor nem lehet nagyobb a maximumnál!');
                }
                break;
            case 7: // Bemutatkozás (Bio)
                checkField('bio', data.bio.trim().length >= 50, 'A bemutatkozásnak legalább 50 karakter hosszúnak kell lennie.');
                break;
            default:
                break; // Nincs validáció ismeretlen lépésekre
        }

        return stepErrors;
    };

    // --- Lépések Definíciója (Hibák megjelenítésével) ---
    const steps = [
        { // Step 0: Email
            label: "Email",
            content: (
                <div className="form-card">
                    <h3>Alap információk</h3>
                    <div className="form-group">
                        <label htmlFor="email">Email cím*</label>
                        <input id="email" type="email" placeholder="example@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required aria-required="true" autoComplete="email" aria-invalid={!!errors.email} aria-describedby="email-error"/>
                        {/* Email hiba megjelenítése */}
                        {errors.email && <div id="email-error" className="error-message">{errors.email}</div>}
                    </div>
                </div>
            ),
            // isValid maradhat a gomb gyors vizuális tiltásához
            isValid: () => /\S+@\S+\.\S+/.test(formData.email)
        },
        { // Step 1: Profil (Több oszlop)
            label: "Profil",
            content: (
                <div className="form-card">
                    <h3>Profil beállítások</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="username">Felhasználónév*</label>
                            <input id="username" type="text" placeholder="Becenév" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required aria-required="true" minLength="3" autoComplete="username" aria-invalid={!!errors.username} aria-describedby="username-error"/>
                            {/* Felhasználónév hiba */}
                            {errors.username && <div id="username-error" className="error-message">{errors.username}</div>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="dob">Születési dátum*</label>
                            <input id="dob" type="date" value={formData.dob} max={new Date().toISOString().split("T")[0]} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} required aria-required="true" aria-invalid={!!errors.dob || !!errors.dob_age} aria-describedby="dob-error dob-age-error"/>
                            {/* Szül.dátum hibák (kötelező és kor) */}
                            {errors.dob && <div id="dob-error" className="error-message">{errors.dob}</div>}
                            {errors.dob_age && <div id="dob-age-error" className="error-message">{errors.dob_age}</div>}
                        </div>
                    </div>
                </div>
            ),
            isValid: () => formData.username.trim().length >= 3 && formData.dob !== '' && calculateAge(formData.dob) >= 18
        },
        { // Step 2: Jelszó (Több oszlop)
            label: "Jelszó",
            content: (
                <div className="form-card">
                    <h3>Biztonság</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Jelszó* (minimum 6 karakter)</label>
                            <input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required aria-required="true" minLength="6" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby="password-error"/>
                            {/* Jelszó hiba */}
                            {errors.password && <div id="password-error" className="error-message">{errors.password}</div>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Jelszó megerősítése*</label>
                            <input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required aria-required="true" minLength="6" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} aria-describedby="confirmPassword-error"/>
                            {/* Jelszó megerősítés hiba */}
                            {errors.confirmPassword && <div id="confirmPassword-error" className="error-message">{errors.confirmPassword}</div>}
                        </div>
                    </div>
                </div>
            ),
            isValid: () => formData.password.length >= 6 && formData.password === formData.confirmPassword
        },
        { // Step 3: Lakhely (city)
             label: "Lakhely",
             content: (
                 <div className="form-card">
                     <h3>Helyzet</h3>
                     <div className="form-group">
                         <label htmlFor="city">Lakhely városa*</label> {/* Az ID-t city-re cseréltem, hogy konzisztens legyen */}
                         <input id="city" type="text" placeholder="Pl.: Budapest" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required aria-required="true" autoComplete="address-level2" aria-invalid={!!errors.city} aria-describedby="city-error"/>
                         {/* Lakhely hiba */}
                         {errors.city && <div id="city-error" className="error-message">{errors.city}</div>}
                     </div>
                 </div>
             ),
             isValid: () => formData.city.trim() !== ""
         },
        { // Step 4: Nemed - Nincs hiba megjelenítés
            label: "Nemed",
            content: ( <div className="form-card"> <h3>Személyes adatok</h3> <div className="form-group"> <label>Nemed*</label> <div className="gender-select"> <button type="button" className={`gender-option ${formData.sex === 'female' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, sex: 'female' })} aria-pressed={formData.sex === 'female'}>Nő</button> <button type="button" className={`gender-option ${formData.sex === 'male' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, sex: 'male' })} aria-pressed={formData.sex === 'male'}>Férfi</button> </div> </div> </div> ),
            isValid: () => true
        },
        { // Step 5: Partner neme - Nincs hiba megjelenítés
            label: "Partner",
            content: ( <div className="form-card"> <h3>Partner keresés</h3> <div className="form-group"> <label>Keresett partner neme*</label> <div className="gender-select"> <button type="button" className={`gender-option ${formData.searchedSex === 'male' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, searchedSex: 'male' })} aria-pressed={formData.searchedSex === 'male'}>Férfi</button> <button type="button" className={`gender-option ${formData.searchedSex === 'female' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, searchedSex: 'female' })} aria-pressed={formData.searchedSex === 'female'}>Nő</button> </div> </div> </div> ),
            isValid: () => true
        },
        { // Step 6: Korhatárok (Több oszlop)
            label: "Korhatár",
            content: (
                <div className="form-card">
                    <h3>Kor preferenciák</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="minAge">Minimum kor*</label>
                            <input id="minAge" type="number" min="18" max="120" value={formData.minAge} onChange={(e) => setFormData({ ...formData, minAge: e.target.value })} required aria-required="true" aria-invalid={!!errors.minAge || !!errors.ageRange} aria-describedby="minAge-error ageRange-error"/>
                            {/* Minimum kor hiba */}
                            {errors.minAge && <div id="minAge-error" className="error-message">{errors.minAge}</div>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="maxAge">Maximum kor*</label>
                            <input id="maxAge" type="number" min="18" max="120" value={formData.maxAge} onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })} required aria-required="true" aria-invalid={!!errors.maxAge || !!errors.ageRange} aria-describedby="maxAge-error ageRange-error"/>
                            {/* Maximum kor hiba */}
                            {errors.maxAge && <div id="maxAge-error" className="error-message">{errors.maxAge}</div>}
                        </div>
                    </div>
                     {/* Korhatár tartomány hiba (min > max) */}
                     {errors.ageRange && <div id="ageRange-error" className="error-message">{errors.ageRange}</div>}
                </div>
            ),
             // Biztosítjuk, hogy parseInt helyesen kezelje a potenciálisan üres stringeket (NaN lesz)
            isValid: () => {
                const min = parseInt(formData.minAge, 10);
                const max = parseInt(formData.maxAge, 10);
                return !isNaN(min) && min >= 18 && !isNaN(max) && max >= 18 && min <= max;
            }
        },
        { // Step 7: Bemutatkozás (Bio)
            label: "Bemutatkozás",
            content: (
                <div className="form-card">
                    <h3>Magadról</h3>
                    <div className="form-group">
                        <label htmlFor="bio">Bemutatkozó szöveg* (minimum 50 karakter)</label>
                        <textarea id="bio" placeholder="Írj magadról pár szót..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} required aria-required="true" minLength="50" rows="5" aria-describedby="bio-counter bio-error" aria-invalid={!!errors.bio}/>
                        {/* Bio hiba */}
                        {errors.bio && <div id="bio-error" className="error-message">{errors.bio}</div>}
                        <div id="bio-counter" className={`char-counter ${formData.bio.length < 50 ? 'error' : ''}`}>{formData.bio.length}/50 karakter</div>
                    </div>
                </div>
            ),
            isValid: () => formData.bio.trim().length >= 50
        }
    ];

    // --- Hook-ok ---
    // Effektus a lépésváltás kezelésére (visitedSteps frissítése, hibák törlése)
    useEffect(() => {
        setVisitedSteps(prev => {
            const newVisited = [...prev];
            // Ellenőrizzük, hogy a step index érvényes tartományban van-e
            if (step >= 0 && step < newVisited.length) {
                newVisited[step] = true; // Jelöljük az aktuális lépést meglátogatottnak
            }
            return newVisited;
        });
        // Töröljük a hibákat, amikor új lépésre lépünk
        setErrors({});
    }, [step]); // Csak akkor fusson le, ha a 'step' változik

    // --- Eseménykezelők ---
    // Kezeli a lépés fülre kattintást
    const handleStepClick = (index) => {
        // Csak akkor engedélyezzük a kattintást, ha a lépés már meglátogatott volt
        if (visitedSteps[index]) {
             // Opcionális: Validálhatnánk az *összes* előző lépést, mielőtt visszalépünk,
             // de ez bonyolultabbá teheti a felhasználói élményt.
             // Most egyszerűen engedjük a navigációt a látogatott lépések között.
            setStep(index);
        }
    };

    // Kezeli a "Vissza" gombra kattintást
    const handleBack = () => {
        if (step > 0) {
            setErrors({}); // Töröljük a hibákat visszalépéskor
            setStep(step - 1);
        }
    };

    // Kezeli a "Tovább" gombra kattintást
    const handleNext = () => {
        // Validáljuk az aktuális lépést
        const stepErrors = validateStep(step, formData);
        setErrors(stepErrors); // Frissítjük a hiba állapotot

        // Csak akkor lépjünk tovább, ha nincs hiba az aktuális lépésben
        if (Object.keys(stepErrors).length === 0) {
            if (step < steps.length - 1) {
                setStep(step + 1); // A hibákat az useEffect törli az új lépéshez
            }
        } else {
            // Hibák vannak, ezeket a state frissítése megjeleníti.
            // Opcionálisan fókuszáljunk az első hibás mezőre.
            const firstErrorField = Object.keys(stepErrors)[0];
             let inputElement = document.getElementById(firstErrorField);
              // Speciális eset a dob_age hibához, ami a 'dob' inputhoz tartozik
              if (!inputElement && firstErrorField === 'dob_age') {
                inputElement = document.getElementById('dob');
              }
             // Speciális eset az ageRange hibához, ami a 'minAge' inputhoz tartozhat (vagy maxAge)
             if (!inputElement && firstErrorField === 'ageRange') {
                inputElement = document.getElementById('minAge');
             }
            // Timeout segít biztosítani, hogy a fókusz a renderelés után történjen meg
            setTimeout(() => inputElement?.focus(), 0);
        }
    };

    // Kezeli az űrlap elküldését (Regisztráció Befejezése gomb)
    const handleSubmit = async (e) => {
        e.preventDefault(); // Megakadályozzuk az alapértelmezett űrlapküldést

        // 1. Validáljuk az utolsó (aktuális) lépést
        const finalStepErrors = validateStep(step, formData);
        setErrors(finalStepErrors); // Frissítjük a hibákat, hogy megjelenjenek

        if (Object.keys(finalStepErrors).length > 0) {
            // Ha az utolsó lépésben hiba van, fókuszáljunk az elsőre és álljunk meg
            const firstErrorField = Object.keys(finalStepErrors)[0];
            let inputElement = document.getElementById(firstErrorField);
            if (!inputElement && firstErrorField === 'dob_age') { inputElement = document.getElementById('dob'); }
            if (!inputElement && firstErrorField === 'ageRange') { inputElement = document.getElementById('minAge'); }
            setTimeout(() => inputElement?.focus(), 0);
            return; // Megállítjuk a küldést
        }

        // 2. Opcionális, de ajánlott: Újra validáljuk az ÖSSZES lépést a végleges küldés előtt
        let allErrors = {};
        for (let i = 0; i < steps.length; i++) {
            const stepErrors = validateStep(i, formData);
            allErrors = { ...allErrors, ...stepErrors }; // Összegyűjtjük az összes hibát
        }

        if (Object.keys(allErrors).length > 0) {
            // Ha BÁRMELYIK lépésben hiba van:
            // Keressük meg az első hibás lépés indexét
            const firstInvalidStepIndex = steps.findIndex((s, i) => Object.keys(validateStep(i, formData)).length > 0);

            if (firstInvalidStepIndex !== -1) {
                // Ugorjunk az első hibás lépésre
                setStep(firstInvalidStepIndex);
                // Frissítsük a hibákat az adott lépésre
                const errorsForStep = validateStep(firstInvalidStepIndex, formData);
                setErrors(errorsForStep);

                // Fókusz az első hibás mezőre azon a lépésen
                const firstErrorField = Object.keys(errorsForStep)[0];
                 let inputElement = document.getElementById(firstErrorField);
                 if (!inputElement && firstErrorField === 'dob_age') { inputElement = document.getElementById('dob'); }
                 if (!inputElement && firstErrorField === 'ageRange') { inputElement = document.getElementById('minAge'); }
                setTimeout(() => inputElement?.focus(), 0);

                alert("Hiba: Nem minden lépés érvényes. Kérjük, ellenőrizd a megjelölt mezőket.");
            } else {
                // Ez nem fordulhatna elő, ha az utolsó lépés validálása rendben volt, de biztonsági hálóként:
                alert("Hiba történt a validálás során. Kérjük, ellenőrizd az adatokat.");
            }
            return; // Megállítjuk a küldést
        }

        // --- Ha minden validáció sikeres ---
        try {
            // Előkészítjük a küldendő adatokat (fontos a parseInt a korhatároknál!)
            const dataToSend = {
                email: formData.email,
                username: formData.username,
                password: formData.password, // Küldjük a jelszót (HTTPS szükséges!)
                dob: formData.dob,
                city: formData.city,
                sex: formData.sex,
                searchedSex: formData.searchedSex,
                minAge: parseInt(formData.minAge, 10), // Számként küldjük
                maxAge: parseInt(formData.maxAge, 10), // Számként küldjük
                bio: formData.bio,
            };
            console.log("Küldendő adatok a backendnek:", dataToSend);

            // Fetch API hívás a backendhez
            const response = await fetch('http://localhost:5000/auth/register', { // Regisztrációs végpont URL-je
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend) // A gondosan összeállított adatok küldése
            });

            // Feldolgozzuk a backend válaszát (mindig próbáljuk meg JSON-ként)
            const responseData = await response.json();

            if (!response.ok) {
                // Ha a backend hibát jelzett (status kód nem 2xx)
                // Használjuk a backend által küldött hibaüzenetet, ha van, különben általános hiba
                throw new Error(responseData.message || `Szerverhiba: ${response.status}`);
            }

            // Sikeres regisztráció esetén (response.ok === true)
            console.log("Sikeres regisztráció válasz:", responseData);
            alert("Sikeres regisztráció! 🎉 Most átirányítunk a bejelentkezéshez.");
            navigate("/login"); // Átirányítás a bejelentkezési oldalra

        } catch (error) {
            // Hiba történt a hálózati kérés vagy a feldolgozás során
            console.error("Regisztrációs hiba:", error);
            // Megjelenítjük a hibaüzenetet a felhasználónak
            alert(`Hiba történt a regisztráció során: ${error.message}`);
        }
    };

    // Opcionális: A gomb logikai engedélyezéséhez használhatjuk a pontosabb validációt
    // const isCurrentStepValidForProceeding = Object.keys(validateStep(step, formData)).length === 0;
    // Vagy maradhatunk az egyszerűbb isValid függvénynél a gyors vizuális visszajelzéshez
    const isCurrentStepValidForButton = steps[step]?.isValid(formData) ?? false; // Átadjuk a formData-t, ha az isValid használja

    // --- JSX Struktúra ---
    return (
        <div className="auth-container">
            {/* Fejléc */}
            <div className="registration-header">
                <h1>Regisztráció</h1>
                <p>Hozd létre a profilodat és találd meg a számodra ideális partnert!</p>
            </div>

            {/* Folyamat jelző pöttyök */}
            <ol className="progress-indicator" aria-label="Regisztráció folyamata">
                {steps.map((s, index) => (
                    <li
                        key={`dot-${index}`}
                        className={`progress-dot ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''}`}
                        aria-current={index === step ? 'step' : undefined}
                    ></li>
                ))}
            </ol>

            {/* Lépés fülek (tabok) */}
            <div className="step-indicator" role="tablist" aria-label="Regisztrációs lépések">
                {steps.map((s, index) => (
                    <button
                        key={`tab-${index}`}
                        id={`step-tab-${index}`}
                        className={`step ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''} ${!visitedSteps[index] ? 'locked' : ''}`}
                        onClick={() => handleStepClick(index)}
                        disabled={!visitedSteps[index]} // Letiltjuk, ha még nem volt meglátogatva
                        role="tab"
                        aria-selected={index === step}
                        aria-controls={`step-panel-${index}`}
                    >
                        {s.label}
                        {/* Pipa a befejezett lépésekhez */}
                        {index < step && visitedSteps[index] && <span className="step-status" aria-hidden="true">✓</span>}
                    </button>
                ))}
            </div>

            {/* Form elem */}
            <form onSubmit={handleSubmit} noValidate> {/* noValidate megakadályozza a böngésző saját validációját */}
                {/* Lépés tartalma */}
                <div
                    className="step-content"
                    role="tabpanel"
                    id={`step-panel-${step}`}
                    aria-labelledby={`step-tab-${step}`}
                >
                    {/* Az aktuális lépés tartalmának renderelése (hibák már benne vannak) */}
                    {steps[step]?.content}
                </div>

                {/* Navigációs Gombok */}
                <div className="navigation-buttons">
                    {/* Lépésszámláló */}
                    <div className="step-counter" aria-live="polite"> {step + 1} / {steps.length} lépés </div>
                    {/* Vissza gomb (csak ha nem az első lépésen vagyunk) */}
                    {step > 0 && (
                         <button type="button" className="nav-button back-button" onClick={handleBack}> ← Vissza </button>
                    )}
                    {/* Tovább vagy Befejezés gomb */}
                    {step < steps.length - 1 ? (
                        // Tovább gomb
                        <button
                            type="button" // Fontos, hogy ne submit legyen, különben elküldi az űrlapot
                            className="nav-button next-button"
                            onClick={handleNext}
                            // Opcionálisan hozzáadhatunk disabled logikát a gyors vizuális visszajelzéshez
                            // disabled={!isCurrentStepValidForButton}
                            // aria-disabled={!isCurrentStepValidForButton}
                        > Tovább → </button>
                    ) : (
                        // Regisztráció Befejezése gomb (utolsó lépésen)
                        <button
                            type="submit" // Ez küldi el az űrlapot (handleSubmit fut le)
                            className="nav-button submit-button"
                            // Opcionálisan hozzáadhatunk disabled logikát
                            // disabled={!isCurrentStepValidForButton}
                            // aria-disabled={!isCurrentStepValidForButton}
                        > Regisztráció Befejezése </button>
                    )}
                </div>
            </form>

            {/* Átirányítás a bejelentkezéshez */}
            <div className="login-redirect">
                <p>Már van fiókod? <a href="/login">Jelentkezz be itt</a></p>
            </div>
        </div>
    );
};

export default Register;