import { useRef, useEffect, useState } from "react";
import tt from "@tomtom-international/web-sdk-maps";
import { services } from "@tomtom-international/web-sdk-services";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import "./App.css";

const API_KEY = "A7x2Co2slX6ap1HDQbdUUcG3rJyKYaRA";
const WARSAW = [21.0122, 52.2297];

function App() {
  const mapElement = useRef();
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const initializeMap = () => {
      const mapInstance = tt.map({
        key: API_KEY,
        container: mapElement.current,
        center: WARSAW,
        zoom: 12,
      });
      setMap(mapInstance);
    };

    initializeMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []); // Pusta tablica zależności, aby uruchomić tylko raz

  const handleSearch = () => {
    if (!searchQuery) return;

    services
      .fuzzySearch({
        key: API_KEY,
        query: searchQuery,
      })
      .then((response) => {
        const results = response.results;
        setSearchResults(results);

        // Usuń poprzednie markery i ich popupy z mapy
        markers.forEach((marker) => marker.remove());
        setMarkers([]);

        // Dodaj nowe markery dla aktualnych wyników
        const newMarkers = results.map((result) => {
          const marker = new tt.Marker().setLngLat(result.position).addTo(map);

          // Stwórz popup z adresem POI
          const popup = new tt.Popup({
            offset: [0, -30], // Przesuń popup nad marker
            closeButton: true, // Włącz przycisk zamykania popupu
          }).setHTML(`
            <div>
              <strong>${result.poi && result.poi.name ? result.poi.name : "Brak nazwy"}</strong>
              <p>${result.address.freeformAddress}</p>
            </div>
          `);

          marker.setPopup(popup);

          marker.getElement().addEventListener("click", () => {
            map.flyTo({
              center: result.position,
              zoom: 14,
            }).setHTML(`
              <div>
                <strong>${result.poi && result.poi.name ? result.poi.name : "Brak nazwy"}</strong>
                <p>${result.address.freeformAddress}</p>
              </div>
            `);
  ;

            // Otwórz popup po kliknięciu markera
            popup.addTo(map);
          });

          return marker;
        });
        setMarkers(newMarkers);

        // Dostosuj widok mapy, aby pokazać pierwszy wynik
        if (results.length > 0) {
          map.flyTo({
            center: results[0].position,
            zoom: 14,
          });
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="App">
      <div className="search-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Szukaj lokalizacji..."
        />
        <button onClick={handleSearch}>Szukaj</button>
      </div>
      <div className="mapDiv" ref={mapElement}></div>
      <div className="results-container">
        {searchResults.map((result, index) => (
          <div
            key={index}
            className="result-item"
            onClick={() => {
              map.flyTo({
                center: result.position,
                zoom: 14,
              });

              // Otwórz popup na klikniętym wyniku
              const marker = markers[index];
              if (marker) {
                marker.getPopup().addTo(map);
              }
            }}
          >
            {result.poi && result.poi.name
              ? `${result.poi.name}, ${result.address.freeformAddress}`
              : result.address.freeformAddress}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
