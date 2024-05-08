// Global Variables and declarations
let backgroundImage;
let character;
let bananaImg, bananas;
let rockImg, rocks;
let score = 0;
let lives = 3;
let gameTime, gameState;
let time;
let backgroundMusic;
let gameOverFail;

let collectSound;
let farmsideSounds;
let synth;

let startSound = [
  {note: 'C4', duration: '8n' },
  {note: 'E4', duration: '8n' },
  {note: 'F4', duration: '8n' },
  {note: 'G4', duration: '8n' },
  {note: 'A4', duration: '8n' },
  {note: 'D5', duration: '8n' },
  {note: 'C5', duration: '8n' }
]
let endSound;
let rockHitSynth = new Tone.Synth().toDestination();

let port;
let joyX = 0, joyY = 0, sw = 0;
let connectButton;
let circleX, circleY;
let speed = 3;

let blinkStartTime = 0;
let isBlinking = false;
const blinkDuration = 500; // 0.5 seconds

// Preloads sounds some sounds used in game
function preload() {
  backgroundImage = loadImage('assets/PixelGrassBg.png');

  collectSound = new Tone.Player('assets/CollectSound.mp3').toDestination();
  farmsideSounds = new Tone.Player('assets/FarmsideSounds.mp3').toDestination();
  endSound = new Tone.Player('assets/EndGameSound.mp3').toDestination();
  
// Character animations derived from imported sprite sheet
  let animations = {
    stand: { row: 0, frames: 1},
    walkRight: { row: 0, frames: 6},
    walkUp: { row: 5, frames: 6},
    walkDown: { row: 5, col: 6, frames: 6}
  };

  character = new Sprite(100, 400, 80, 80);
  character.spriteSheet = 'assets/CharacterSpriteLimeGuy.png';
  character.rotationLock = true;
  character.friction = 0;
  character.anis.frameDelay = 5;
  character.addAnis(animations);
  
  character.changeAni('stand');
  character.debug = false;
  
  // Loads the handmade banana and rock sprite images into p5
  bananaImg = loadImage('assets/PixelBanana.png');
  rockImg = loadImage('assets/PixelRock.png');
}

// Creates a serial port that the Arduino connects to
//Allows joystick to connect to p5
// Initialization of game logic/objects
function setup() {
  createCanvas(1200, 800);
  port = createSerial();
  connectButton = createButton("Connect");
  connectButton.mousePressed(connect);

  
  synth = new Tone.MonoSynth().toDestination();
   

  bananas = new Group();
  rocks = new Group();
  score = 0;
  gameTime = 30;
  gameState = 'start';
  timerIsDone = false;

}

function draw() {
  background(backgroundImage);
  
  // Read joystick input
  // Joystick input handling
  let str = port.readUntil("\n");
  let values = str.split(",");
  if (values.length > 2) {
    joyX = values[0];
    joyY = values[1];
    sw = Number(values[2]);

    // Adjust character movement based on joystick input
    if (joyX > 0) {
      walkLeft();
    } else if (joyX < 0) {
      walkRight();
    } else if (joyY > 0) {
      walkUp();
    } else if (joyY < 0) {
      walkDown();
    } else {
      stop();
    }
  }

  // Game state handling
  if (gameState === 'start') {
    startScreen();
    if (keyIsPressed && keyCode === 32) {
      startTime = millis();
      gameState = 'play';
      farmsideSounds.start();
      playStartSound();

      for (let i = 0; i < 5; i++) {
        let banana = createSprite(random(bananaImg.width / 2, width - bananaImg.width / 2), random(50 + bananaImg.height / 2, height - bananaImg.height / 2));
        banana.addImage(bananaImg);
        banana.width = 40;
        banana.height = 58; 
        bananas.add(banana);
        character.overlapping(bananas, collect)
        banana.debug = false;
      } 

      generateRocks(5);
    }
  } else if (gameState === 'play') {
    playScreen();
    moveRocks();
    handleRockBananaCollision();
    if (lives <= 0 || timerIsDone) {
      gameState = 'end';
      farmsideSounds.stop();
      endSound.start();
    }
  } else if (gameState === 'end') {
    farmsideSounds.stop();
    endScreen();
  }
}

  // Connects the Arduino board to p5 with a baud rate of 57600
  function connect() {
    if (!port.opened()) {
      port.open('Arduino', 57600);
    } else {
      port.close();
    }
  }


  function playStartSound() {
    // Resets the Transport (helps with the timing of musical events)
    Tone.Transport.cancel();
  
    // Schedules each note with a slight delay
    startSound.forEach((note, index) => {
      // Calculates the time delay for each of the notes
      let delay = index * 0.4; 
  
      // Schedules the note to be triggered after the delay
      Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease(note.note, note.duration, time);
      }, delay);
    });
  
    // Starts the Transport
    Tone.Transport.start();
  }
  
  function collect(character, banana) {
    banana.remove(); // Remove the collected banana
    score++; // Increase the score
    collectSound.start();
    
    // Create a new banana sprite at a random position
    let newBanana = createSprite(random(bananaImg.width / 2, width - bananaImg.width / 2), random(50 + bananaImg.height / 2, height - bananaImg.height / 2));  newBanana.addImage(bananaImg); // Set the image for the new banana sprite
    newBanana.width = 40; // Set the width of the new banana sprite
    newBanana.height = 58; // Set the height of the new banana sprite
    newBanana.debug = false;
    
    // Add the new banana sprite to the bananas group
    bananas.add(newBanana);
  }
  
