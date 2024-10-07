const cards = ['😊', '🤑', '😍', '🥸', '🤐', '😒', '🤥', '🥴', '😱', '😴', '😭', '🥳', '😇', '🤧', '🤕',
    '😊', '🤑', '😍', '🥸', '🤐', '😒', '🤥', '🥴', '😱', '😴', '😭', '🥳', '😇', '🤧', '🤕'];
  let flippedCards = [];
  let matchedCards = [];
  let score = 0;
  let aiscore = 0;
  let initialDisplayTime = 3000; // 3 seconds for initial display
  let gameTime = 300; // 5 minutes in seconds
  let timerInterval;
  let aiMemory = {}; // AI memory for card positions
  let isplayerTurn= true;
  let ispause= false;
  
  const startbtn= document.getElementById('start');
  const stopbtn= document.getElementById('stop');
  const resumebtn= document.getElementById('resume');
  const restartbtn= document.getElementById('restart');
  const shufflebtn= document.getElementById('shuffle');
  
  startbtn.addEventListener('click',Start);
  stopbtn.addEventListener('click',Stop);
  resumebtn.addEventListener('click',Resume);
  restartbtn.addEventListener('click',Restart);
  shufflebtn.addEventListener('click',Shuffle);
  
  function createGameBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = ''; // Clear the board for reset or initial setup
    const shuffledCards = shuffle(cards);
    shuffledCards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.classList.add('card');
      cardElement.dataset.index = index;
      cardElement.dataset.value = card; // Store card value in dataset for AI to "see"
      const frontElement = document.createElement('div');
      frontElement.classList.add('front');
      frontElement.textContent = card;
      const backElement = document.createElement('div');
      backElement.classList.add('back');
      // Here you can add the background image or class for the card's back design
      // Set height of the back element
      cardElement.appendChild(frontElement);
      cardElement.appendChild(backElement);
      //cardElement.textContent = card;
      cardElement.addEventListener('click', flipCard);
      gameBoard.appendChild(cardElement);
    });
    // Display cards for initialDisplayTime milliseconds
    setTimeout(() => {
      const cardElements = document.querySelectorAll('.card');
      cardElements.forEach(card => {
        card.classList.add('flipped'); // Initially show the back
        //card.textContent = '';
        card.dataset.revealed = 'false'; // Mark cards as unrevealed
      });
      if(!ispause){
        startTimer();
      }
      //startTimer();
    }, initialDisplayTime);
  }
  
  function Start(){
    sounds.startgame.play();
    if(ispause){
      Resume();
    }else{
      clearInterval(timerInterval);
      gameTime = 300; // Reset the timer to 5 minutes
      score = 0; // Reset score
      aiscore = 0;
      matchedCards = [];
      flippedCards=[];
      aiMemory={};
      isplayerTurn= true;
      ispause= false;
      createGameBoard();
      //startTimer();
    }
  }
  
  function Stop(){
    sounds.clickgame.play();
    clearInterval(timerInterval);
    ispause= true;
  }
  
  function Resume(){
    sounds.clickgame.play();
    if(ispause){
      startTimer();
      ispause= false;
    }
  }
  
  function Restart(){
    sounds.clickgame.play();
    clearInterval(timerInterval);
    gameTime = 300; // Reset the timer to 5 minutes
      score = 0; // Reset score
      aiscore = 0;
      matchedCards = [];
      flippedCards=[];
      aiMemory={};
      isplayerTurn= true;
      ispause= false;
      createGameBoard();
      startTimer();
  }
  
    function Shuffle(){
      sounds.shufflegame.play();
      if(!ispause){
        shuffle(cards);
        createGameBoard();
      }
    }
  
  function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }
  
  function startTimer() {
    timerInterval = setInterval(() => {
      gameTime--;
      updateTimer();
      if (gameTime <= 0) {
        clearInterval(timerInterval);
        endGame('Time\'s up! Try again.');
      }
    }, 1000);
  }
  
  function updateTimer() {
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    document.getElementById('timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  
  function flipCard() {
    sounds.flip.play();
    if (ispause || !isplayerTurn || flippedCards.length >= 2 || gameTime <= 0) return; // Don't allow flipping more than 2 cards at once or if time's up
    const selectedCard = this;
    if (!flippedCards.includes(selectedCard) && selectedCard.dataset.revealed === 'false') {
      flippedCards.push(selectedCard);
      selectedCard.classList.toggle('flipped');
      //selectedCard.textContent = selectedCard.dataset.value;
      selectedCard.dataset.revealed = 'true';
      if (flippedCards.length === 2) {
        setTimeout(() => {
          checkMatch(true);
          if(gameTime>0 && !ispause){ // Pass true to indicate it's the user's turn
            isplayerTurn=false;
         setTimeout(aiTurn,1000);
          }
        },500);
      }
    }
  }
  
  function checkMatch(isUserTurn) {
    if (gameTime <= 0) return; // Prevent matching if time's up
    const [card1, card2] = flippedCards;
    if (card1.dataset.value === card2.dataset.value) {
      matchedCards.push(card1, card2);
      if (isUserTurn) {
        score += 10;
        sounds.win.play();
        displayMessage('Great match! 🎉', true);
      } else {
        aiscore += 10;
        sounds.lose.play();
        displayMessage('AI found a match! 🤖', false);
        updateAIMemory(card1, true); // AI memorizes matched cards
        updateAIMemory(card2, true);
      }
      if (matchedCards.length === cards.length) {
        clearInterval(timerInterval); // Stop the timer when the game is won
        endGame(isUserTurn ? 'Congratulations! You won!' : 'AI wins. Try again!');
      }
    } else {
      if (isUserTurn) {
        score -= 2;
        displayMessage('Oops, try again. 😢', true);
      } else {
        aiscore -= 2;
        displayMessage('AI made a mistake. 🤖', false);
      }
      // This delay ensures the user/AI has a moment to see the second card before they are flipped back
      setTimeout(() => {
        card1.classList.add('flipped'); // Use add here to ensure the flipped class is reapplied, showing the back
        card2.classList.add('flipped');
        card1.dataset.revealed = 'false';
        card2.dataset.revealed = 'false';
      }, 500); // You can adjust the delay as needed
      if (!isUserTurn) {
        updateAIMemory(card1, false); // Update AI memory with unsuccessful match
        updateAIMemory(card2, false);
      }
    }
    flippedCards = [];
    updateScore(isUserTurn);
    if(!isUserTurn){
      isplayerTurn=true;
    }
  }
  
  
  function updateScore(isUserTurn) {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('aiscore').textContent = `AI Score: ${aiscore}`;
  }
  
  function displayMessage(message, isUserTurn) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = isUserTurn ? `Player: ${message}` : `AI: ${message}`;
    // Clear the message after 3 seconds
    setTimeout(() => {
      messageElement.textContent = '';
    }, 3000);
  }
  
  function aiTurn() {
    if (!isplayerTurn && gameTime > 0) { // AI doesn't take turns if time's up
      let firstCard = aiRandomFlip(); // Flip the first card
      if (firstCard) {
        setTimeout(() => {
          // Check AI memory for a potential match
          const cardValue = firstCard.dataset.value;
          //This line checks if the aiMemory object has an entry for the current cardValue.
          if (aiMemory[cardValue] && aiMemory[cardValue].length > 0) {
            // AI has a match in memory, flip the second card
            const matchingCardIndex = aiMemory[cardValue][0]; 
            //The selector .card[data-index='${matchingCardIndex}'] searches for a card element with a specific data-index attribute that matches matchingCardIndex.
            //This allows the code to interact with the specific card element in the DOM.
            const matchingCard = document.querySelector(`.card[data-index='${matchingCardIndex}']`);
            
            // Check if the matching card is unrevealed
            if (matchingCard && matchingCard.dataset.revealed === 'false') {
              flipCardAI(matchingCard); // Flip the matching card
              setTimeout(() => checkMatch(false), 1000); // Check for match after a delay
            }
          } else {
            // No match in memory, flip a random second card
            let secondFlip = aiRandomFlip(firstCard);
            if (secondFlip) { // Ensure a second flip occurs
              setTimeout(() => checkMatch(false), 1000);
            }
          }
        }, 500); // Adjust the delay as needed
      }
    }
  }
  
  
  function aiRandomFlip(excludeIndex = null) {
    const unrevealedCards = Array.from(document.querySelectorAll('.card')).filter(card => card.dataset.revealed === 'false' && card !== excludeIndex);
    if (unrevealedCards.length > 0) {
      const randomCardIndex = Math.floor(Math.random() * unrevealedCards.length);
      flipCardAI(unrevealedCards[randomCardIndex]);
      return unrevealedCards[randomCardIndex];
    }
    return null;
  }
  
  function flipCardAI(card) {
    sounds.flip.play();
    flippedCards.push(card);
    card.classList.toggle('flipped');
    //card.textContent = card.dataset.value;
    card.dataset.revealed = 'true';
  }
  
  function updateAIMemory(card, wasMatch) {
    const cardValue = card.dataset.value;
    if (wasMatch) {
      // If the cards were matched, remove them from AI memory
      if (aiMemory[cardValue]) {
        aiMemory[cardValue] = aiMemory[cardValue].filter(index => index !== card.dataset.index);
      }
    } else {
      // Add or update AI's memory with the card's index
      if (!aiMemory[cardValue]) {
        aiMemory[cardValue] = [card.dataset.index];
      } else if (!aiMemory[cardValue].includes(card.dataset.index)) {
        aiMemory[cardValue].push(card.dataset.index);
      }
    }
  }
  
  function findPotentialMatches() {
    for (let value in aiMemory) {
      if (aiMemory[value].length > 1) {
        // AI found two cards of the same value
        return aiMemory[value].map(index => document.querySelector(`.card[data-index='${index}']`));
      }
    }
    return [];
  }
  
  function endGame(message) {
    if (message === 'Congratulations! You won!') {
      sounds.victory.play();
  } else {
      sounds.gameOver.play();
  }
    clearInterval(timerInterval);
    document.getElementById('end-message').textContent=message;
    const dialog= document.getElementById('endGame');
    dialog.style.display='block';
    document.getElementById('restartgame').onclick=function(){
      dialog.style.display='none';
      Restart();
    };
    document.getElementById('exitgame').onclick=function(){
      dialog.style.display='none';
      window.close();
    };
  }
  
  const sounds = {
    startgame: new Audio('start.mp3'),
    clickgame: new Audio('click.mp3'),
    flip: new Audio('flipcard.mp3'),
    win: new Audio('win.mp3'),
    lose: new Audio('lose.mp3'),
    gameOver: new Audio('game over.mp3'),
    victory: new Audio('victory.mp3'),
    shufflegame: new Audio('shuffle.wav')
  };