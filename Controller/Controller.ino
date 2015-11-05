#include <PID_v1.h>

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

const byte MOTOR_COUNT = 2;

const char motorMode_Manual = 'M';
const char motorMode_Hold = 'H';
// name, motorPin, hallpin, mode, run, changed, rpm, targetRpm, maxRpm, volume, pwmVolume, lastRpmTime
Motor motors[MOTOR_COUNT] = {
  { 'A', 7, 31, motorMode_Manual, false, true, 0, 0, 6000, 0, 0, 0 },
  { 'B', 4, 8, motorMode_Manual, false, true, 0, 0, 6000, 0, 0, 0 }
};
double PIDKp=0.002, PIDKi=0.01, PIDKd=0.01;
PID motorPID_0(&motors[0].rpm, &motors[0].pwmVolume, &motors[0].targetRpm, PIDKp, PIDKi, PIDKd, DIRECT);
PID motorPID_1(&motors[1].rpm, &motors[1].pwmVolume, &motors[1].targetRpm, PIDKp, PIDKi, PIDKd, DIRECT);

PID *motorPID[MOTOR_COUNT] = { &motorPID_0, &motorPID_1 };

byte currentMotorIndex = 0;
Motor *currentMotor = &motors[currentMotorIndex];

// keep revolutions count outside the struct - need one for each motor/hall sensor
volatile unsigned long motorRevolutions[MOTOR_COUNT];
// update rpms every Count increments or after Time millis
word rpmUpdateThresholdTime = 1000;
byte rpmUpdateThresholdCount = 20;
byte rpmMultiplier = 60;
word volumeIncrement = 2;
word rpmIncrement = 50;

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
  Serial.println("StirPlate Controller v.01");
  
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
    motorPID[i]->SetSampleTime(1000);
    motorPID[i]->SetOutputLimits(0,255);
    motorPID[i]->SetMode(AUTOMATIC);
  }
  // each motor pin needs a separate interrupt
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
      if ( currentMotor->mode == motorMode_Hold )
      {
        if ( currentMotor->targetRpm < currentMotor->maxRpm )
        {
          currentMotor->targetRpm += rpmIncrement;
        }
      }
      else if ( currentMotor->mode == motorMode_Manual )
      {
        if ( currentMotor->volume < 100 )
        {
          currentMotor->volume += volumeIncrement;
        }
      }
    }
    else if ( posDiff > 250 )
    {
      if ( currentMotor->mode == motorMode_Hold )
      {
        if ( currentMotor->targetRpm > 0 )
        {
          currentMotor->targetRpm -= rpmIncrement;
        }
      }
      else if ( currentMotor->mode == motorMode_Manual )
      {
        if ( currentMotor->volume > 0 )
        {
          currentMotor->volume -= volumeIncrement;
        }
      }
    }
    
    if ( currentMotor->mode == motorMode_Hold )
    {
      currentMotor->targetRpm = (word) constrain(currentMotor->targetRpm, 0, currentMotor->maxRpm);
    }
    else if ( currentMotor->mode == motorMode_Manual )
    {
      currentMotor->volume = (byte) constrain(currentMotor->volume, 0, 100);
    }
    
    currentMotor->changed = true;
    
    rotaryOldPosition = rotaryNewPosition;
  }
  char state;
  char mode;
  word maxRpm;
  byte i;
  for ( i = 0 ; i < MOTOR_COUNT ; i ++ )
  {
    // figure out current rpm
    // reset timer if millis overflows
    if ( motors[i].lastRpmTime > millis() )
    {
      motors[i].lastRpmTime = millis();
    }
    if ( motorRevolutions[i] > rpmUpdateThresholdCount || ( millis() - motors[i].lastRpmTime ) > rpmUpdateThresholdTime )
    {
      detachInterrupt(motors[i].hallPin);
      double rpm = ( rpmMultiplier* 1000 ) / ( millis() - motors[i].lastRpmTime ) * motorRevolutions[i];
      motorRevolutions[i] = 0;
      motors[i].lastRpmTime = millis();
      // NOTE: need clause for each motor!
      if ( i == 0 )
      {
        attachInterrupt(motors[i].hallPin, pinHall_0_Falling, FALLING);
      }
      else if ( i == 1 )
      {
        attachInterrupt(motors[i].hallPin, pinHall_1_Falling, FALLING);
      }
      if ( motors[i].rpm != rpm )
      {
        // smooth out the fluctuations a little
        motors[i].changed = true;
        motors[i].rpm = ( rpm + motors[i].rpm ) / 2;
      }
    }
    
    if ( motors[i].changed )
    {
      if ( motors[i].run )
      {
        if ( motors[i].mode == motorMode_Manual )
        {
          motors[i].pwmVolume = (byte) map(motors[i].volume, 0, 100, 0, 255);
        }
        else
        {
          // math out pwmVolume based on current rpm and targetRpm
          //   and update volume based on pwmVolume
          // for now just use rotary volume
          motorPID[i]->Compute();
          motors[i].volume = (byte) map(motors[i].pwmVolume, 0, 255, 0, 100);
        }
        analogWrite(motors[i].motorPin, motors[i].pwmVolume);
      }
      else
      {
        analogWrite(motors[i].motorPin, 0);
      }
      if ( currentMotorIndex == i )
      {
        state = '*';
      }
      else
      {
        state = ' ';
      }
      if ( motors[i].run )
      {
        mode = motors[i].mode;
      }
      else
      {
        mode = tolower(motors[i].mode);
      }
      if ( motors[i].mode == motorMode_Manual )
      {
        maxRpm = motors[i].maxRpm;
      }
      else if ( motors[i].mode == motorMode_Hold )
      {
        maxRpm = motors[i].targetRpm;
      }
      lcd.setCursor(0,i);
      Serial.println(state);
      sprintf(lcdBuffer, "%c%c%3d %4.0f/%4d%c", motors[i].name, state, motors[i].volume, motors[i].rpm, maxRpm, mode);
      sprintf(lcdBuffer, "%16s", lcdBuffer);
      lcd.print(lcdBuffer);
      
      motors[i].changed = false;
    }
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
  if ( strcmp(button->name, "Blue") == 0 )
  {
    Serial.println("Blue button pressed");
    currentMotor->changed = true;
    currentMotorIndex++;
    if ( currentMotorIndex >= MOTOR_COUNT )
    {
      currentMotorIndex = 0;
    }
    currentMotor = &motors[currentMotorIndex];
    currentMotor->changed = true;
    Serial.println(currentMotorIndex);
  }
  else if ( strcmp(button->name, "Red") == 0 )
  {
    Serial.println("Red button pressed");
    // if we are already stopped, clear the volume
    if ( currentMotor->run == false )
    {
      currentMotor->volume = 0;
      currentMotor->targetRpm = 0;
    }
    currentMotor->run = false;
    currentMotor->changed = true;
  }
  else if ( strcmp(button->name, "Green") == 0 )
  {
    Serial.println("Green button pressed");
    currentMotor->run = true;
    currentMotor->changed = true;
  }
  else if ( strcmp(button->name, "Yellow") == 0 )
  {
    Serial.println("Yellow button pressed");
    // rotate through the modes: Manual,Hold
    if ( currentMotor->mode == motorMode_Manual && currentMotor->run )
    {
      currentMotor->mode = motorMode_Hold;
      currentMotor->targetRpm = ( currentMotor->rpm / 50 ) * 50;
    }
    else
    {
      currentMotor->mode = motorMode_Manual;
      currentMotor->targetRpm = 0;
    }
    currentMotor->changed = true;
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
  motorRevolutions[0]++;
}

void pinHall_1_Falling()
{
  motorRevolutions[1]++;
}
