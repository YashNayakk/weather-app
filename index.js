const yourweatherContainer = document.querySelector("[data-yourWeather]");
const yourTab              = document.querySelector("[data-your]");
const searchTab            = document.querySelector("[data-search]");
const grantlocationTab     = document.querySelector("[data-grantLocation]");
const loadingTab           = document.querySelector("[data-loading]");
const searchformview       = document.querySelector("[data-searchform]");   // FIX: added missing ]
const errorContainer       = document.querySelector("[data-error]");
const errorMsg             = document.querySelector("[data-errorMsg]");

const API_KEY = "d1845658f92b31c64bd94f06f7188c9c";

let currentTab = yourTab;
currentTab.classList.add("current-tab");

getfromSessionStorage();

function switchTab(clickedTab) {
    if (currentTab !== clickedTab) {
        currentTab.classList.remove("current-tab");
        currentTab = clickedTab;
        currentTab.classList.add("current-tab");

        if (!searchformview.classList.contains("active")) {
            // Switching TO search tab
            grantlocationTab.classList.remove("active");
            yourweatherContainer.classList.remove("active");
            errorContainer.classList.remove("active");
            searchformview.classList.add("active");
        } else {
            // Switching BACK to Your Weather tab
            searchformview.classList.remove("active");
            yourweatherContainer.classList.remove("active");
            errorContainer.classList.remove("active");
            getfromSessionStorage();
        }
    }
}

yourTab.addEventListener("click",   () => switchTab(yourTab));
searchTab.addEventListener("click", () => switchTab(searchTab));

function getfromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) {
        grantlocationTab.classList.add("active");
    } else {
        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}

async function fetchUserWeatherInfo(coordinates) {
    const { lat, lon } = coordinates;

    grantlocationTab.classList.remove("active");
    errorContainer.classList.remove("active");
    loadingTab.classList.add("active");

    try {
        // FIX: use lat & lon parameters, not ?q=city
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();

        if (data.cod !== 200) {
            throw new Error(data.message || "Failed to fetch weather.");
        }

        loadingTab.classList.remove("active");
        yourweatherContainer.classList.add("active");
        renderWeatherInfo(data);
    } catch (err) {
        loadingTab.classList.remove("active");
        showError("Could not fetch your location's weather. Please try again.");
        console.error("fetchUserWeatherInfo error:", err);
    }
}

async function fetchSearchWeatherInfo(city) {
    loadingTab.classList.add("active");
    yourweatherContainer.classList.remove("active");
    grantlocationTab.classList.remove("active");
    errorContainer.classList.remove("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();

        if (data.cod !== 200) {
            throw new Error(data.message || "City not found.");
        }

        loadingTab.classList.remove("active");
        yourweatherContainer.classList.add("active");
        renderWeatherInfo(data);
    } catch (err) {
        loadingTab.classList.remove("active");
        showError(`Could not find weather for "${city}". Check the city name and try again.`);
        console.error("fetchSearchWeatherInfo error:", err);
    }
}

function renderWeatherInfo(weatherInfo) {
    const cloudsTab   = document.querySelector("[data-clouds]");
    const humidityTab = document.querySelector("[data-humidity]");
    const windspeedTab= document.querySelector("[data-windspeed]");
    const descTab     = document.querySelector("[data-desc]");
    const desciconTab = document.querySelector("[data-descIcon]");   // FIX: was missing opening [
    const tempTab     = document.querySelector("[data-temp]");
    const countryTab  = document.querySelector("[data-country]");
    const cityTab     = document.querySelector("[data-city]");

    cityTab.innerText    = weatherInfo?.name;
    // FIX: changed * to x in the flag CDN URL dimension format
    countryTab.src       = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country?.toLowerCase()}.png`;
    descTab.innerText    = weatherInfo?.weather?.[0]?.description;
    tempTab.innerText    = `${Math.round(weatherInfo?.main?.temp)}°C`;
    windspeedTab.innerText = `${weatherInfo?.wind?.speed} m/s`;
    humidityTab.innerText  = `${weatherInfo?.main?.humidity}%`;
    cloudsTab.innerText    = `${weatherInfo?.clouds?.all}%`;
    // FIX: was https// (missing colon)
    desciconTab.src      = `https://openweathermap.org/img/w/${weatherInfo?.weather?.[0]?.icon}.png`;
}

function showError(message) {
    errorMsg.innerText = message;
    errorContainer.classList.add("active");
}

const grantAccessBtn = document.querySelector(".btn");
grantAccessBtn.addEventListener("click", getlocation);

function getlocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, () => {
            showError("Location access denied. Please allow location or use Search.");
        });
    } else {
        showError("Geolocation is not supported by your browser.");
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
}

const searchInput = document.querySelector("[data-searchInput]");  // FIX: added missing ]

searchformview.addEventListener("submit", (e) => {
    e.preventDefault();
    const cityName = searchInput.value.trim();
    if (!cityName) return;
    fetchSearchWeatherInfo(cityName);
});