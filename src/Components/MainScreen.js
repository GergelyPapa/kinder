import React, { useState, useRef, useEffect } from "react";
import TinderCard from "react-tinder-card";
import "../Styles/MainScreen.css";
import { jwtDecode } from "jwt-decode";
import Navbar from "./Navbar";


const MainScreen = () => {
  const [people, setPeople] = useState([
    { id: 1, name: "Anna, 24", url: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { id: 2, name: "John, 27", url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { id: 3, name: "Sophia, 26", url: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600" }
  ]);

  const [swipedRightList, setSwipedRightList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const childRefs = useRef([]);
  const userMenuRef = useRef();
  const [userData, setUserData]=useState({});
  

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      const decoded = jwtDecode(accessToken);
     
      setUserData(decoded);
    }
  }, []);


  useEffect(() => {
    childRefs.current = people.map((_, index) => childRefs.current[index] || React.createRef());
  }, [people]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);




  const onSwipe = (direction, person) => {
    if (direction === "right") {
      setSwipedRightList((prev) => [...prev, person]);
    }
  };



  const onCardLeftScreen = (id) => {
    setPeople((prev) => prev.filter((person) => person.id !== id));
  };



  const swipe = (dir) => {
    const lastIndex = people.length - 1;
    if (lastIndex >= 0 && childRefs.current[lastIndex]?.current) {
      childRefs.current[lastIndex].current.swipe(dir);
    }
  };



  return (
    <div className="main-screen-container">
       <h1>Üdv Újra {userData.username ? userData.username : ""}!</h1>
      <div className="main-screen-card">
        <h1>Találd meg a párod! 💘</h1>
        <div className="card-container">
          {people.map((person, index) => (
            <TinderCard
              ref={childRefs.current[index]}
              key={person.id}
              className="swipe"
              onSwipe={(dir) => onSwipe(dir, person)}
              onCardLeftScreen={() => onCardLeftScreen(person.id)}
              preventSwipe={["up", "down"]}
              flickOnSwipe={true}
            >
              <div className="card" style={{ backgroundImage: `url(${person.url})` }}>
                <h3>{person.name}</h3>
              </div>
            </TinderCard>
          ))}
        </div>

        <div className="swipe-controls">
          <button 
            className="swipe-button swipe-button--left" 
            onClick={() => swipe("left")}
            disabled={people.length === 0}
          >
            ✕
          </button>
          <button 
            className="swipe-button swipe-button--right" 
            onClick={() => swipe("right")}
            disabled={people.length === 0}
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainScreen;