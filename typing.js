const gameTime = 30 * 1000;
window.time = null;

let startTime = 0;
let timeElapsed = 0;
let timerRunning = false;
let words = []; // Will be populated by API
let correctChars = 0;
let incorrectChars = 0;

function addClass(el, name) {
    el.className += ' ' + name;
}

function removeClass(el, name) {
    el.className = el.className.replace(name, '');
}

async function fetchWords(count = 200) {
    try {
        const response = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch words');
        }
        
        words = await response.json();
        
        words = words.filter(word => word.length <= 10 && /^[a-z]+$/.test(word));
        
        if (words.length < count) {
            const backupWords = 'apple bicycle cloud dog elephant frog guitar hammock igloo jelly kettle lemon mountain notebook orange pencil queen rabbit sandwich table umbrella volcano window xylophone yellow zebra'.split(' ');
            words = words.concat(backupWords).slice(0, count);
        }
        
        return words;
    } catch (error) {
        console.error('Error fetching words:', error);
        
        return 'apple bicycle cloud dog elephant frog guitar hammock igloo jelly kettle lemon mountain notebook orange pencil queen rabbit sandwich table umbrella volcano window xylophone yellow zebra'.split(' ');
    }
}

function randomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

function formatWord(word) {
    return `<div class="word"><span class="letter">${word.split('').join('</span><span class="letter">')}</span></div>`;
}

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
    startTime = Date.now();
    timerRunning = true;
    correctChars = 0;
    incorrectChars = 0;
    updateTimer();
}

function updateTimer() {
    if (!timerRunning) return;

    const currentTime = Date.now();
    const msPassed = currentTime - startTime + timeElapsed;
    const sPassed = Math.round(msPassed / 1000);
    const sLeft = Math.max(0, Math.round((gameTime / 1000) - sPassed));

    document.getElementById('info').innerHTML = sLeft;

    if (sLeft <= 0) {
        gameOver();
        return;
    }

    requestAnimationFrame(updateTimer);
}

async function newGame(shouldFocus = false) {
    const gameElement = document.getElementById('game');
    const wordsContainer = document.getElementById('words');
    const cursor = document.getElementById('cursor');

    gameElement.classList.remove('over');

    window.timer = null;
    window.gameStart = null;

    wordsContainer.style.marginTop = '0px';
    cursor.style.display = 'none';

    await fetchWords(200);

    wordsContainer.innerHTML = '';
    for (let i = 0; i < 200; i++) {
        wordsContainer.innerHTML += formatWord(randomWord());
    }

    addClass(document.querySelector('.word'), 'current');
    addClass(document.querySelector('.letter'), 'current');

    document.getElementById('info').innerHTML = (gameTime / 1000) + '';

    // Reset character tracking
    correctChars = 0;
    incorrectChars = 0;

    if (shouldFocus) {
        gameElement.focus();
    }
}

function getWpm() {
    // Calculate raw WPM
    const elapsedMinutes = gameTime / 60000;
    
    // Calculate gross WPM (all typed characters)
    const totalChars = correctChars + incorrectChars;
    const grossWpm = Math.round((totalChars / 5) / elapsedMinutes);
    
    // Calculate accuracy percentage
    const accuracy = totalChars > 0 
        ? Math.round((correctChars / totalChars) * 100) 
        : 0;
    
    // Net WPM: Adjusted for errors (similar to MonkeyType calculation)
    const netWpm = Math.round(grossWpm * (accuracy / 100));
    
    return {
        grossWpm,
        netWpm,
        accuracy
    };
}

function gameOver() {
    clearInterval(window.timer);
    const gameElement = document.getElementById('game');
    const cursor = document.getElementById('cursor');
    addClass(gameElement, 'over');
    cursor.style.display = 'block';
    
    const { grossWpm, netWpm, accuracy } = getWpm();
    
    // Display detailed results
    document.getElementById('info').innerHTML = 
        `Gross WPM: ${grossWpm} | Net WPM: ${netWpm} | Accuracy: ${accuracy}%`;
}

