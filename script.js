
document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const checkBtn = document.getElementById('check-btn');
    const togglePwdBtn = document.getElementById('toggle-pwd-btn');
    const loginWrapper = document.getElementById('login-wrapper');
    const heroNameError = document.getElementById('hero-name-error');
    const battleFooter = document.getElementById('battle-footer');
    
    // Top-Left HUD References
    const hudKnightImg = document.getElementById('hud-knight-img');
    const hudKnightTitle = document.getElementById('hud-knight-title');
    const hudEquipmentTag = document.getElementById('hud-equipment-tag');
    const hudHpBar = document.getElementById('hud-hp-bar');
    const hudPercentageText = document.getElementById('hud-percentage-text');
    
    // Center Login Window References
    const strengthText = document.getElementById('strength-text');
    const strengthLabel = document.getElementById('strength-label');
    const crackTimePanel = document.getElementById('crack-time-panel');
    const crackTimeValue = document.getElementById('crack-time-value');
    const suggestionsPanel = document.getElementById('suggestions-panel');
    const suggestionsList = document.getElementById('suggestions-list');
    const generatePwdBtn = document.getElementById('generate-pwd-btn');
    
    // Background Cross-Fade Layer References
    const bgLayer1 = document.getElementById('bg-layer-1');
    const bgLayer2 = document.getElementById('bg-layer-2');
    let activeBgLayer = 1; // 1 or 2
    let currentBgSrc = 'assets/knight-unequiped.png';

    // Requirements Checklist
    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-upper');
    const reqLower = document.getElementById('req-lower');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    // State Tracking
    let currentTier = 'empty';

    // ----------------------------------------------------------------------
    // 1. SOUND SYNTHESIZER (Web Audio API Retro 8-Bit Effects)
    // ----------------------------------------------------------------------
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playRetroSound(type) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'click') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'upgrade') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(330, now);
                osc.frequency.setValueAtTime(440, now + 0.06);
                osc.frequency.setValueAtTime(660, now + 0.12);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'powerup') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.08);
                osc.frequency.setValueAtTime(659.25, now + 0.16);
                osc.frequency.setValueAtTime(880, now + 0.24);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }
        } catch (e) {
            // Audio context fallback if muted
        }
    }

    function transitionBackground(imageSrc) {
        if (currentBgSrc === imageSrc) return;
        currentBgSrc = imageSrc;

        if (activeBgLayer === 1) {
            bgLayer2.style.backgroundImage = `url('${imageSrc}')`;
            bgLayer2.classList.add('active');
            bgLayer1.classList.remove('active');
            activeBgLayer = 2;
        } else {
            bgLayer1.style.backgroundImage = `url('${imageSrc}')`;
            bgLayer1.classList.add('active');
            bgLayer2.classList.remove('active');
            activeBgLayer = 1;
        }
    }

    function evaluatePassword(pwd) {
        if (!pwd || pwd.length === 0) {
            return {
                tier: 'empty',
                percentage: 0,
                colorClass: 'gray-bar',
                message: "Enter the hero's name and the secret pass to begin.",
                knightImage: 'assets/knight-unequiped.png',
                label: 'UNEQUIPPED'
            };
        }

        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

        const onlyLowercase = /^[a-z]+$/.test(pwd);
        const onlyNumbers = /^[0-9]+$/.test(pwd);
        const isLessThan8 = pwd.length < 8;

        // STRONG TIER: minimum 10 chars, uppercase, lowercase, number, special char
        if (pwd.length >= 10 && hasUpper && hasLower && hasNumber && hasSpecial) {
            return {
                tier: 'strong',
                percentage: 100,
                colorClass: 'green-bar',
                message: 'Your knight is capable to face the dragon. Press enter to defeat it.',
                knightImage: 'assets/knight-equiped.png',
                label: 'FULL ARMOR + SWORD'
            };
        }

        // MODERATE TIER: at least 8 chars, uppercase, lowercase, numbers, but NO special character
        if (pwd.length >= 8 && hasUpper && hasLower && hasNumber && !hasSpecial) {
            return {
                tier: 'moderate',
                percentage: 60,
                colorClass: 'yellow-bar',
                message: 'Our defenses are improving, but you still lack the weapon needed to defeat the dragon.',
                knightImage: 'assets/knight-shield-armor.png',
                label: 'ARMOR + SHIELD'
            };
        }

        // WEAK TIER: less than 8 chars OR contains only lowercase OR contains only numbers
        if (isLessThan8 || onlyLowercase || onlyNumbers) {
            return {
                tier: 'weak',
                percentage: 25,
                colorClass: 'red-bar',
                message: 'You have the armor but not the shield and the sword. Complete the below quest to power up.',
                knightImage: 'assets/knight-armor.png',
                label: 'ARMOR EQUIPPED'
            };
        }

        // FALLBACK MODERATE: >= 8 chars with mixed attributes
        if (pwd.length >= 8 && (hasUpper || hasNumber || hasSpecial) && (hasLower || hasNumber)) {
            return {
                tier: 'moderate',
                percentage: 60,
                colorClass: 'yellow-bar',
                message: 'Our defenses are improving, but you still lack the weapon needed to defeat the dragon.',
                knightImage: 'assets/knight-shield-armor.png',
                label: 'ARMOR + SHIELD'
            };
        }

        // Default to Weak
        return {
            tier: 'weak',
            percentage: 25,
            colorClass: 'red-bar',
            message: 'You have the armor but not the shield and the sword. Complete the below quest to power up.',
            knightImage: 'assets/knight-armor.png',
            label: 'ARMOR EQUIPPED'
        };
    }
    /**
     * Calculates password entropy in bits.
     * @param {string} pwd
     * @returns {number} entropy bits
     */
    function calculateEntropy(pwd) {
        if (!pwd || pwd.length === 0) return 0;
        let pool = 0;
        if (/[a-z]/.test(pwd)) pool += 26;
        if (/[A-Z]/.test(pwd)) pool += 26;
        if (/[0-9]/.test(pwd)) pool += 10;
        if (/[^a-zA-Z0-9]/.test(pwd)) pool += 32;
        return pool > 0 ? Math.log2(pool) * pwd.length : 0;
    }

    /**
     * Returns a human-readable crack time estimate based on entropy.
     * Assumes ~10 billion guesses/second (fast offline attack).
     * @param {number} entropy  bits
     * @returns {{ label: string, cssClass: string }}
     */
    function estimateCrackTime(entropy) {
        // combinations = 2^entropy, guesses/sec = 1e10
        const combinations = Math.pow(2, entropy);
        const seconds = combinations / 1e10;

        if (seconds < 0.001)  return { label: 'INSTANTLY',          cssClass: 'crack-instant' };
        if (seconds < 1)      return { label: 'LESS THAN A SECOND', cssClass: 'crack-seconds' };
        if (seconds < 60)     return { label: 'A FEW SECONDS',      cssClass: 'crack-seconds' };
        if (seconds < 3600)   return { label: 'A FEW MINUTES',      cssClass: 'crack-minutes' };
        if (seconds < 86400)  return { label: 'SEVERAL HOURS',      cssClass: 'crack-minutes' };
        if (seconds < 2592000)return { label: 'SEVERAL DAYS',       cssClass: 'crack-days' };
        if (seconds < 3.15e7) return { label: 'SEVERAL MONTHS',     cssClass: 'crack-days' };
        if (seconds < 3.15e9) return { label: 'SEVERAL YEARS',      cssClass: 'crack-years' };
        if (seconds < 3.15e12)return { label: 'CENTURIES',          cssClass: 'crack-strong' };
        if (seconds < 3.15e16)return { label: 'MILLIONS OF YEARS',  cssClass: 'crack-strong' };
        return                        { label: 'HEAT DEATH OF THE UNIVERSE', cssClass: 'crack-strong' };
    }

    /**
     * Generates live password suggestions.
     * @param {string} pwd
     * @returns {Array<{text:string, ok:boolean}>}
     */
    function generateSuggestions(pwd) {
        const hints = [];
        const hasUpper   = /[A-Z]/.test(pwd);
        const hasLower   = /[a-z]/.test(pwd);
        const hasNumber  = /[0-9]/.test(pwd);
        const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
        const len        = pwd.length;
        const commonPatterns = /^(123|abc|qwerty|password|pass|admin|login|letmein|welcome|monkey|dragon|master)/i;

        // Length
        if (len < 8)        hints.push({ text: '\u274c Too short — aim for 10+ characters', ok: false });
        else if (len >= 10) hints.push({ text: '\u2714 Good length',                          ok: true  });
        else                hints.push({ text: '\u26a0 Acceptable length — 10+ is better',   ok: false });

        // Character variety
        if (!hasUpper)   hints.push({ text: '\u274c Add uppercase letters (A-Z)',    ok: false });
        else             hints.push({ text: '\u2714 Contains uppercase letters',      ok: true  });

        if (!hasLower)   hints.push({ text: '\u274c Add lowercase letters (a-z)',    ok: false });
        else             hints.push({ text: '\u2714 Contains lowercase letters',      ok: true  });

        if (!hasNumber)  hints.push({ text: '\u274c Add numbers (0-9)',               ok: false });
        else             hints.push({ text: '\u2714 Contains numbers',                ok: true  });

        if (!hasSpecial) hints.push({ text: '\u274c Add symbols (!@#$%...)',          ok: false });
        else             hints.push({ text: '\u2714 Contains symbols',                ok: true  });

        // Pattern check
        if (commonPatterns.test(pwd)) hints.push({ text: '\u274c Avoid common patterns (123, abc...)', ok: false });

        // Overall verdict
        if (hasUpper && hasLower && hasNumber && hasSpecial && len >= 10) {
            hints.push({ text: '\u2714 Excellent password!', ok: true });
        } else if (hasUpper && hasLower && hasNumber && len >= 8) {
            hints.push({ text: '\u26a0 Good — add symbols for maximum strength', ok: false });
        }

        return hints;
    }

    /**
     * Generates a cryptographically strong password of 16-20 chars.
     * Avoids ambiguous characters: O, 0, l, I.
     * @returns {string}
     */
    function generatePassword() {
        const upper   = 'ABCDEFGHJKMNPQRSTUVWXYZ';   // no O, I
        const lower   = 'abcdefghjkmnpqrstuvwxyz';   // no l
        const numbers = '23456789';                   // no 0
        const symbols = '!@#$%^&*-+=?';
        const all     = upper + lower + numbers + symbols;

        const length = 16 + Math.floor(Math.random() * 5); // 16–20
        const arr = new Uint32Array(length);
        crypto.getRandomValues(arr);

        // Guarantee at least one from each set
        const mandatory = [
            upper  [arr[0] % upper.length],
            lower  [arr[1] % lower.length],
            numbers[arr[2] % numbers.length],
            symbols[arr[3] % symbols.length]
        ];

        const rest = Array.from(arr.slice(4)).map(n => all[n % all.length]);
        const combined = [...mandatory, ...rest].slice(0, length);

        // Shuffle using Fisher-Yates with crypto random
        const shuffleArr = new Uint32Array(combined.length);
        crypto.getRandomValues(shuffleArr);
        for (let i = combined.length - 1; i > 0; i--) {
            const j = shuffleArr[i] % (i + 1);
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        return combined.join('');
    }
    /**
     * Updates Knight Profile HUD avatar & equipment tag.
     */
    function updateKnight(imageSrc, labelText) {
        // Update Top-Left Knight Profile avatar & tag
        if (hudKnightImg) {
            hudKnightImg.src = imageSrc;
        }
        if (hudEquipmentTag) {
            hudEquipmentTag.textContent = labelText;
        }
    }

    /**
     * Updates Top-Left HUD strength progress bar.
     */
    function updateProgress(percentage, colorClass) {
        if (hudHpBar) {
            hudHpBar.style.width = `${percentage}%`;
            hudHpBar.className = `hud-hp-bar ${colorClass}`;
        }
        if (hudPercentageText) {
            hudPercentageText.textContent = `${percentage}%`;
        }
    }

    /**
     * Updates strength text display below ENTER button.
     */
    function updateStrengthText(message, tier) {
        if (strengthText) {
            strengthText.textContent = message;
            strengthText.className = `strength-text ${tier}-state pop-anim`;
            setTimeout(() => {
                strengthText.classList.remove('pop-anim');
            }, 200);
        }
        // Update the strength label badge
        if (strengthLabel) {
            const labelMap = {
                weak:     { text: '⚠ WEAK',     cls: 'label-weak' },
                moderate: { text: '◈ MODERATE',  cls: 'label-moderate' },
                strong:   { text: '✦ STRONG',    cls: 'label-strong' }
            };
            const entry = labelMap[tier];
            if (entry) {
                strengthLabel.textContent = entry.text;
                strengthLabel.className = `strength-label ${entry.cls} visible`;
            } else {
                strengthLabel.textContent = '';
                strengthLabel.className = 'strength-label';
            }
        }
    }

    /**
     * Updates requirement checklist indicators.
     */
    function updateChecklist(pwd) {
        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
        const isLen8 = pwd.length >= 8;

        if (reqLength) reqLength.classList.toggle('met', isLen8);
        if (reqUpper) reqUpper.classList.toggle('met', hasUpper);
        if (reqLower) reqLower.classList.toggle('met', hasLower);
        if (reqNumber) reqNumber.classList.toggle('met', hasNumber);
        if (reqSpecial) reqSpecial.classList.toggle('met', hasSpecial);
    }

    // Main Update Handler
    function processPasswordCheck(isEnterPressed = false) {
        const pwd = passwordInput.value;
        const result = evaluatePassword(pwd);

        // Sound trigger on tier change
        if (result.tier !== currentTier) {
            if (result.tier === 'strong') {
                playRetroSound('powerup');
            } else if (result.tier === 'moderate' || result.tier === 'weak') {
                playRetroSound('upgrade');
            }
            currentTier = result.tier;
        }

        // Call required update functions
        updateKnight(result.knightImage, result.label);
        updateProgress(result.percentage, result.colorClass);

        // Handle background image updates & removal of guild login option:
        if (isEnterPressed) {
            if (result.tier === 'strong') {
                // Validate: hero name must be entered
                const heroName = usernameInput ? usernameInput.value.trim() : '';
                if (!heroName) {
                    // Block entry — show red error message, do nothing else
                    if (heroNameError) heroNameError.classList.add('visible');
                    if (usernameInput) usernameInput.focus();
                    return;
                }

                // Clear any error if name is present
                if (heroNameError) heroNameError.classList.remove('visible');

                // If password is strong and name is filled and Enter is pressed:
                // 1. Set victory image as background
                transitionBackground('assets/victory-bg.jpg');
                playRetroSound('powerup');
                
                // 2. Remove / hide the Guild Login option window
                if (loginWrapper) {
                    loginWrapper.classList.add('hidden');
                }

                // 3. Hide the footer
                if (battleFooter) {
                    battleFooter.classList.add('hidden');
                }
                
                updateStrengthText('VICTORY! THE PASSWORD IS STRONG! YOU ARE UNSTOPPABLE!', result.tier);
            } else {
                // If password is weak or moderate and user is pressing enter: DON'T DO ANYTHING, DON'T CHANGE THE IMAGE
                updateStrengthText(result.message, result.tier);
            }
        } else {
            // While typing: update normal tier background if not already victory image
            if (currentBgSrc !== 'assets/victory-bg.jpg') {
                transitionBackground(result.knightImage);
            }
            // If strong but no hero name yet, show a nudge message instead
            if (result.tier === 'strong' && usernameInput && !usernameInput.value.trim()) {
                updateStrengthText(
                    "Your knight is fully equipped. Victory is within reach. Enter your hero's name to begin the battle.",
                    result.tier
                );
            } else {
                updateStrengthText(result.message, result.tier);
            }
        }

        updateChecklist(pwd);

        // --- FEATURE 1: Crack Time ---
        if (pwd.length > 0) {
            const entropy  = calculateEntropy(pwd);
            const crack    = estimateCrackTime(entropy);
            const crackVal = document.getElementById('crack-time-value');
            const crackBadge = document.getElementById('crack-entropy-badge');
            if (crackVal) {
                crackVal.textContent = crack.label;
                crackVal.className   = `crack-panel-value ${crack.cssClass}`;
            }
            if (crackBadge) {
                crackBadge.textContent = `${Math.round(entropy)} BITS`;
            }
            crackTimePanel.classList.add('visible');
        } else {
            crackTimePanel.classList.remove('visible');
        }

        // --- FEATURE 2: Suggestions ---
        if (pwd.length > 0) {
            const hints = generateSuggestions(pwd);
            suggestionsList.innerHTML = '';
            hints.forEach((h, i) => {
                const el = document.createElement('div');
                el.className = `suggestion-item ${h.ok ? 'ok' : 'bad'}`;
                el.textContent = h.text;
                el.style.animationDelay = `${i * 40}ms`;
                suggestionsList.appendChild(el);
            });
            suggestionsPanel.classList.add('visible');
        } else {
            suggestionsPanel.classList.remove('visible');
            suggestionsList.innerHTML = '';
        }
    }

    // Hero Name typing updates HUD knight title & clears error
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const nameVal = usernameInput.value.trim();
            if (hudKnightTitle) {
                hudKnightTitle.textContent = nameVal ? nameVal.toUpperCase() : 'HERO KNIGHT';
            }
            // Clear error as soon as user starts typing
            if (nameVal && heroNameError) {
                heroNameError.classList.remove('visible');
            }
        });
    }

    // Real-time password typing updates
    passwordInput.addEventListener('input', () => {
        processPasswordCheck(false);
    });

    // Enter Key Press in Username or Password Input
    const handleEnterPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            playRetroSound('click');
            checkBtn.classList.add('btn-pressed');
            processPasswordCheck(true);
            setTimeout(() => {
                checkBtn.classList.remove('btn-pressed');
            }, 300);
        }
    };

    passwordInput.addEventListener('keydown', handleEnterPress);
    if (usernameInput) {
        usernameInput.addEventListener('keydown', handleEnterPress);
    }

    // Enter / Check Strength button click
    checkBtn.addEventListener('click', () => {
        playRetroSound('click');
        checkBtn.classList.add('btn-pressed');
        processPasswordCheck(true);
        setTimeout(() => {
            checkBtn.classList.remove('btn-pressed');
        }, 300);
    });

    // Toggle Password Visibility
    togglePwdBtn.addEventListener('click', () => {
        playRetroSound('click');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePwdBtn.textContent = '🔒';
        } else {
            passwordInput.type = 'password';
            togglePwdBtn.textContent = '👁️';
        }
    });

    // --- FEATURE 3: Generate Strong Password ---
    if (generatePwdBtn) {
        generatePwdBtn.addEventListener('click', () => {
            playRetroSound('upgrade');
            const newPwd = generatePassword();
            passwordInput.value = newPwd;
            // If hidden (type=password is fine), keep as-is
            // Trigger full update exactly as if user typed
            processPasswordCheck(false);
            // Brief visual flash on button
            generatePwdBtn.classList.add('btn-flash');
            setTimeout(() => generatePwdBtn.classList.remove('btn-flash'), 300);
        });
    }

    // Initial State Setup
    passwordInput.value = '';
    processPasswordCheck(false);
});
