const words = 'apple bicycle cloud dog elephant frog guitar hammock igloo jelly kettle lemon mountain notebook orange pencil queen rabbit sandwich table umbrella volcano window xylophone yellow zebra'.split(' ');
const wordsCount = words.length;
const gameTime = 30 * 1000;
window.time = null;

let startTime = 0;
let timeElapsed = 0;
let timerRunning = false;

function addClass(el, name) {
    el.className += ' ' + name;
}

function removeClass(el, name) {
    el.className = el.className.replace(name, '');
}

function randomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

function formatWord(word) {
    // Each letter is wrapped in its own <span>
    return `<div class="word"><span class="letter">${word.split('').join('</span><span class="letter">')}</span></div>`;
}

/**
 * Updates the cursor position based on the current letter or word.
 */
function updateCursor() {
    const cursor = document.getElementById('cursor');
    const nextLetter = document.querySelector('.letter.current');
    const nextWord = document.querySelector('.word.current');
    if (nextLetter || nextWord) {
        const rect = (nextLetter || nextWord).getBoundingClientRect();
        cursor.style.top = rect.top + 2 + 'px';
        cursor.style.left = rect[nextLetter ? 'left' : 'right'] + 'px';
    }
}

function startTimer() {
    // Capture the initial start time
    startTime = Date.now();
    timerRunning = true;
    updateTimer();
}

function updateTimer() {
    if (!timerRunning) return;

    const currentTime = Date.now();
    const msPassed = currentTime - startTime + timeElapsed;
    const sPassed = Math.round(msPassed / 1000);
    const sLeft = Math.max(0, Math.round((gameTime / 1000) - sPassed));

    // Update timer display
    document.getElementById('info').innerHTML = sLeft;

    // Check if time is up
    if (sLeft <= 0) {
        gameOver();
        return;
    }

    // Call the next frame for the timer update
    requestAnimationFrame(updateTimer);
}

/**
 * Initializes a new game.
 * @param {boolean} [shouldFocus=false] - If true, focus the game area.
 */
function newGame(shouldFocus = false) {
    const gameElement = document.getElementById('game');
    const wordsContainer = document.getElementById('words');
    const cursor = document.getElementById('cursor');

    // Remove the "over" class so input is allowed.
    gameElement.classList.remove('over');

    // Reset game-related variables.
    window.timer = null;
    window.gameStart = null;

    // Reset any styles (e.g., margin reset for scrolling words).
    wordsContainer.style.marginTop = '0px';

    // Hide the cursor until the first keypress.
    cursor.style.display = 'none';

    // Clear previous words and add new words.
    wordsContainer.innerHTML = '';
    for (let i = 0; i < 200; i++) {
        wordsContainer.innerHTML += formatWord(randomWord());
    }

    // Mark the first word and letter as "current".
    addClass(document.querySelector('.word'), 'current');
    addClass(document.querySelector('.letter'), 'current');

    // Reset the info display to show the full game time.
    document.getElementById('info').innerHTML = (gameTime / 1000) + '';

    // Focus the game area only if requested.
    if (shouldFocus) {
        gameElement.focus();
    }
}

function getWpm() {
    const wordElements = [...document.querySelectorAll('.word')];
    const lastTypedWord = document.querySelector('.word.current');
    const lastTypedWordIndex = wordElements.indexOf(lastTypedWord) + 1;
    const typedWords = wordElements.slice(0, lastTypedWordIndex);
    const correctWords = typedWords.filter(word => {
        const letters = [...word.children];
        const incorrectLetters = letters.filter(letter => letter.className.includes('incorrect'));
        const correctLetters = letters.filter(letter => letter.className.includes('correct'));
        return incorrectLetters.length === 0 && correctLetters.length === letters.length;
    });
    return correctWords.length / gameTime * 60000;
}

function gameOver() {
    clearInterval(window.timer);
    const gameElement = document.getElementById('game');
    const cursor = document.getElementById('cursor');
    addClass(gameElement, 'over');
    cursor.style.display = 'block';
    const result = getWpm();
    document.getElementById('info').innerHTML = `WPM: ${result}`;
}

