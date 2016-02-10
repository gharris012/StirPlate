/*
 * ATtiny85v 8Mhz @ 3.3v
 *                   +---U---+
 *             Reset | 1   8 | Vcc
 *       NC // (PB3) | 2   7 | MOTOR_START (PB2)
 *      POT (PB4/A2) | 3   6 | MOTOR_PWM   (PB1)
 *               GND | 4   5 | LED_SPEED   (PB0)
 *                   +-------+
 */

 
const byte MOTOR_PWM = 1;
const byte MOTOR_START = 2;
const byte POT = A2;
const byte LED_SPEED = 0;

// convert max % to max pwm
const byte MIN_PWM = 20;
const byte MAX_PWM = 170;

const byte SAMPLE_COUNT = 10;

void setup()
{
  pinMode(MOTOR_PWM, OUTPUT);
  pinMode(MOTOR_START, OUTPUT);
  pinMode(POT, INPUT);
  pinMode(LED_SPEED, OUTPUT);

  digitalWrite(LED_SPEED, LOW);
  digitalWrite(MOTOR_PWM, LOW);
  digitalWrite(MOTOR_START, LOW);
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
  // convert to a pwm value
  out = map(in, 0, 1023, MIN_PWM - 5, MAX_PWM);

  // reverse out -- pot hooked up backwards
  //out = ( 255 - out );

  // turn on/off motor if above/below min volume %
  if ( out <= MIN_PWM )
  {
    digitalWrite(MOTOR_START, LOW);
  }
  else
  {
    digitalWrite(MOTOR_START, HIGH);
    analogWrite(MOTOR_PWM, out);
  }
  analogWrite(LED_SPEED, out - MIN_PWM);
}
