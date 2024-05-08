#define VRX_PIN A0
#define VRY_PIN A1
#define SW_PIN 2

const int greenPin = 10;

int joyX = 0, joyY = 0, sw = 0;

const int numReadings = 10;
int xReadings[numReadings];
int yReadings[numReadings];
int readIndex = 0;
float xTotal = 0, yTotal = 0;
float xAverage = 0, yAverage = 0;
float xStart, yStart;
bool start = false;
unsigned long lastTime = 0;
const int interval = 16; // 60 fps

void setup() {
  Serial.begin(57600);
  pinMode(SW_PIN, INPUT_PULLUP);
  pinMode(greenPin, OUTPUT);

  for(int i = 0; i < numReadings; i++) {
    xReadings[i] = 0;
    yReadings[i] = 0;
  }
}

const int debounceDelay = 35; // Set debounce delay in milliseconds

void loop() {
  int x = analogRead(VRX_PIN);
  int y = analogRead(VRY_PIN);
  int sw = digitalRead(SW_PIN);

  xTotal = xTotal - xReadings[readIndex];
  yTotal = yTotal - yReadings[readIndex];
  xReadings[readIndex] = x;
  yReadings[readIndex] = y;
  xTotal = xTotal + x;
  yTotal = yTotal + y;
  readIndex = readIndex + 1;

  xAverage = xTotal / numReadings;
  yAverage = yTotal / numReadings;

  if (readIndex >= numReadings) {
    readIndex = 0;
    if (!start) {
      xStart = xAverage;
      yStart = yAverage;
      start = true;
    }
  }

  if(start) {
    unsigned long now =  millis();
    if (now - lastTime > interval) {
      Serial.print((int) (xAverage - xStart));
      Serial.print(",");
      Serial.print((int) (yAverage - yStart));
      Serial.print(",");       
      Serial.println(!sw);

      // Toggle green LED based on joystick button state
      if (sw == 0) {
        digitalWrite(greenPin, HIGH); // Turn on green LED
      } else {
        digitalWrite(greenPin, LOW); // Turn off green LED
      }

      lastTime = now;
    }
    delay(10);
  } 
   // Add a debounce delay
  delay(debounceDelay);
}