document.getElementById('game').addEventListener('keyup', ev => {
    const key = ev.key;
    const currentWord = document.querySelector('.word.current');
    let currentLetter = document.querySelector('.letter.current');
    const expectedLetter = currentLetter?.innerHTML || ' ';
    const isLetter = key.length === 1 && key !== ' ';
    const isSpace = key === ' ';
    const isBackspace = key === 'Backspace';

    if (document.querySelector('#game.over')) {
        return;
    }

    if (!timerRunning && isLetter) {
        startTimer();
    }

    const cursor = document.getElementById('cursor');
    cursor.style.display = 'block';

    if (isLetter) {
        if (currentLetter) {
            const isCorrect = key === expectedLetter;
            
            // Track character accuracy
            if (isCorrect) {
                correctChars++;
            } else {
                incorrectChars++;
            }
            
            addClass(currentLetter, isCorrect ? 'correct' : 'incorrect');
            removeClass(currentLetter, 'current');
            if (currentLetter.nextSibling) {
                addClass(currentLetter.nextSibling, 'current');
            }
        } else {
            // Extra letters count as incorrect
            const incorrectLetter = document.createElement('span');
            incorrectLetter.innerHTML = key;
            incorrectLetter.className = 'letter incorrect extra';
            currentWord.appendChild(incorrectLetter);
            incorrectChars++;
        }
    }

    if (isSpace) {
        if (expectedLetter !== ' ') {
            const lettersToInvalidate = [...document.querySelectorAll('.word.current .letter:not(.correct)')];
            lettersToInvalidate.forEach(letter => {
                addClass(letter, 'incorrect');
                incorrectChars++;
            });
        }
        removeClass(currentWord, 'current');
        addClass(currentWord.nextSibling, 'current');
        if (currentLetter) {
            removeClass(currentLetter, 'current');
        }
        addClass(currentWord.nextSibling.firstChild, 'current');
    }

    if (isBackspace) {
        // Handle backspace logic while tracking characters
        if (!currentLetter) {
            let lastLetter = currentWord.lastChild;
            if (lastLetter && lastLetter.className.includes('extra')) {
                lastLetter.remove();
                updateCursor();
                incorrectChars--;
                return;
            }
        }
        
        if (currentLetter && currentLetter.className.includes('extra')) {
            let prev = currentLetter.previousSibling;
            currentLetter.remove();
            if (prev) {
                addClass(prev, 'current');
                removeClass(prev, 'incorrect');
                removeClass(prev, 'correct');
            }
            incorrectChars--;
            updateCursor();
            return;
        }
        
        if (currentLetter) {
            if (currentLetter.previousSibling) {
                // Revert character tracking when backspacing
                if (currentLetter.className.includes('correct')) {
                    correctChars--;
                } else if (currentLetter.className.includes('incorrect')) {
                    incorrectChars--;
                }
                
                removeClass(currentLetter, 'current');
                addClass(currentLetter.previousSibling, 'current');
                removeClass(currentLetter.previousSibling, 'incorrect');
                removeClass(currentLetter.previousSibling, 'correct');
            }
        }
    }

    updateCursor();

    if (currentWord.getBoundingClientRect().top > 250) {
        const words = document.getElementById('words');
        const margin = parseInt(words.style.marginTop || '0px');
        words.style.marginTop = (margin - 35) + 'px';
    }

    const nextLetter = document.querySelector('.letter.current');
    const nextWord = document.querySelector('.word.current');
    cursor.style.top = (nextLetter || nextWord).getBoundingClientRect().top + 2 + 'px';
    cursor.style.left = (nextLetter || nextWord).getBoundingClientRect()[nextLetter ? 'left' : 'right'] + 'px';
});

document.getElementById('newGameBtn').addEventListener('click', () => {
    newGame(true);
});

// Initialize the game with API words
newGame(false);