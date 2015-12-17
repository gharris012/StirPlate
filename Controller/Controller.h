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
  double maxVolume;
  unsigned long lastRpmTime;
  char settingMode[10];
  char settingRpm[10];
  char settingRun[10];
} Motor;

typedef struct Setting
{
  char name[10];
  byte value;
  byte eeValue;
  byte eeAddress;
} Setting;

#endif 
