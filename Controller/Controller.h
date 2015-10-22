#ifndef controller_h
#define controller_h

typedef struct Button // keep track of sensors
{
  char name[10];
  byte pin;
  byte state;
  byte lastState;
  long lastDebounceTime;
  
} Button;

#endif 
