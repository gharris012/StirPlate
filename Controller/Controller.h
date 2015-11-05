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
  char name;
  byte motorPin;
  byte hallPin;
  char mode;
  boolean run;
  boolean changed;
  double rpm;
  double targetRpm;
  word maxRpm;
  byte volume;
  double pwmVolume;
  unsigned long lastRpmTime;
} Motor;

#endif 