document.getElementById('game').addEventListener('keyup', ev => {
    const key = ev.key;
    const currentWord = document.querySelector('.word.current');
    let currentLetter = document.querySelector('.letter.current');
    const expectedLetter = currentLetter?.innerHTML || ' ';
    const isLetter = key.length === 1 && key !== ' ';
    const isSpace = key === ' ';
    const isBackspace = key === 'Backspace';

    // Do nothing if the game is over.
    if (document.querySelector('#game.over')) {
        return;
    }

    console.log({ key, expectedLetter });

    // Start the timer on the first valid letter
    if (!timerRunning && isLetter) {
        startTimer();
    }

    // Make the cursor visible after the first keypress.
    const cursor = document.getElementById('cursor');
    cursor.style.display = 'block';

    // Handle letter input
    if (isLetter) {
        if (currentLetter) {
            addClass(currentLetter, key === expectedLetter ? 'correct' : 'incorrect');
            removeClass(currentLetter, 'current');
            if (currentLetter.nextSibling) {
                addClass(currentLetter.nextSibling, 'current');
            }
        } else {
            // No valid letter remains: append an extra letter
            const incorrectLetter = document.createElement('span');
            incorrectLetter.innerHTML = key;
            incorrectLetter.className = 'letter incorrect extra';
            currentWord.appendChild(incorrectLetter);
        }
    }

    // Handle Space key
    if (isSpace) {
        if (expectedLetter !== ' ') {
            const lettersToInvalidate = [...document.querySelectorAll('.word.current .letter:not(.correct)')];
            lettersToInvalidate.forEach(letter => {
                addClass(letter, 'incorrect');
            });
        }
        removeClass(currentWord, 'current');
        addClass(currentWord.nextSibling, 'current');
        if (currentLetter) {
            removeClass(currentLetter, 'current');
        }
        addClass(currentWord.nextSibling.firstChild, 'current');
    }

    // Handle Backspace
    if (isBackspace) {
        // If no current letter exists, it may be because extra letters were appended.
        if (!currentLetter) {
            let lastLetter = currentWord.lastChild;
            if (lastLetter && lastLetter.className.includes('extra')) {
                lastLetter.remove();
                updateCursor();
                return;
            }
        }
        // If the current letter is an extra letter, remove it.
        if (currentLetter && currentLetter.className.includes('extra')) {
            let prev = currentLetter.previousSibling;
            currentLetter.remove();
            if (prev) {
                addClass(prev, 'current');
                removeClass(prev, 'incorrect');
                removeClass(prev, 'correct');
            }
            updateCursor();
            return;
        }
        // Normal Backspace behavior
        if (currentLetter) {
            if (currentLetter.previousSibling) {
                removeClass(currentLetter, 'current');
                addClass(currentLetter.previousSibling, 'current');
                removeClass(currentLetter.previousSibling, 'incorrect');
                removeClass(currentLetter.previousSibling, 'correct');
            }
        }
    }

    // Always update the cursor at the end
    updateCursor();

    // Move words up when they exceed the top of the container
    if (currentWord.getBoundingClientRect().top > 250) {
        const words = document.getElementById('words');
        const margin = parseInt(words.style.marginTop || '0px');
        words.style.marginTop = (margin - 35) + 'px';
    }

    // Move cursor
    const nextLetter = document.querySelector('.letter.current');
    const nextWord = document.querySelector('.word.current');
    cursor.style.top = (nextLetter || nextWord).getBoundingClientRect().top + 2 + 'px';
    cursor.style.left = (nextLetter || nextWord).getBoundingClientRect()[nextLetter ? 'left' : 'right'] + 'px';
});

document.getElementById('newGameBtn').addEventListener('click', () => {
    // Start a new game and focus the game area.
    newGame(true);
});

// Initialize the game without focusing on page load.
newGame(false);
