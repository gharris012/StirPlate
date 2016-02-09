#include <TinyWireS.h>

/*
 * ATtiny85v 8Mhz @ 3.3v
 *                   +---U---+
 *             Reset | 1   8 | Vcc
 *       NC // (PB3) | 2   7 | (PB2) // NC
 *      POT (PB4/A2) | 3   6 | MOTOR_PWM (PB1)
 *               GND | 4   5 | LED_SPEED (PB0)
 *                   +-------+
 */

 
const byte MOTOR_PWM = 1;
const byte POT = A2;
const byte LED_SPEED = 0;
const byte MAX_PWM = 80;

const byte SAMPLE_COUNT = 10;

void setup()
{
  pinMode(MOTOR_PWM, OUTPUT);
  pinMode(POT, INPUT);
  pinMode(LED_SPEED, OUTPUT);

  // use pullups on unused pins
  pinMode(3, INPUT);
  digitalWrite(3, HIGH);
  pinMode(2, INPUT);
  digitalWrite(2, HIGH);
 
  digitalWrite(LED_SPEED, LOW);
  digitalWrite(MOTOR_PWM, LOW);
}

void loop()
{
  int in = 0;
  byte out;

  for ( byte i = 0 ; i < SAMPLE_COUNT ; i ++ )
  {
    in += analogRead(POT);
  }
  in = in / SAMPLE_COUNT;
  out = map(in, 0, 1023, MAX_PWM, 0);

  analogWrite(MOTOR_PWM, out);
  analogWrite(LED_SPEED, map(out, 0, MAX_PWM, 0, 255));
}
