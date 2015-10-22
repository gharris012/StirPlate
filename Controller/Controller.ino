// include the library code:
#include <LiquidCrystal.h>
#include "Controller.h"

// 13 (PA4) - Blue
// 18 (PE0) - Yellow
// 17 (PF0) - Red
// 12 (PA3) - Green

byte buttonBlue = 13;
byte buttonYellow = 18;
byte buttonRed = 17;
byte buttonGreen = 12;

byte buttonBlueState = HIGH;
byte buttonYellowState = HIGH;
byte buttonRedState = HIGH;
byte buttonGreenState = HIGH;

// rotary encoder
volatile static boolean rotating = false;
volatile unsigned int encoderpos = 0;
volatile long lastDebounceTime = 0;
volatile long debounceDelay = 1;
volatile boolean A_set = false;              
volatile boolean B_set = false;
long oldPosition;
int volumeInc = 100;
int volume = 0;

const byte pinRotaryA = 11; // PA2
const byte pinRotaryB = 19; // PB2


// Hall B - PA5 - 8
// Hall A - PF4 - 31
// motors
const byte pinMotorA = 9;  // PA6
const byte pinHallA = 31;  // PA5
volatile unsigned long half_revolutionsA = 0;
int rpmA = 0;
int rpmMultA = 30;


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
  Serial.println("StirPlate Controller v.0006");
  
  lcd.begin(16, 2);
  lcd.setCursor(0,0);
  
  pinMode(buttonBlue, INPUT_PULLUP);
  pinMode(buttonYellow, INPUT_PULLUP);
  pinMode(buttonRed, INPUT_PULLUP);
  pinMode(buttonGreen, INPUT_PULLUP);
  
  pinMode(pinRotaryA, INPUT_PULLUP);
  pinMode(pinRotaryB, INPUT_PULLUP);
  attachInterrupt(pinRotaryA, pinRotaryA_Change, CHANGE);
  attachInterrupt(pinRotaryB, pinRotaryB_Change, CHANGE);
  oldPosition = encoderpos;
  volume = 500;

  pinMode(pinHallA, INPUT_PULLUP);
}

void loop()
{
  // set the cursor to column 0, line 1
  // (note: line 1 is the second row, since counting begins with 0):
  lcd.setCursor(0, 1);
  // print the number of seconds since reset:
  lcd.print(millis()/1000);

  // check the buttons
  byte buttonState = digitalRead(buttonBlue);
  if ( buttonState != buttonBlueState )
  {
    Serial.println("Blue button pressed!");
    buttonBlueState = buttonState;
  }
  buttonState = digitalRead(buttonYellow);
  if ( buttonState != buttonYellowState )
  {
    Serial.println("Yellow button pressed!");
    buttonYellowState = buttonState;
  }
  buttonState = digitalRead(buttonRed);
  if ( buttonState != buttonRedState )
  {
    Serial.println("Red button pressed!");
    buttonRedState = buttonState;
  }
  buttonState = digitalRead(buttonGreen);
  if ( buttonState != buttonGreenState )
  {
    Serial.println("Green button pressed!");
    buttonGreenState = buttonState;
  }
  
  rotating = true;
  long newPosition = encoderpos;
  unsigned int posDiff = ( newPosition - oldPosition );
  
  if (posDiff != 0) {
    if ( posDiff == 1 )
    {
      if ( volume < 7000 )
      {
        volume += volumeInc;
      }
    }
    else if ( posDiff == 4294967295 )
    {
      if ( volume > 0 )
      {
        volume -= volumeInc;
      }
    }
    volume = constrain(volume, 0, 7000);
    
    oldPosition = newPosition;
    
    Serial.print("Position: ");
    Serial.print(newPosition);
    Serial.print(" ; Volume: ");
    Serial.println(volume);
  }
  
  lcd.setCursor(0, 0);
  buttonState = digitalRead(pinHallA);
  if ( buttonState == HIGH )
  {
    lcd.print("HIGH");
  }
  else
  {
    lcd.print("LOW ");
  }
  
}

// Interrupt on RotaryA changing state
void pinRotaryA_Change(){
  // debounce
  if ( rotating ) delay (debounceDelay);  // wait a little until the bouncing is done

  // Test transition, did things really change? 
  if( digitalRead(pinRotaryA) != A_set ) {  // debounce once more
    A_set = !A_set;

    // adjust counter + if A leads B
    if ( A_set && !B_set ) 
      encoderpos += 1;

    rotating = false;  // no more debouncing until loop() hits again
  }
}
// Interrupt on RotaryB changing state, same as A above
void pinRotaryB_Change(){
  if ( rotating ) delay (debounceDelay);
  if( digitalRead(pinRotaryB) != B_set ) {
    B_set = !B_set;
    //  adjust counter - 1 if B leads A
    if( B_set && !A_set ) 
      encoderpos -= 1;

    rotating = false;
  }
}