// Animation functions for the character sprite (stand, left, right, up and down)
function stop() {
  character.vel.x = 0;
  character.vel.y = 0;
  character.changeAni('stand');
}

function walkRight() {
  character.changeAni("walkRight");
  character.vel.x = 3;
  character.scale.x = 1;
  character.vel.y = 0;
}

function walkLeft() {
  character.changeAni('walkRight');
  character.vel.x = -3;
  character.scale.x = -1; // Flip sprite horizontally
  character.vel.y = 0;
}

function walkUp() {
  character.changeAni('walkUp');
  character.vel.x = 0;
  character.scale.x = 1;
  character.vel.y = -3;
}

function walkDown() {
  character.changeAni('walkDown');
  character.vel.x = 0;
  character.scale.x = 1;
  character.vel.y = 3;
}

// Start screen, displays directions and how to start the game
function startScreen() {
  bananas.removeAll();
  rocks.removeAll();
  fill(255, 255, 0); // Set fill color to yellow
  textSize(32);
  textAlign(CENTER, CENTER);
  text('Welcome to Banana Bash!', width / 2, 100);
  text('Help Farmer Joe collect as many bananas as possible for his secret recipe!', width / 2, 150);
  text('Be careful of the rocks, get hit 3 times and you lose!', width / 2, 200);
  text('Connect the joystick before starting using the connect button in the bottom left corner.', width / 2, 250);
  text('Once the joystick is connected push it down to celebrate!', width / 2, 300);
  text("You'll be able to do this during the game; an LED light should flash when you do!", width / 2, 350);
  textSize(64);
  text('Press SPACE to start', width / 2, (height / 2) + 50);

  //Check if space bar pressed to start game
  if (keyIsPressed && keyCode === 32) {
    gameState = 'play';
    startTime = millis();
  }
}

// Function to generate rocks
function generateRocks(numRocks) {
  for (let i = 0; i < numRocks; i++) {
    let safeDistance = 200; // Minimum distance between character and rock
    let x = random(0, width);
    let y = random(0, height);

    // Check if the generated position is too close to the character
    while (dist(x, y, character.position.x, character.position.y) < safeDistance) {
      x = random(0, width);
      y = random(0, height);
    }

    let rock = createSprite(x, y);
    rock.addImage(rockImg);
    rock.width = 64;
    rock.height = 64;
    rocks.add(rock);
    rock.debug = false;
  }
}


// Function to move rocks continuously
function moveRocks() {
  rocks.forEach(rock => {
    rock.position.y += 2; // Adjust the speed as needed

    // If the rock reaches the bottom of the canvas, move it back to the top with a random x-coordinate
    if (rock.position.y > height) {
      rock.position.y = 0;
      rock.position.x = random(0, width);
    }

    // Check for collision with character
    if (character.overlap(rock)) {
      // Decrement lives by 1
      lives--;
      if (lives > 0) {
        rockHitSynth.triggerAttackRelease("C2", "8n"); // Play low synth (indicates character was hit by a rock)
      }
      rock.position.y = 0; // Move the rock back to the top
      rock.position.x = random(0, width); // Move the rock to a random x-coordinate at the top
    }
  });
}


// Function to handle collisions between rocks and bananas
function handleRockBananaCollision() {
  rocks.forEach(rock => {
    // Check if the rock overlaps with any banana
    bananas.forEach(banana => {
      if (rock.overlap(banana)) {
      // Purposefully left blank, don't want anything to happen here
      }
    });
  });
}

// Displays the time remaining, bananas collected, and amount of lives
function playScreen() { 
  fill(255, 255, 0); // Set fill color to yellow 
  timer();
    push();
    textSize(25);
    text(`Time Remaining: ${gameTime}`, 150, 45);
    text(`Bananas Collected: ${score}`, 150, 75);
    text(`Lives Remaining: ${lives}`, 150, 105);
    pop();
}

function endScreen() {
  // Remove all sprites 
  character.remove();
  bananas.remove();
  rocks.remove();
  
  // Display end screen
  push();
  fill(255, 255, 0); // Set fill color to yellow
  textSize(32);
  textAlign(CENTER, CENTER);
  text('Game Over!', width / 2, height / 2 - 50);
  
  // Determine the appropriate message based on the number of bananas collected
  let message;
  if (lives > 0) {
    // Player has lives left
    if (score < 5) {
      message = "Farmer Joe won't have enough bananas to make his pudding :(";
    } else if (score >= 5 && score < 10) {
      message = "Farmer Joe will have enough bananas to eat the whole pudding himself.";
    } else if (score >= 10 && score < 15) {
      message = "Farmer Joe will be able to share his banana pudding with his family!";
    } else {
      message = "With the bananas collected, Farmer Joe decided to start a banana pudding business!";
    }
  } else {
    // Player lost all lives
    message = "Oh no! Farmer Joe was knocked out by the rocks and lost his memory.\n";
    message += "He will never be able to make his famous puddin' again . . .";
  }
  
  // Display the message
  text(message, width / 2, height / 2);
  pop();
}


//Function that updates the game timer
function timer() {
  gameTime = 30 - int((millis() - startTime) / 1000);
  if (gameTime <= 0) {
    timerIsDone = true;
    gameTime = 0;
  }
  return gameTime;
}  