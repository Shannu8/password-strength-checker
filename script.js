/* ==========================================================================
   RETRO FANTASY RPG LOGIN & DYNAMIC BACKGROUND LOGIC (script.js)
   ========================================================================== */

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

    // ----------------------------------------------------------------------
    // 2. BACKGROUND TRANSITION MANAGER
    // ----------------------------------------------------------------------
    /**
     * Cross-fades full-screen page background image smoothly.
     */
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

    // ----------------------------------------------------------------------
    // 3. PASSWORD EVALUATION LOGIC
    // ----------------------------------------------------------------------

    /**
     * Evaluates password text and returns tier state object.
     * @param {string} pwd
     * @returns {object} { tier, percentage, colorClass, message, knightImage, label }
     */
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

    // ----------------------------------------------------------------------
    // 4. UI UPDATE FUNCTIONS (REQUIRED BY PROMPT)
    // ----------------------------------------------------------------------

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
    }

    // ----------------------------------------------------------------------
    // 5. EVENT LISTENERS
    // ----------------------------------------------------------------------
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

    // Initial State Setup
    passwordInput.value = '';
    processPasswordCheck(false);
});
