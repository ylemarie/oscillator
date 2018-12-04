/**
* ABElectronics Servo Pi demo
* Version 2.0 Created 04/09/2018
*
* Requires rpio to be installed, install with: npm install rpio
* run with: sudo node servomove.js
* ================================================

* This demo shows how to move a servo between 3 different positions.
* The low limit is set with a value of 1ms
* The high limit is set with a value of 2ms
* Both of these values can be adjusted to match the limits on the servo being tested.
*/

// link to the servopi library
var servo = require('../../lib/servopi/servopi');

// create a servo object on I2C channel 0x40 with a lower limit of 1ms, 
// a high limit of 2ms and reset the Servo Pi to its default state
servo = new Servo(0x40, 1.0, 2.0, true);

// Set PWM frequency to 50Hz (20ms) and enable the output
servo.setFrequency(50);
servo.outputEnable();

// create a positions array and a counter variable
var positions = [1, 175, 250];
var count = 0;

// tansforme un angle -90/90 en postion 0-250
function angleToPostion(angle) {
	// positions de 1 a 250 (/!\ avec le 0)

	//postion			0	25	50	75	100	125	150	175	200	225	250
	//angle 0 a 180		0	18	36	54	72	90	108	126	144	162	180
	//angle -90 a 90	-90	-72	-54	-36	-18	0	18	36	54	72	90
	
	//angle 0 a 180   = (postion * 180/250)
	//postion = angle * 250/180
	
	//angle -90 a 90  = (postion * 180/250) - 90
	position = (angle + 90) * 250/180;
	if (DEBUG) { 
		console.log("angle:"+angle+" postion:"+postion);
	}
	return postion;
}

// create a timer object that runs every second
var myTimer = setInterval(clockTimer, 1000);

function clockTimer() {
    // move the servo channel 1 to the three positions
    servo.move(1, positions[count], 250);
    count++;
    if (count >= positions.length) {
        count = 0;
    }
}

