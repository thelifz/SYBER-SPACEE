// ==========================================================================
// SYBER SPACE — Cookie Consent & Geolocation Delivery Engine
// Compliant with India's DPDP Act 2023 & RBI E-Commerce Guidelines
// ==========================================================================

(function() {
    'use strict';

    // Cookie Utilities
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value || '') + expires + '; path=/; SameSite=Lax';
    }

    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }

    // Known Major Indian Geographic Hubs (Fast Coordinate Bounding Fallback)
    function inferIndianRegionFromCoords(lat, lon) {
        // Kerala & Malabar: ~8.3 to ~12.8 N, ~75.0 to ~77.5 E
        if (lat >= 8.3 && lat <= 12.8 && lon >= 75.0 && lon <= 77.5) {
            if (lat >= 9.8 && lat <= 10.3) return { city: 'Kochi', state: 'Kerala', pincode: '682001' };
            if (lat >= 8.3 && lat <= 9.0) return { city: 'Thiruvananthapuram', state: 'Kerala', pincode: '695001' };
            if (lat >= 11.0 && lat <= 11.5) return { city: 'Kozhikode', state: 'Kerala', pincode: '673001' };
            return { city: 'Ernakulam', state: 'Kerala', pincode: '682030' };
        }
        // Bengaluru / Karnataka: ~12.7 to ~13.5 N, ~77.3 to ~77.9 E
        if (lat >= 12.7 && lat <= 13.5 && lon >= 77.3 && lon <= 77.9) {
            return { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' };
        }
        // Chennai / Tamil Nadu: ~12.8 to ~13.4 N, ~80.0 to ~80.4 E
        if (lat >= 12.8 && lat <= 13.4 && lon >= 80.0 && lon <= 80.4) {
            return { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' };
        }
        // Mumbai / MMR: ~18.8 to ~19.4 N, ~72.7 to ~73.2 E
        if (lat >= 18.8 && lat <= 19.4 && lon >= 72.7 && lon <= 73.2) {
            return { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' };
        }
        // Delhi NCR: ~28.3 to ~28.9 N, ~76.9 to ~77.4 E
        if (lat >= 28.3 && lat <= 28.9 && lon >= 76.9 && lon <= 77.4) {
            return { city: 'New Delhi', state: 'Delhi', pincode: '110001' };
        }
        // Hyderabad / Telangana: ~17.2 to ~17.6 N, ~78.2 to ~78.6 E
        if (lat >= 17.2 && lat <= 17.6 && lon >= 78.2 && lon <= 78.6) {
            return { city: 'Hyderabad', state: 'Telangana', pincode: '500001' };
        }
        // General South / Pan-India Default
        return { city: 'Kochi', state: 'Kerala', pincode: '682031' };
    }

    // Reverse Geocode helper via OpenStreetMap Nominatim with safe fallback
    async function reverseGeocode(lat, lon) {
        const fallbackRegion = inferIndianRegionFromCoords(lat, lon);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2600);
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data && data.address) {
                    const addr = data.address;
                    const city = addr.city || addr.town || addr.county || addr.state_district || fallbackRegion.city;
                    const state = addr.state || fallbackRegion.state;
                    const pincode = addr.postcode || fallbackRegion.pincode;
                    return { city, state, pincode };
                }
            }
        } catch (e) {
            // Fall back cleanly to coordinate bounding
        }
        return fallbackRegion;
    }

    // Save Location in Cookies & Update Application State
    function saveLocation(locData) {
        setCookie('syber_user_city', locData.city, 60);
        setCookie('syber_user_state', locData.state, 60);
        setCookie('syber_user_pincode', locData.pincode, 60);
        setCookie('syber_location_detected', 'true', 60);

        updateHeaderDeliveryPill(locData.city, locData.pincode);
        populateCartFormFields(locData);
    }

    // Populate Checkout Form in cart.html if present
    function populateCartFormFields(locData) {
        const cityInput = document.getElementById('cust-city');
        const stateSelect = document.getElementById('cust-state');
        const pinInput = document.getElementById('cust-pincode');

        if (cityInput && (!cityInput.value || cityInput.value === 'Kochi')) {
            cityInput.value = locData.city;
        }
        if (pinInput && (!pinInput.value || pinInput.value === '682001')) {
            pinInput.value = locData.pincode;
        }
        if (stateSelect && locData.state) {
            for (let i = 0; i < stateSelect.options.length; i++) {
                if (stateSelect.options[i].value.toLowerCase().includes(locData.state.toLowerCase()) ||
                    stateSelect.options[i].text.toLowerCase().includes(locData.state.toLowerCase())) {
                    stateSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }

    // Update or Insert Delivery Pill in Symmetrical Header
    function updateHeaderDeliveryPill(city, pincode) {
        if (city && city.toLowerCase().includes('bengaluru') && (!pincode || pincode === '682001')) {
            pincode = '560001';
            setCookie('syber_user_pincode', '560001', 60);
        }

        const existingPill = document.getElementById('header-delivery-pill');
        const displayLabel = city ? `${city} (${pincode || 'Fast Track'})` : 'Set Location';

        if (existingPill) {
            const textSpans = existingPill.querySelectorAll('.nav-text');
            textSpans.forEach(span => {
                span.innerHTML = `Deliver: ${displayLabel}`;
            });
            return;
        }

        const navItemList = document.querySelector('.header-cta .nav-item-list');
        if (!navItemList) return;

        const pill = document.createElement('a');
        pill.href = '#';
        pill.id = 'header-delivery-pill';
        pill.className = 'nav-item delivery-location-nav-item';
        pill.setAttribute('aria-label', 'Delivery Location');
        pill.innerHTML = `
            <div class="nav-item_label">
                <span class="nav-text">Deliver: ${displayLabel}</span>
                <span class="nav-text is-2">Deliver: ${displayLabel}</span>
            </div>
            <div class="nav-item_bg"><div class="nav-item_bg_hover"></div></div>
        `;

        pill.addEventListener('click', (e) => {
            e.preventDefault();
            triggerLocationDetection(true);
        });

        // Insert before cart pill or first element
        const cartPill = navItemList.querySelector('.cart-pill');
        if (cartPill) {
            navItemList.insertBefore(pill, cartPill);
        } else {
            navItemList.prepend(pill);
        }
    }

    // Trigger Geolocation
    function triggerLocationDetection(isManualClick) {
        const bannerBtn = document.getElementById('cookie-detect-loc-btn');
        if (bannerBtn) {
            bannerBtn.classList.add('loading');
            bannerBtn.innerHTML = `
                <svg class="cookie-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                <span>Detecting Location...</span>
            `;
        }

        if (!navigator.geolocation) {
            handleLocationError('Geolocation not supported by browser', isManualClick);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const locData = await reverseGeocode(lat, lon);

                saveLocation(locData);

                if (bannerBtn) {
                    bannerBtn.classList.remove('loading');
                    bannerBtn.innerHTML = `
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${locData.city}, ${locData.state} Verified</span>
                    `;
                }

                // Silently save cookie consent & dismiss banner with zero intrusive toast
                setCookie('syber_cookie_consent', 'accepted', 365);
                dismissCookieBanner(400);
            },
            (err) => {
                handleLocationError(err.message, isManualClick);
            },
            { timeout: 7000, enableHighAccuracy: true }
        );
    }

    function handleLocationError(msg, isManualClick) {
        const bannerBtn = document.getElementById('cookie-detect-loc-btn');
        if (bannerBtn) {
            bannerBtn.classList.remove('loading');
            bannerBtn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Enter PIN Code</span>
            `;
        }

        // Default to Kerala HQ
        const fallback = { city: 'Kochi', state: 'Kerala', pincode: '682031' };
        saveLocation(fallback);

        if (isManualClick) {
            const pin = prompt('Enter your 6-digit delivery PIN code for courier ETA:', '682001');
            if (pin && pin.length === 6) {
                const customLoc = { city: 'Delivery Zone', state: 'India', pincode: pin };
                saveLocation(customLoc);
                setCookie('syber_cookie_consent', 'accepted', 365);
                dismissCookieBanner(200);
            }
        }
    }

    // Dismiss Cookie Banner smoothly
    function dismissCookieBanner(delayMs = 0) {
        setTimeout(() => {
            const banner = document.getElementById('syber-cookie-banner');
            if (banner) {
                banner.classList.add('closing');
                setTimeout(() => banner.remove(), 400);
            }
        }, delayMs);
    }

    // Silently initialize Cookie & Delivery Preferences with zero popup banners
    function injectCookieBanner() {
        setCookie('syber_cookie_consent', 'accepted', 365);
        const savedCity = getCookie('syber_user_city') || 'Kochi';
        const savedPin = getCookie('syber_user_pincode') || '682001';
        updateHeaderDeliveryPill(savedCity, savedPin);
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectCookieBanner();
            const savedCity = getCookie('syber_user_city');
            if (savedCity) {
                populateCartFormFields({
                    city: savedCity,
                    state: getCookie('syber_user_state') || 'Kerala',
                    pincode: getCookie('syber_user_pincode') || '682001'
                });
            }
        });
    } else {
        injectCookieBanner();
        const savedCity = getCookie('syber_user_city');
        if (savedCity) {
            populateCartFormFields({
                city: savedCity,
                state: getCookie('syber_user_state') || 'Kerala',
                pincode: getCookie('syber_user_pincode') || '682001'
            });
        }
    }

    // Expose helpers globally if needed
    window.SyberLocation = {
        detect: () => triggerLocationDetection(true),
        getCity: () => getCookie('syber_user_city') || 'Kochi',
        getState: () => getCookie('syber_user_state') || 'Kerala',
        getPincode: () => getCookie('syber_user_pincode') || '682031'
    };
})();
