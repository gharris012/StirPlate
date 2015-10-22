#include <energia.h>
#ifndef controller_h
#define controller_h

typedef struct Button
{
  char name[7];
  byte pin;
  boolean pressed;
  byte count;
  byte lastState;
  byte debounceState;
  unsigned long debounceTime;
  
} Button;

typedef struct Motor
{
  char name[2];
  byte motorPin;
  byte hallPin;
  word rpm;
  word targetRpm;
  word maxRpm;
  byte volume;
  byte pwmVolume;
  unsigned long lastRpmTime;
} Motor;

#endif 
