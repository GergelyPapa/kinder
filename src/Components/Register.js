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
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        dob: '',
        location: '',
        sex: 'female', // Default value
        searchedSex: 'male', // Default value
        minAge: '18', // Default value
        maxAge: '60', // Default value
        bio: '',
    });

    const [step, setStep] = useState(0);
    const [visitedSteps, setVisitedSteps] = useState([true, false, false, false, false, false, false, false]);
    // State to hold validation errors for the current step
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    // --- Validation Logic ---
    // Checks conditions for a specific step and returns an error object
    const validateStep = (stepIndex, data) => {
        const stepErrors = {};
        const currentStepConfig = steps[stepIndex]; // Get config for the current step

        if (!currentStepConfig) return {}; // Should not happen

        // Use a helper function to check individual fields based on step index
        const checkField = (fieldName, condition, message) => {
            if (!condition) {
                stepErrors[fieldName] = message;
            }
        };

        switch (stepIndex) {
            case 0: // Email
                checkField('email', /\S+@\S+\.\S+/.test(data.email), 'Érvénytelen email formátum.');
                break;
            case 1: // Profile
                checkField('username', data.username.trim().length >= 3, 'A felhasználónév legalább 3 karakter legyen.');
                checkField('dob', data.dob !== '', 'Kérjük, add meg a születési dátumodat.');
                if (data.dob) { // Only check age if dob is provided
                   checkField('dob_age', calculateAge(data.dob) >= 18, 'Legalább 18 évesnek kell lenned!');
                }
                break;
            case 2: // Password
                checkField('password', data.password.length >= 6, 'A jelszónak legalább 6 karakter hosszúnak kell lennie.');
                checkField('confirmPassword', data.password === data.confirmPassword, 'A jelszavak nem egyeznek!');
                break;
            case 3: // Location
                checkField('location', data.location.trim() !== "", 'Kérjük, add meg a lakhelyedet.');
                break;
            case 4: // Sex - No validation needed (always has value)
                break;
            case 5: // Partner Sex - No validation needed (always has value)
                break;
            case 6: // Age Range
                const minAge = parseInt(data.minAge, 10);
                const maxAge = parseInt(data.maxAge, 10);
                checkField('minAge', minAge >= 18, 'A minimum kor nem lehet 18 alatt!');
                checkField('maxAge', maxAge >= 18, 'A maximum kor nem lehet 18 alatt!');
                 // Check range only if both are valid numbers >= 18
                if (minAge >= 18 && maxAge >= 18) {
                    checkField('ageRange', minAge <= maxAge, 'A minimum kor nem lehet nagyobb a maximumnál!');
                }
                break;
            case 7: // Bio
                checkField('bio', data.bio.trim().length >= 50, 'A bemutatkozásnak legalább 50 karakter hosszúnak kell lennie.');
                break;
            default:
                break; // No validation for unknown steps
        }

        return stepErrors;
    };

    // Define steps configuration - ADD ERROR DISPLAY
    const steps = [
        { // Step 0: Email
            label: "Email",
            content: (
                <div className="form-card">
                    <h3>Alap információk</h3>
                    <div className="form-group">
                        <label htmlFor="email">Email cím*</label>
                        <input id="email" type="email" placeholder="example@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required aria-required="true" autoComplete="email" aria-invalid={!!errors.email} aria-describedby="email-error"/>
                        {/* Display Email Error */}
                        {errors.email && <div id="email-error" className="error-message">{errors.email}</div>}
                    </div>
                </div>
            ),
            // isValid can still be used for quick button disabling, but validateStep provides messages
            isValid: () => /\S+@\S+\.\S+/.test(formData.email)
        },
        { // Step 1: Profile (Multi-column)
            label: "Profil",
            content: (
                <div className="form-card">
                    <h3>Profil beállítások</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="username">Felhasználónév*</label>
                            <input id="username" type="text" placeholder="Becenév" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required aria-required="true" minLength="3" autoComplete="username" aria-invalid={!!errors.username} aria-describedby="username-error"/>
                            {/* Display Username Error */}
                            {errors.username && <div id="username-error" className="error-message">{errors.username}</div>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="dob">Születési dátum*</label>
                            <input id="dob" type="date" value={formData.dob} max={new Date().toISOString().split("T")[0]} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} required aria-required="true" aria-invalid={!!errors.dob || !!errors.dob_age} aria-describedby="dob-error dob-age-error"/>
                             {/* Display DOB Errors (required and age) */}
                             {errors.dob && <div id="dob-error" className="error-message">{errors.dob}</div>}
                             {errors.dob_age && <div id="dob-age-error" className="error-message">{errors.dob_age}</div>}
                        </div>
                    </div>
                    {/* Note: Removed the separate age error display here as it's now combined above */}
                </div>
            ),
            isValid: () => formData.username.trim().length >= 3 && formData.dob !== '' && calculateAge(formData.dob) >= 18
        },
        { // Step 2: Password (Multi-column)
            label: "Jelszó",
            content: (
                <div className="form-card">
                    <h3>Biztonság</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Jelszó* (minimum 6 karakter)</label>
                            <input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required aria-required="true" minLength="6" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby="password-error"/>
                             {/* Display Password Error */}
                             {errors.password && <div id="password-error" className="error-message">{errors.password}</div>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Jelszó megerősítése*</label>
                            <input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required aria-required="true" minLength="6" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} aria-describedby="confirmPassword-error"/>
                            {/* Display Confirm Password Error */}
                            {errors.confirmPassword && <div id="confirmPassword-error" className="error-message">{errors.confirmPassword}</div>}
                        </div>
                    </div>
                     {/* Note: Removed the separate mismatch error display here as it's now combined above */}
                </div>
            ),
            isValid: () => formData.password.length >= 6 && formData.password === formData.confirmPassword
        },
        { // Step 3: Location
            label: "Lakhely",
            content: (
                <div className="form-card">
                    <h3>Helyzet</h3>
                    <div className="form-group">
                        <label htmlFor="location">Lakhely városa*</label>
                        <input id="location" type="text" placeholder="Pl.: Budapest" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required aria-required="true" autoComplete="address-level2" aria-invalid={!!errors.location} aria-describedby="location-error"/>
                        {/* Display Location Error */}
                        {errors.location && <div id="location-error" className="error-message">{errors.location}</div>}
                    </div>
                </div>
            ),
            isValid: () => formData.location.trim() !== ""
        },
        { // Step 4: Sex - No errors to display
            label: "Nemed",
            content: ( <div className="form-card"> <h3>Személyes adatok</h3> <div className="form-group"> <label>Nem*</label> <div className="gender-select"> <button type="button" className={`gender-option ${formData.sex === 'female' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, sex: 'female' })} aria-pressed={formData.sex === 'female'}>Nő</button> <button type="button" className={`gender-option ${formData.sex === 'male' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, sex: 'male' })} aria-pressed={formData.sex === 'male'}>Férfi</button> </div> </div> </div> ),
            isValid: () => true
        },
        { // Step 5: Partner Sex - No errors to display
            label: "Partner",
            content: ( <div className="form-card"> <h3>Partner keresés</h3> <div className="form-group"> <label>Keresett partner neme*</label> <div className="gender-select"> <button type="button" className={`gender-option ${formData.searchedSex === 'male' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, searchedSex: 'male' })} aria-pressed={formData.searchedSex === 'male'}>Férfi</button> <button type="button" className={`gender-option ${formData.searchedSex === 'female' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, searchedSex: 'female' })} aria-pressed={formData.searchedSex === 'female'}>Nő</button> </div> </div> </div> ),
            isValid: () => true
        },
        { // Step 6: Age Range (Multi-column)
            label: "Korhatár",
            content: (
                <div className="form-card">
                    <h3>Kor preferenciák</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="minAge">Minimum kor*</label>
                            <input id="minAge" type="number" min="18" max="120" value={formData.minAge} onChange={(e) => setFormData({ ...formData, minAge: e.target.value })} required aria-required="true" aria-invalid={!!errors.minAge || !!errors.ageRange} aria-describedby="minAge-error ageRange-error"/>
                             {/* Display Min Age Error */}
                             {errors.minAge && <div id="minAge-error" className="error-message">{errors.minAge}</div>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="maxAge">Maximum kor*</label>
                            <input id="maxAge" type="number" min="18" max="120" value={formData.maxAge} onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })} required aria-required="true" aria-invalid={!!errors.maxAge || !!errors.ageRange} aria-describedby="maxAge-error ageRange-error"/>
                             {/* Display Max Age Error */}
                             {errors.maxAge && <div id="maxAge-error" className="error-message">{errors.maxAge}</div>}
                        </div>
                    </div>
                     {/* Display Age Range Error (min > max) */}
                     {errors.ageRange && <div id="ageRange-error" className="error-message">{errors.ageRange}</div>}
                     {/* Note: Removed separate error displays as they are now combined above */}
                </div>
            ),
            isValid: () => parseInt(formData.minAge, 10) >= 18 && parseInt(formData.maxAge, 10) >= 18 && parseInt(formData.minAge, 10) <= parseInt(formData.maxAge, 10)
        },
        { // Step 7: Bio
            label: "Bemutatkozás",
            content: (
                <div className="form-card">
                    <h3>Magadról</h3>
                    <div className="form-group">
                        <label htmlFor="bio">Bemutatkozó szöveg* (minimum 50 karakter)</label>
                        <textarea id="bio" placeholder="Írj magadról pár szót..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} required aria-required="true" minLength="50" rows="5" aria-describedby="bio-counter bio-error" aria-invalid={!!errors.bio}/>
                        {/* Display Bio Error */}
                        {errors.bio && <div id="bio-error" className="error-message">{errors.bio}</div>}
                        <div id="bio-counter" className="char-counter">{formData.bio.length}/50 karakter</div>
                    </div>
                </div>
            ),
            isValid: () => formData.bio.trim().length >= 50
        }
    ];

    useEffect(() => {
        setVisitedSteps(prev => {
          const newVisited = [...prev];
          if (step >= 0 && step < newVisited.length && !newVisited[step]) {
            newVisited[step] = true;
          }
          return newVisited;
        });
        // Clear errors when step changes
        setErrors({});
    }, [step]);

    const handleStepClick = (index) => {
        if (visitedSteps[index]) {
            // Optional: Validate before allowing step change back/forward via tabs?
            // For now, just allow navigation to visited steps.
            setStep(index);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setErrors({}); // Clear errors when going back
            setStep(step - 1);
        }
    };

    const handleNext = () => {
        // Validate the current step
        const stepErrors = validateStep(step, formData);
        setErrors(stepErrors); // Update errors state

        // Proceed only if there are no errors for the current step
        if (Object.keys(stepErrors).length === 0) {
            if (step < steps.length - 1) {
                setStep(step + 1); // Errors will be cleared by the useEffect for the new step
            }
        } else {
             // Errors are displayed via the state, no alert needed.
             // Optionally focus the first field with an error
             const firstErrorField = Object.keys(stepErrors)[0];
             const inputElement = document.getElementById(firstErrorField);
             inputElement?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate the final step first
        const finalStepErrors = validateStep(step, formData);
        setErrors(finalStepErrors);

        if (Object.keys(finalStepErrors).length > 0) {
             // Errors are displayed, maybe focus first error
             const firstErrorField = Object.keys(finalStepErrors)[0];
             const inputElement = document.getElementById(firstErrorField);
             inputElement?.focus();
             return; // Stop submission if final step has errors
        }

        // Optional: Re-validate ALL steps before final submission for robustness
        let allErrors = {};
        for (let i = 0; i < steps.length; i++) {
            const stepErrors = validateStep(i, formData);
            allErrors = { ...allErrors, ...stepErrors };
        }

        if (Object.keys(allErrors).length > 0) {
            // Find the first step with an error and navigate to it
            const firstInvalidStepIndex = steps.findIndex((s, i) => Object.keys(validateStep(i, formData)).length > 0);
             if (firstInvalidStepIndex !== -1) {
                 setStep(firstInvalidStepIndex);
                 // Update errors state to show errors for that specific step
                 setErrors(validateStep(firstInvalidStepIndex, formData));
                 alert("Hiba: Nem minden lépés érvényes. Kérjük, ellenőrizd a megjelölt mezőket.");
             } else {
                 // Should not happen if final step validation passed, but as a fallback:
                 alert("Hiba történt a validálás során. Kérjük, ellenőrizd az adatokat.");
             }
            return; // Stop submission
        }


        // --- If all validation passes ---
        try {
            console.log("Form data submitted:", formData);
            alert("Sikeres regisztráció!"); // Replace with better UI feedback
            navigate('/login');
        } catch (error) {
            console.error("Hiba a regisztráció során:", error);
            alert("Hiba történt a regisztráció során. Próbáld újra később.");
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