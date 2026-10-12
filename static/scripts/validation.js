/*
    Shared form helpers for the registration and edit profile pages:
    - inline field validation (on blur first, then live while the user fixes the field)
    - remote availability checks (username, email, phone) with debounce
    - country / city / phone prefix suggestions
    - avatar uploader with drag & drop, preview and client-side checks
    The rules mirror the server-side ones in app.py and helpers.py.
*/
const Validation = (() => {

    const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

    /* ---------- field state ---------- */

    // state: 'valid' | 'invalid' | 'pending' | null (neutral)
    function setState(input, state, message = '') {
        const feedback = document.getElementById(input.id + '-feedback');
        input.classList.toggle('is-invalid', state === 'invalid');
        input.classList.toggle('is-valid', state === 'valid');
        input.setAttribute('aria-invalid', state === 'invalid' ? 'true' : 'false');
        if (feedback) {
            feedback.textContent = message;
            feedback.className = 'field-feedback' + (state ? ' is-' + state : '');
        }
    }

    function debounce(fn, wait) {
        let timer;
        return (...args) => new Promise(resolve => {
            clearTimeout(timer);
            timer = setTimeout(() => resolve(fn(...args)), wait);
        });
    }

    /* ---------- rules (return an error message, or null when the value is fine) ---------- */

    const rules = {
        required: label => value => value ? null : `Please enter ${label}`,

        username: value => {
            if (!/^[A-Za-z0-9_-]*$/.test(value)) return 'Only letters, numbers, - and _ are allowed';
            if (value.length < 3) return 'Use at least 3 characters';
            if (value.length > 30) return 'Use 30 characters or fewer';
            return null;
        },

        name: value => /^\p{L}+$/u.test(value) ? null : 'Use letters only (no spaces, numbers or symbols)',

        email: value => /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(value)
            ? null : 'Enter a valid email address, like name@example.com',

        birthday: value => {
            const birthday = new Date(value);
            if (isNaN(birthday.getTime())) return 'Enter a valid date';
            const now = new Date();
            if (birthday > now) return "Your birthday can't be in the future";
            let age = now.getFullYear() - birthday.getFullYear();
            const m = now.getMonth() - birthday.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birthday.getDate())) age--;
            if (age > 130) return "That date doesn't look right — please check the year";
            if (age < 14) return 'You must be at least 14 years old to join HERE';
            return null;
        },

        maxLength: (max, label) => value => value.length > max
            ? `${label} is ${value.length} characters — the limit is ${max}` : null,
    };

    /* ---------- password strength (same scoring as password_check in helpers.py) ---------- */

    let commonPasswords = null;
    function loadCommonPasswords() {
        if (!commonPasswords) {
            commonPasswords = fetch('/data/common.txt')
                .then(r => r.text())
                .then(text => new Set(text.split('\n').map(p => p.trim())))
                .catch(() => new Set());
        }
        return commonPasswords;
    }

    function passwordStrength(password, common = new Set()) {
        if (common.has(password)) {
            return { score: 0, level: 0, ok: false, message: 'This password is too common and easy to guess' };
        }
        const checks = {
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            digit: /[0-9]/.test(password),
            symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
        const length = password.length;
        let score = [8, 12, 17, 20].filter(n => length > n).length;
        const variety = Object.values(checks).filter(Boolean).length;
        score += [1, 2, 3].filter(n => variety > n).length;

        const hints = [];
        if (length <= 12) hints.push(`${13 - length} more character${13 - length === 1 ? '' : 's'}`);
        if (!checks.upper) hints.push('an uppercase letter');
        if (!checks.lower) hints.push('a lowercase letter');
        if (!checks.digit) hints.push('a number');
        if (!checks.symbol) hints.push('a symbol like ! ? # *');

        const ok = score >= 5;
        const level = score >= 6 ? 4 : score >= 5 ? 3 : score >= 3 ? 2 : 1;
        const message = ok
            ? (level === 4 ? 'Very strong password' : 'Strong password')
            : 'Too weak — add ' + (hints.length ? hints.join(', ') : 'a few more characters');
        return { score, level, ok, message };
    }

    // Wires a password input to a 4-segment strength meter; returns a rule usable in a form config
    function passwordField(input, meter) {
        let common = new Set();
        loadCommonPasswords().then(set => { common = set; });
        const update = () => {
            const result = input.value ? passwordStrength(input.value, common) : null;
            if (meter) meter.dataset.level = result ? result.level : 0;
            return result;
        };
        input.addEventListener('input', update);
        return value => {
            const result = update();
            if (!value) return 'Please enter a password';
            return result.ok ? null : result.message;
        };
    }

    function strengthMessage(input) {
        return passwordStrength(input.value).message;
    }

    /* ---------- form controller ---------- */

    /*
        fields: [{ input, validate(value) -> error|null, remote(value) -> Promise<error|null>, validMessage, optional }]
        Errors appear after the user leaves a field (or submits), then update live while they fix it.
    */
    function bindForm(form, fields, { summary, submitButton, busyText } = {}) {
        const pending = new Map();

        async function run(field, { immediate = false } = {}) {
            const value = field.input.type === 'file' ? '' : field.input.value.trim();
            const error = field.validate ? field.validate(value) : null;
            if (error) {
                setState(field.input, 'invalid', error);
                return false;
            }
            if (!value && field.optional !== false) {
                setState(field.input, null);
                return true;
            }
            if (field.remote) {
                setState(field.input, 'pending', 'Checking…');
                const check = immediate ? field.remote(value) : field.debouncedRemote(value);
                pending.set(field, check);
                const remoteError = await check;
                if (pending.get(field) !== check) return true;  // a newer check replaced this one
                pending.delete(field);
                if (field.input.value.trim() !== value) return true;
                if (remoteError) {
                    setState(field.input, 'invalid', remoteError);
                    return false;
                }
            }
            setState(field.input, 'valid', typeof field.validMessage === 'function' ? field.validMessage(value) : (field.validMessage || ''));
            return true;
        }

        fields.forEach(field => {
            field.touched = field.input.classList.contains('is-invalid');  // server-side error: validate live right away
            if (field.remote) field.debouncedRemote = debounce(field.remote, 350);
            field.input.addEventListener('blur', () => {
                if (field.input.value.trim() || field.touched) {
                    field.touched = true;
                    run(field);
                }
            });
            field.input.addEventListener(field.input.tagName === 'SELECT' ? 'change' : 'input', () => {
                if (field.touched) run(field);
            });
        });

        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (summary) summary.hidden = true;
            fields.forEach(field => field.touched = true);
            const results = await Promise.all(fields.map(field => run(field, { immediate: true })));
            const invalid = fields.filter((field, i) => !results[i]);

            if (invalid.length) {
                if (summary) {
                    const labels = invalid.map(f => {
                        const label = form.querySelector(`label[for="${f.input.id}"]`);
                        return label ? label.textContent.replace('*', '').trim() : f.input.name;
                    });
                    summary.textContent = `Please fix ${invalid.length === 1 ? 'this field' : 'these ' + invalid.length + ' fields'}: ${[...new Set(labels)].join(', ')}`;
                    summary.hidden = false;
                }
                const first = invalid[0].input;
                first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                first.focus({ preventScroll: true });
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = busyText || 'Saving…';
            }
            form.submit();
        });

        form.addEventListener('reset', () => {
            fields.forEach(field => { field.touched = false; setState(field.input, null); });
            if (summary) summary.hidden = true;
        });

        return { run };
    }

    /* ---------- remote checks ---------- */

    function remoteExists(endpoint, message) {
        return async value => {
            try {
                const response = await fetch(`${endpoint}/${encodeURIComponent(value)}`);
                const result = await response.json();
                return result.exists ? message : null;
            } catch (error) {
                return null;  // the server validates again on submit
            }
        };
    }

    /* ---------- country / city / prefix ---------- */

    // Loads the csv lists once and returns { cities: Map(nation -> Set(city)), prefixes: Map(nation -> prefix), knownPrefixes: Set }
    let locationData = null;
    function loadLocations() {
        if (!locationData) {
            const cities = new Map();
            const prefixes = new Map();
            locationData = Promise.all([
                fetch('/data/worldcities.csv').then(r => r.text()).then(text => {
                    text.split('\n').slice(1).forEach(line => {
                        const [city, nation] = line.split(';').map(p => (p || '').trim().toLowerCase());
                        if (city && nation) {
                            if (!cities.has(nation)) cities.set(nation, new Set());
                            cities.get(nation).add(city);
                        }
                    });
                }),
                fetch('/data/nations_and_prefixes.csv').then(r => r.text()).then(text => {
                    text.split('\n').slice(1).forEach(line => {
                        const [nation, prefix] = line.split(';').map(p => (p || '').trim());
                        if (nation && prefix) prefixes.set(nation.toLowerCase(), prefix);
                    });
                }),
            ]).then(() => ({ cities, prefixes, knownPrefixes: new Set(prefixes.values()) }));
        }
        return locationData;
    }

    const titleCase = text => text.replace(/\b\p{L}/gu, c => c.toUpperCase());

    function fillDatalist(list, values, query, limit = 60) {
        const q = query.toLowerCase().trim();
        const matches = [];
        for (const value of values) {
            if (!q || value.startsWith(q)) matches.push(value);
            if (matches.length >= limit) break;
        }
        list.innerHTML = matches.map(v => `<option value="${titleCase(v)}"></option>`).join('');
    }

    /*
        Returns validation configs for the location/phone inputs:
        { nation, city, prefix, number } each a {input, validate, ...} entry for bindForm
    */
    function locationFields({ nation, city, nationList, cityList, prefix, number, suggestion }) {
        let data = null;

        const nationKey = () => nation.value.trim().toLowerCase();
        const nationValid = () => data && data.cities.has(nationKey());

        function refreshCity() {
            const ok = nationValid();
            city.disabled = !ok;
            city.placeholder = ok ? `Start typing a city in ${titleCase(nationKey())}` : 'Choose a country first';
            if (ok) fillDatalist(cityList, data.cities.get(nationKey()), city.value);
        }

        function refreshSuggestion() {
            if (!suggestion || !data) return;
            const found = data.prefixes.get(nationKey());
            if (found && prefix.value.trim() !== found) {
                suggestion.textContent = `Use ${found} (${titleCase(nationKey())})`;
                suggestion.dataset.prefix = found;
                suggestion.hidden = false;
            } else {
                suggestion.hidden = true;
            }
        }

        nation.disabled = true;
        loadLocations().then(loaded => {
            data = loaded;
            nation.disabled = false;
            nation.placeholder = 'Start typing your country';
            fillDatalist(nationList, data.cities.keys(), nation.value);
            refreshCity();
            refreshSuggestion();
        }).catch(() => {
            nation.disabled = false;
            nation.placeholder = 'Country';
        });

        nation.addEventListener('input', () => {
            if (!data) return;
            fillDatalist(nationList, data.cities.keys(), nation.value);
            refreshCity();
            refreshSuggestion();
        });
        city.addEventListener('input', () => { if (data && nationValid()) fillDatalist(cityList, data.cities.get(nationKey()), city.value); });
        prefix.addEventListener('input', refreshSuggestion);

        if (suggestion) {
            suggestion.addEventListener('click', () => {
                prefix.value = suggestion.dataset.prefix;
                prefix.dispatchEvent(new Event('input'));
                prefix.dispatchEvent(new Event('blur'));
                suggestion.hidden = true;
                number.focus();
            });
        }

        return {
            nation: {
                input: nation,
                validate: value => (value && data && !data.cities.has(value.toLowerCase())) ? 'Pick a country from the suggestions' : null,
            },
            city: {
                input: city,
                validate: value => {
                    if (!value || !data) return null;
                    if (!nationValid()) return 'Choose a valid country first';
                    return data.cities.get(nationKey()).has(value.toLowerCase())
                        ? null : `Pick a city in ${titleCase(nationKey())} from the suggestions`;
                },
            },
            prefix: {
                input: prefix,
                validate: value => {
                    if (!value) return number.value.trim() ? 'Add the country prefix (e.g. +39)' : null;
                    if (!/^\+[0-9 ]+$/.test(value)) return 'A prefix starts with + followed by digits, e.g. +39';
                    if (data && !data.knownPrefixes.has(value)) return "We don't recognise this prefix";
                    return null;
                },
            },
            number: {
                input: number,
                validate: value => (value && !/^[0-9 ()-]{4,20}$/.test(value)) ? 'Use digits only (spaces and - are fine)' : null,
                remote: async value => {
                    const p = prefix.value.trim();
                    if (!p) return null;
                    return remoteExists('/check-number', 'This phone number is already linked to another account')(`${p} ${value.replace(/-/g, ' ')}`);
                },
            },
        };
    }

    /* ---------- small UI helpers ---------- */

    function bindCharCounters(root = document) {
        root.querySelectorAll('[data-counter-for]').forEach(counter => {
            const input = document.getElementById(counter.dataset.counterFor);
            const max = Number(counter.dataset.max);
            const update = () => {
                const length = input.value.length;
                counter.textContent = `${length} / ${max}`;
                counter.classList.toggle('is-near', length > max * 0.9 && length <= max);
                counter.classList.toggle('is-over', length > max);
            };
            input.addEventListener('input', update);
            input.form && input.form.addEventListener('reset', () => setTimeout(update));
            update();
        });
    }

    function bindPasswordToggles(root = document) {
        root.querySelectorAll('[data-toggle-password]').forEach(button => {
            const input = document.getElementById(button.dataset.togglePassword);
            button.addEventListener('click', () => {
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                button.textContent = show ? 'Hide' : 'Show';
                button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            });
        });
    }

    /* ---------- avatar uploader ---------- */

    /*
        Markup: [data-avatar-uploader data-input="<file input id>" data-current="<url>"] containing
        .avatar-drop (label), .avatar-drop-img, .avatar-drop-initials, [data-avatar-remove], optional [data-avatar-remove-flag] hidden input
    */
    function avatarUploader(root) {
        const input = document.getElementById(root.dataset.input);
        const drop = root.querySelector('.avatar-drop');
        const img = root.querySelector('.avatar-drop-img');
        const initialsEl = root.querySelector('.avatar-drop-initials');
        const removeButton = root.querySelector('[data-avatar-remove]');
        const removeFlag = root.querySelector('[data-avatar-remove-flag]');
        const pickButton = root.querySelector('[data-avatar-pick]');
        const current = root.dataset.current || '';

        function show(src) {
            img.hidden = !src;
            initialsEl.hidden = !!src;
            if (src) img.src = src;
            root.classList.toggle('has-photo', !!src);
        }

        function restore() {
            input.value = '';
            if (removeFlag) removeFlag.value = '0';
            show(current);
            removeButton.hidden = !current;
            if (pickButton) pickButton.textContent = current ? 'Change photo' : 'Upload photo';
            setState(input, null);
        }

        function handle(file) {
            if (!file) return restore();
            const isHeic = file.type === 'image/heic' || /\.heic$/i.test(file.name);
            if (!PHOTO_TYPES.includes(file.type) && !isHeic) {
                input.value = '';
                setState(input, 'invalid', `“${file.name}” isn't a supported image — use JPG, PNG, WEBP or HEIC`);
                return;
            }
            if (file.size > MAX_PHOTO_SIZE) {
                input.value = '';
                setState(input, 'invalid', `This photo is ${(file.size / 1048576).toFixed(1)} MB — the limit is 5 MB`);
                return;
            }
            if (removeFlag) removeFlag.value = '0';
            removeButton.hidden = false;
            if (pickButton) pickButton.textContent = 'Change photo';
            if (isHeic) {
                show('');
                setState(input, 'valid', `${file.name} selected (HEIC preview isn't supported by your browser)`);
                return;
            }
            const reader = new FileReader();
            reader.onload = e => show(e.target.result);
            reader.readAsDataURL(file);
            setState(input, 'valid', `${file.name} · ${(file.size / 1024).toFixed(0)} KB — looking good!`);
        }

        input.addEventListener('change', () => handle(input.files[0]));

        removeButton.addEventListener('click', () => {
            input.value = '';
            show('');
            removeButton.hidden = true;
            if (pickButton) pickButton.textContent = 'Upload photo';
            if (removeFlag && current) {
                removeFlag.value = '1';
                setState(input, 'pending', 'Your photo will be removed when you save');
            } else {
                setState(input, null);
            }
        });

        // drag & drop
        ['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, e => {
            e.preventDefault();
            drop.classList.add('is-dragging');
        }));
        ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, () => drop.classList.remove('is-dragging')));
        drop.addEventListener('drop', e => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (!file) return;
            const transfer = new DataTransfer();
            transfer.items.add(file);
            input.files = transfer.files;
            handle(file);
        });

        // keyboard access for the clickable circle
        drop.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                input.click();
            }
        });

        // live initials from the name inputs
        if (initialsEl.dataset.initialsFrom) {
            const sources = initialsEl.dataset.initialsFrom.split(' ').map(id => document.getElementById(id)).filter(Boolean);
            const update = () => {
                const letters = sources.map(s => s.value.trim().charAt(0)).join('').toUpperCase();
                initialsEl.textContent = letters || '?';
            };
            sources.forEach(s => s.addEventListener('input', update));
        }

        input.form && input.form.addEventListener('reset', () => setTimeout(restore));
        restore();
    }

    return {
        setState, rules, bindForm, remoteExists, locationFields, passwordField,
        passwordStrength, strengthMessage, loadCommonPasswords,
        bindCharCounters, bindPasswordToggles, avatarUploader,
    };
})();
