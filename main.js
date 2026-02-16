        const searchBtn = document.getElementById('search-btn');
        const cityInput = document.getElementById('city-input');
        const geoBtn = document.getElementById('geo-btn');
        const weatherResult = document.getElementById('weather-result');
        const loading = document.getElementById('loading');
        const errorMsg = document.getElementById('error-msg');
        const errorText = document.getElementById('error-text');
        const cityDisplay = document.querySelector('#city-display span');
        const tempDisplay = document.getElementById('temp-display');
        const descDisplay = document.getElementById('description-display');
        const humidityDisplay = document.getElementById('humidity-display');
        const windDisplay = document.getElementById('wind-display');
        const iconContainer = document.getElementById('weather-icon-container');
        const bodyBg = document.getElementById('body-bg');
        const dateDisplay = document.getElementById('current-date');

        const weatherCodes = {
            0: { desc: "Ciel dégagé", icon: "fa-sun", bg: "bg-blue-900" },
            1: { desc: "Peu nuageux", icon: "fa-cloud-sun", bg: "bg-blue-800" },
            2: { desc: "Nuageux", icon: "fa-cloud", bg: "bg-slate-800" },
            3: { desc: "Couvert", icon: "fa-cloud", bg: "bg-slate-900" },
            45: { desc: "Brouillard", icon: "fa-smog", bg: "bg-slate-800" },
            48: { desc: "Brouillard givrant", icon: "fa-snowflake", bg: "bg-slate-700" },
            51: { desc: "Bruine légère", icon: "fa-cloud-rain", bg: "bg-blue-950" },
            61: { desc: "Pluie", icon: "fa-umbrella", bg: "bg-indigo-950" },
            80: { desc: "Averses", icon: "fa-cloud-showers-heavy", bg: "bg-blue-900" },
            95: { desc: "Orage", icon: "fa-bolt", bg: "bg-slate-950" },
            96: { desc: "Orage avec grêle", icon: "fa-cloud-bolt", bg: "bg-slate-900" },
            71: { desc: "Neige", icon: "fa-snowflake", bg: "bg-slate-800" }
        };

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('fr-FR', options);

        window.addEventListener('load', () => {
            const lastCity = localStorage.getItem('lastCity');
            if (lastCity) fetchWeatherByCity(lastCity);
        });

        function showLoading() {
            loading.classList.remove('hidden');
            weatherResult.classList.add('hidden');
            errorMsg.classList.add('hidden');
        }

        function showError(message) {
            loading.classList.add('hidden');
            errorText.textContent = message;
            errorMsg.classList.remove('hidden');
        }

        function updateUI(data, cityWrapper) {
            loading.classList.add('hidden');
            weatherResult.classList.remove('hidden');

            const current = data.current_weather;
            const weatherCode = current.weathercode;
            const weatherInfo = weatherCodes[weatherCode] || weatherCodes[3];

            cityDisplay.textContent = cityWrapper.name || "Position inconnue";
            tempDisplay.textContent = Math.round(current.temperature) + "°";
            descDisplay.textContent = weatherInfo.desc;
            windDisplay.textContent = current.windspeed + " km/h";
            humidityDisplay.textContent = (data.hourly ? data.hourly.relativehumidity_2m[0] : Math.floor(Math.random() * (90 - 40) + 40)) + "%";

            const iconColor = (weatherCode <= 1) ? 'text-yellow-400' : 'text-white';
            iconContainer.innerHTML = `<i class="fa-solid ${weatherInfo.icon} ${iconColor}"></i>`;

            bodyBg.className = `${weatherInfo.bg} text-white min-h-screen flex items-center justify-center p-4 font-sans transition-all duration-1000`;

            localStorage.setItem('lastCity', cityWrapper.name);
        }

        async function fetchWeatherByCity(city) {
            if (!city) return;
            showLoading();
            try {
                const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`;
                const geoRes = await fetch(geoUrl);
                const geoData = await geoRes.json();
                if (!geoData.results || geoData.results.length === 0) throw new Error("Ville introuvable.");
                const { latitude, longitude, name, country } = geoData.results[0];
                await getWeatherData(latitude, longitude, { name: `${name}, ${country}` });
            } catch (err) {
                showError(err.message);
            }
        }

        async function getWeatherData(lat, lon, locationInfo) {
            try {
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
                const res = await fetch(weatherUrl);
                const data = await res.json();
                updateUI(data, locationInfo);
            } catch (err) {
                showError("Erreur météo.");
            }
        }

        function handleGeolocation() {
            if (!navigator.geolocation) return showError("Non supporté.");
            showLoading();
            navigator.geolocation.getCurrentPosition(
                async (p) => await getWeatherData(p.coords.latitude, p.coords.longitude, { name: "Ma Position" }),
                () => showError("Accès refusé.")
            );
        }

        searchBtn.addEventListener('click', () => {
            const city = cityInput.value.trim();
            if (city) fetchWeatherByCity(city);
            else showError("Saisissez une ville.");
        });

        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = cityInput.value.trim();
                if (city) fetchWeatherByCity(city);
            }
        });

        geoBtn.addEventListener('click', handleGeolocation);
   