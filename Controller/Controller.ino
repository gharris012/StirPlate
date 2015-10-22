// include the library code:
#include <LiquidCrystal.h>
#include "Controller.h"

// 13 (PA4) - Blue
// 18 (PE0) - Yellow
// 17 (PF0) - Red
// 12 (PA3) - Green

const byte BUTTON_COUNT = 4;
const byte buttonDebounceDelay = 10;

Button buttons[BUTTON_COUNT] = {
  { "Blue", 13, false, 0, HIGH, HIGH, 0 },
  { "Yellow", 18, false, 0, HIGH, HIGH, 0 },
  { "Red", 17, false, 0, HIGH, HIGH, 0 },
  { "Green", 12, false, 0, HIGH, HIGH, 0 }
};
const byte BLUE = 0;
const byte YELLOW = 1;
const byte RED = 2;
const byte GREEN = 3;

const byte MOTOR_COUNT = 2;
// name, motorPin, hallpin, rpm, targetRpm, maxRpm, volume, pwmVolume, lastRpmTime
Motor motors[MOTOR_COUNT] = {
  { "A", 7, 31, 0, 0, 9000, 0, 0, 0 },
  { "B", 4, 8, 0, 0, 9000, 0, 0, 0 }
};
byte currentMotorIndex = 0;
Motor *currentMotor = &motors[currentMotorIndex];

// keep these outside the struct - need one for each motor/hall sensor
volatile unsigned long half_revolutions_0 = 0;
volatile unsigned long half_revolutions_1 = 0;
byte rpmMultiplier = 30;
word volumeIncrement = 2;

// rotary encoder
volatile static boolean rotaryRotating = false;
volatile byte rotaryPosition = 0;
volatile long rotaryLastDebounceTime = 0;
volatile long rotaryDebounceDelay = 1;
volatile boolean rotaryA_set = false;              
volatile boolean rotaryB_set = false;
byte rotaryOldPosition;

const byte pinRotaryA = 11; // PA2
const byte pinRotaryB = 19; // PB2

const byte pinRS = 23; // PD0
const byte pinEN = 2;  // PB5
const byte pinD7 = 28; // PE2
const byte pinD6 = 25; // PD2
const byte pinD5 = 29; // PE3
const byte pinD4 = 24; // PD1

char lcdBuffer[]="                 ";

// initialize the library with the interface pins
LiquidCrystal lcd(pinRS, pinEN, pinD4, pinD5, pinD6, pinD7);

void setup()
{
  byte i;
  
  // put your setup code here, to run once:
  Serial.begin(9600);
  Serial.println("StirPlate Controller v.0010");
  
  lcd.begin(16, 2);
  lcd.setCursor(0,0);
  
  for ( i = 0 ; i < BUTTON_COUNT ; i ++ )
  {
    pinMode(buttons[i].pin, INPUT_PULLUP);
  }
  for ( i = 0 ; i < MOTOR_COUNT ; i ++ )
  {
    pinMode(motors[i].hallPin, INPUT_PULLUP);
    pinMode(motors[i].motorPin, OUTPUT);
  }
  attachInterrupt(motors[0].hallPin, pinHall_0_Falling, FALLING);
  attachInterrupt(motors[1].hallPin, pinHall_1_Falling, FALLING);
  
  pinMode(pinRotaryA, INPUT_PULLUP);
  pinMode(pinRotaryB, INPUT_PULLUP);
  attachInterrupt(pinRotaryA, pinRotaryA_Change, CHANGE);
  attachInterrupt(pinRotaryB, pinRotaryB_Change, CHANGE);
  rotaryOldPosition = rotaryPosition;
}

void loop()
{
  checkButtons();

  rotaryRotating = true;
  byte rotaryNewPosition = rotaryPosition;
  byte posDiff = ( rotaryNewPosition - rotaryOldPosition );
  
  if (posDiff != 0)
  {
    if ( posDiff < 10 )
    {
      if ( currentMotor->volume < 100 )
      {
        currentMotor->volume += volumeIncrement;
      }
    }
    else if ( posDiff > 250 )
    {
      if ( currentMotor->volume > 0 )
      {
        currentMotor->volume -= volumeIncrement;
      }
    }
    
    currentMotor->volume = (byte) constrain(currentMotor->volume, 0, 100);
    currentMotor->pwmVolume = (byte) map(currentMotor->volume, 0, 100, 0, 255);
    currentMotor->targetRpm = (word) map(currentMotor->volume, 0, 100, 0, currentMotor->maxRpm);
    analogWrite(currentMotor->motorPin, currentMotor->pwmVolume);
    
    rotaryOldPosition = rotaryNewPosition;
    
    lcd.setCursor(0,0);
    sprintf(lcdBuffer, "%1s %3d%% %4d/%4d", currentMotor->name, currentMotor->volume, currentMotor->targetRpm, currentMotor->maxRpm);
    sprintf(lcdBuffer, "%16s", lcdBuffer);
    lcd.print(lcdBuffer);
  }
}

void checkButtons()
{
  byte i;
  byte buttonState;

  // check the buttons
  for ( i = 0 ; i < BUTTON_COUNT ; i ++ )
  {
    buttonState = digitalRead(buttons[i].pin);
    if ( buttonState != buttons[i].lastState )
    {
      if ( millis() < buttons[i].debounceTime )
      {
        buttons[i].debounceTime = millis();
      }
      if ( buttonState == buttons[i].debounceState )
      {
        if ( millis() - buttons[i].debounceTime > buttonDebounceDelay )
        {
          if ( buttons[i].lastState == LOW )
          {
            button_onPress(&buttons[i]);
          }
          buttons[i].lastState = buttonState;
        }
      }
      else
      {
        buttons[i].debounceState = buttonState;
        buttons[i].debounceTime = millis();
      }
    }
  }
}

void button_onPress(Button* button)
{
  button->count++;
  Serial.println("button pressed");
  if ( strcmp(button->name, "Blue") == 0 )
  {
    Serial.println("Blue button pressed");
    currentMotorIndex++;
    if ( currentMotorIndex >= MOTOR_COUNT )
    {
      currentMotorIndex = 0;
    }
    currentMotor = &motors[currentMotorIndex];
  }
}

// Interrupt on RotaryA changing state
void pinRotaryA_Change(){
  // debounce
  if ( rotaryRotating ) delay (rotaryDebounceDelay);  // wait a little until the bouncing is done

  // Test transition, did things really change? 
  if( digitalRead(pinRotaryA) != rotaryA_set ) {  // debounce once more
    rotaryA_set = !rotaryA_set;

    // adjust counter + if A leads B
    if ( rotaryA_set && !rotaryB_set ) 
      rotaryPosition += 1;

    rotaryRotating = false;  // no more debouncing until loop() hits again
  }
}
// Interrupt on RotaryB changing state, same as A above
void pinRotaryB_Change(){
  if ( rotaryRotating ) delay (rotaryDebounceDelay);
  if( digitalRead(pinRotaryB) != rotaryB_set ) {
    rotaryB_set = !rotaryB_set;
    //  adjust counter - 1 if B leads A
    if( rotaryB_set && !rotaryA_set ) 
      rotaryPosition -= 1;

    rotaryRotating = false;
  }
}

void pinHall_0_Falling()
{
  half_revolutions_0++;
}

void pinHall_1_Falling()
{
  half_revolutions_1++;
}
