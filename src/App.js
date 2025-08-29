import React, { useState } from "react";
import "./index.css";

/** 7 grouped conditions in the circle (order matters for where it stops) */
const CONDITIONS = [
  { key: "clear",        label: "",        emoji: "☀️" },
  { key: "cloudy",       label: "",       emoji: "⛅" },
  { key: "fog",          label: "",          emoji: "🌫️" },
  { key: "drizzle",      label: "",      emoji: "🌦️" },
  { key: "rain",         label: "",         emoji: "🌧️" },
  { key: "snow",         label: "",         emoji: "❄️" },
  { key: "thunderstorm", label: "",        emoji: "⛈️" },
];

/** Map Open-Meteo weathercode to one of the 7 keys above */
function mapCodeToKey(code) {
  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "clear";
}

function App() {
  const [city, setCity] = useState("");
  const [rotate, setRotate] = useState(true);          // auto rotate on load
  const [selectedKey, setSelectedKey] = useState(null); // which card to face forward
  const [weather, setWeather] = useState(null);         // fetched weather details
  const quantity = CONDITIONS.length;

  const stopIndex = Math.max(
    0,
    CONDITIONS.findIndex(c => c.key === selectedKey)
  ); // 0-based index of selected card

  const fetchWeather = async () => {
    if (!city.trim()) {
      alert("Please enter a city name!");
      return;
    }
    try {
      // 1) Geocode city → coords
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        alert("City not found!");
        return;
      }
      const { latitude, longitude, name, country } = geoData.results[0];

      // 2) Current weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      const weatherData = await weatherRes.json();
      const cw = weatherData.current_weather;

      const key = mapCodeToKey(cw.weathercode);

      // Put details for overlay on the selected card
      setWeather({
        city: name,
        country,
        temperature: cw.temperature,
        windspeed: cw.windspeed,
        weathercode: cw.weathercode,
        key
      });

      // Stop the rotation and face the correct card (smoothly in CSS)
      setRotate(false);
      setSelectedKey(key);
    } catch (e) {
      console.error(e);
      alert("Error fetching weather.");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") fetchWeather();
  };

  // Helper for emoji sentence
  const getWeatherText = (key) => {
    switch (key) {
      case "clear": return "☀️ It's sunny!";
      case "cloudy": return "⛅ It's cloudy!";
      case "fog": return "🌫️ Foggy outside!";
      case "drizzle": return "🌦️ Light drizzle!";
      case "rain": return "🌧️ It's raining!";
      case "snow": return "❄️ Snowfall happening!";
      case "thunderstorm": return "⛈️ Thunderstorm!";
      default: return "";
    }
  };

  return (
    <div className="page">
      {/* Rotating 3D ring */}
      <div
        className={`slider ${rotate ? "autoRun" : "stopped"}`}
        style={{
          // CSS custom props used by index.css
          "--quantity": quantity,
          "--stopIndex": stopIndex, // 0-based
        }}
      >
        {CONDITIONS.map((cond, i) => {
          const isSelected = weather && cond.key === weather.key;
          return (
            <div
              key={cond.key}
              className="item"
              style={{ "--position": i + 1 }}
            >
              <div className={`card card--${cond.key}`}>
                <div className="card-emoji">{cond.emoji}</div>
                <div className="card-label">{cond.label}</div>

                {/* Only show details on the selected/facing card */}
                {isSelected && (
                  <div className="selected-info">
                    <h3>
                      {weather.city}, {weather.country}
                    </h3>
                    <p className="big">{getWeatherText(weather.key)}</p>
                    <p>{Math.round(weather.temperature)}°C</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search below the ring */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Enter city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKey}
        />
        <button onClick={fetchWeather}>Search</button>
        {(!rotate && selectedKey) && (
          <button
            className="ghost"
            onClick={() => {
              // optional: resume rotation
              setWeather(null);
              setSelectedKey(null);
              setRotate(true);
            }}
          >
            Resume
          </button>
        )}
      </div>
    </div>
  );
}

export default App;

