import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import TinderCard from "react-tinder-card";
import "../Styles/MainScreen.css"; // Győződj meg róla, hogy a CSS importálva van
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const MainScreen = () => {
    const [people, setPeople] = useState([]);
    const [userData, setUserData] = useState({});
    const navigate = useNavigate();
    const [currentImageIndices, setCurrentImageIndices] = useState({});
    const [swipeFeedbackDirection, setSwipeFeedbackDirection] = useState(null); // State a háttérszínhez
    const [currentTime, setCurrentTime] = useState('');

    const childRefs = useMemo(() =>
        Array(people.length).fill(0).map(() => React.createRef()),
        [people.length]
    );

    // --- Idő frissítése ---
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setCurrentTime(timeString);
        };
        updateTime();
        const intervalId = setInterval(updateTime, 60000); // Percenként frissít
        return () => clearInterval(intervalId); // Cleanup
    }, []);
    // --- Idő frissítése vége ---

    // --- Token kezelés és adatlekérés (változatlan) ---
    const refreshToken = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:5000/auth/refresh", {
                method: "POST",
                credentials: "include",
            });
            if (!response.ok) throw new Error("Token frissítés nem sikerült");
            const data = await response.json();
            localStorage.setItem("accessToken", data.accessToken);
            return data.accessToken;
        } catch (error) {
            console.error("Token frissítése nem sikerült:", error);
            localStorage.removeItem("accessToken");
            navigate("/login");
        }
    }, [navigate]);

    const checkToken = useCallback(async () => {
        let token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("Nincs token");
            navigate("/login");
            return false;
        }
        try {
            const response = await fetch("http://localhost:5000/auth/check", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    token = await refreshToken();
                    if (!token) return false;
                    const retryResponse = await fetch("http://localhost:5000/auth/check", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!retryResponse.ok) throw new Error("Érvénytelen token a frissítés után is");
                    const decoded = jwtDecode(token);
                    setUserData(prev => ({ ...prev, ...decoded }));
                    return true;
                }
                throw new Error(`Token ellenőrzési hiba: ${response.statusText}`);
            }
            const decoded = jwtDecode(token);
            setUserData(prev => ({ ...prev, ...decoded }));
            return true;
        } catch (error) {
            console.error("Hibás token vagy ellenőrzési hiba:", error);
            localStorage.removeItem("accessToken");
            navigate("/login");
            return false;
        }
    }, [navigate, refreshToken]);

    useEffect(() => {
        const init = async () => {
            await checkToken();
        };
        init();
    }, [checkToken]);

    useEffect(() => {
        if (userData.id && userData.searchedSex && userData.minAge !== undefined && userData.maxAge !== undefined) {
            const fetchPeople = async () => {
                try {
                    const token = localStorage.getItem("accessToken");
                    if (!token) return;
                    const response = await fetch("http://localhost:5000/api/findPeople", {
                       method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ userId: userData.id, searchedSex: userData.searchedSex, minAge: userData.minAge, maxAge: userData.maxAge }),
                    });
                     if (!response.ok) {
                        const errorData = await response.text();
                        console.error(`Adatok lekérése nem sikerült: ${response.status} - ${errorData}`);
                        if (response.status === 401 || response.status === 403) await checkToken();
                        throw new Error(`Adatok lekérése nem sikerült, status: ${response.status}`);
                    }
                     const data = await response.json();
                    setPeople(data);
                    const initialIndices = {};
                    data.forEach(person => { initialIndices[person.id] = 0; });
                    setCurrentImageIndices(prev => ({ ...prev, ...initialIndices }));
                 } catch (error) {
                    console.error("Hiba a felhasználók lekérésekor:", error);
                    setPeople([]);
                }
            };
            fetchPeople();
        }
   }, [userData.id, userData.searchedSex, userData.minAge, userData.maxAge, checkToken]);
   // --- Token kezelés és adatlekérés vége ---

   // --- Képváltás (változatlan) ---
    const handleImageChange = useCallback((personId, direction) => {
        const person = people.find(p => p.id === personId);
        if (!person || !person.images || person.images.length <= 1) return;
        setCurrentImageIndices((prevIndices) => {
            const currentIndex = prevIndices[personId] ?? 0;
            const imageCount = person.images.length;
            let nextIndex;
            if (direction === "next") nextIndex = (currentIndex + 1) % imageCount;
            else if (direction === "prev") nextIndex = (currentIndex - 1 + imageCount) % imageCount;
            else nextIndex = currentIndex;
            return { ...prevIndices, [personId]: nextIndex };
        });
    }, [people]);
   // --- Képváltás vége ---

   // --- Swipe eseménykezelők (swipeFeedbackDirection beállítása / törlése) ---
    const onSwipe = useCallback(async (direction, person) => {
       setCurrentImageIndices(prev => {
            const newState = { ...prev };
            delete newState[person.id];
            return newState;
       });
        setSwipeFeedbackDirection(null); // Visszajelzés (háttérszín) eltüntetése swipe után

       if (direction === "right" || direction === "left") {
           try {
               const token = localStorage.getItem("accessToken");
               if (!token) throw new Error("Nincs token a swipe művelethez.");
                const response = await fetch("http://localhost:5000/api/swipe", {
                   method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ swipedUserId: person.id, swipeDirection: direction }),
                });
                 if (!response.ok) {
                    const errorData = await response.text();
                    console.error(`Swipe rögzítése sikertelen: ${response.status} - ${errorData}`);
                    if (response.status === 401 || response.status === 403) await checkToken();
                    throw new Error(`Failed to record swipe, status: ${response.status}`);
                }
                 if (direction === 'right') {
                    const data = await response.json();
                    console.log("Swipe response:", data);
                    if (data.match) alert(`It's a Match with ${person.username}! 🎉`);
                } else {
                    console.log(`Recorded left swipe for ${person.id}`);
                }
             } catch (error) {
                console.error(`Error sending ${direction} swipe to backend:`, error);
             }
       }
    }, [checkToken]);

    const onCardLeftScreen = useCallback((personId, direction) => {
        console.log(`${personId} left the screen (${direction})`);
        setPeople((prevPeople) => prevPeople.filter((p) => p.id !== personId));
        setSwipeFeedbackDirection(null); // Visszajelzés (háttérszín) eltüntetése, ha a kártya elhagyja a képernyőt
    }, []);

    // Beállítja a háttérszínhez szükséges state-et, amikor elég messzire húzzuk
    const handleSwipeRequirementFulfilled = useCallback((direction) => {
        setSwipeFeedbackDirection(direction);
    }, []);

    // Visszaállítja a háttérszínt, ha visszahúzzuk a kártyát
    const handleSwipeRequirementUnfulfilled = useCallback(() => {
       setSwipeFeedbackDirection(null);
    }, []);

    // Programmatikus swipe (gombokkal)
    const swipe = useCallback(async (dir) => {
        const peopleOnScreen = people;
        if (peopleOnScreen.length > 0) {
            const personToSwipe = peopleOnScreen[peopleOnScreen.length - 1];
            const personIndex = people.length - 1;
            if (personIndex !== -1 && childRefs[personIndex]?.current) {
                // setSwipeFeedbackDirection(dir); // Ezt a TinderCard komponens kezeli a swipe() hívásakor is a fulfill/unfulfill miatt
                await childRefs[personIndex].current.swipe(dir);
            } else {
                console.warn("Could not find ref for the top card to swipe programmatically.");
            }
        } else {
            console.log("No cards left to swipe programmatically.");
        }
    }, [people, childRefs]);
    // --- Swipe eseménykezelők vége ---


    const calculateAge = (birthdate) => {
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      };
      

    return (
        <div className="main-screen-container">
            {/* Telefon keret (asztali nézetben) */}
            <div className="phone-frame">
                {/* Telefon képernyője - Itt adjuk hozzá a dinamikus osztályt */}
                <div className={`phone-screen ${
                    swipeFeedbackDirection === 'left' ? 'swipe-left-bg' : ''
                 } ${
                    swipeFeedbackDirection === 'right' ? 'swipe-right-bg' : ''
                 }`}>

                    {/* Állapotsor */}
                    <div className="phone-status-bar">
                        <span className="status-bar-time">{currentTime}</span>
                        <span className="status-bar-brand">
                            {/* Beillesztett SVG ikon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                id="network" // id maradhat, bár Reactban nem feltétlen szükséges
                                width="16" // Méret beállítása (állíthatod CSS-ben is)
                                height="16"
                                fill="currentColor" // Örökli a szülő elem (span) színét
                                style={{ marginRight: '5px', verticalAlign: 'middle' }} // Kis térköz és függőleges igazítás
                            >
                                <path d="M6,15a1,1,0,0,0-1,1v3a1,1,0,0,0,2,0V16A1,1,0,0,0,6,15Zm4-3a1,1,0,0,0-1,1v6a1,1,0,0,0,2,0V13A1,1,0,0,0,10,12Zm8-8a1,1,0,0,0-1,1V19a1,1,0,0,0,2,0V5A1,1,0,0,0,18,4ZM14,8a1,1,0,0,0-1,1V19a1,1,0,0,0,2,0V9A1,1,0,0,0,14,8Z"></path>
                            </svg>
                            Kinder {/* A felirat */}
                        </span>
                    </div>

                    {/* Kártya konténer */}
                    <div className="card-container">
                        {people.length === 0 ? (
                            <div className="no-people-message">
                                <h2>Nincs több felhasználó a környéken a jelenlegi szűrőkkel. Próbáld meg később!</h2>
                            </div>
                        ) : (
                            people.map((person, index) => {
                                const cardRef = childRefs[index];
                                const currentImageIndex = currentImageIndices[person.id] ?? 0;
                                const imageUrl = person.images && person.images.length > 0 && person.images[currentImageIndex]
                                    ? person.images[currentImageIndex].imgUrl
                                    : 'https://via.placeholder.com/400x600/cccccc/808080?text=No+Image';
                                const isTopCard = index === people.length - 1;

                                return (
                                    <TinderCard
                                        ref={cardRef}
                                        key={person.id}
                                        className="swipe"
                                        onSwipe={(dir) => onSwipe(dir, person)}
                                        onCardLeftScreen={(dir) => onCardLeftScreen(person.id, dir)}
                                        preventSwipe={["up", "down"]}
                                        flickOnSwipe={true}
                                        // Ezek a prop-ok kezelik a háttérszín váltást
                                        onSwipeRequirementFulfilled={isTopCard ? handleSwipeRequirementFulfilled : undefined}
                                        onSwipeRequirementUnfulfilled={isTopCard ? handleSwipeRequirementUnfulfilled : undefined}
                                    >
                                        <div className="card">
                                            {/* Kártya képe */}
                                            <div
                                                className="card-image"
                                                style={{ backgroundImage: `url(${imageUrl})` }}
                                            />
                                            {/* Képváltó gombok (ha több kép van) */}
                                            {isTopCard && person.images && person.images.length > 1 && (
                                                <>
                                                    <div
                                                        className="image-nav-overlay left"
                                                        onClick={(e) => { e.stopPropagation(); handleImageChange(person.id, 'prev'); }}
                                                        aria-label="Előző kép"
                                                    />
                                                    <div
                                                        className="image-nav-overlay right"
                                                        onClick={(e) => { e.stopPropagation(); handleImageChange(person.id, 'next'); }}
                                                        aria-label="Következő kép"
                                                    />
                                                </>
                                            )}
                                            {/* Kártya szövege */}
                                            <div className="card-text">
                                                <h3>{person.username}, {calculateAge(person.dob) }</h3>
                                            </div>
                                            {/* A régi swipe-feedback div eltávolítva */}
                                        </div>
                                    </TinderCard>
                                );
                            })
                        )}
                    </div> {/* .card-container vége */}

                    {/* Swipe gombok */}
                    {people.length > 0 && (
                        <div className="swipe-controls">
                            <button
                                className="swipe-button swipe-button--left"
                                onClick={() => swipe("left")}
                                disabled={people.length === 0}
                                aria-label="Nope"
                            > ✕ </button>
                            <button
                                className="swipe-button swipe-button--right"
                                onClick={() => swipe("right")}
                                disabled={people.length === 0}
                                aria-label="Like"
                            > ♥ </button>
                        </div>
                    )}

                </div> {/* .phone-screen vége */}
            </div> {/* .phone-frame vége */}
        </div> // .main-screen-container vége
    );
};

export default MainScreen;