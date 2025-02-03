const words = 'apple bicycle cloud dog elephant frog guitar hammock igloo jelly kettle lemon mountain notebook orange pencil queen rabbit sandwich table umbrella volcano window xylophone yellow zebra'.split(' ');

function randomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

function formatWord(word) {
    return `<div class="word">${word.split('').map(letter => `<span class="letter">${letter}</span>`).join('')}</div>`;
}

function newGame() {
    document.getElementById('words').innerHTML = '';
    for(let i = 0; i < 200; i++) {
        document.getElementById('words').innerHTML += formatWord(randomWord());
    }
}

newGame();