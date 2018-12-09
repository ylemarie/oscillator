var servo = require('./ABElectronics_NodeJS_Libraries/lib/servopi/servopi');

// create a servo object on I2C channel 0x40 with a lower limit of 1ms, 
// a high limit of 2ms and reset the Servo Pi to its default state
//servo = new Servo(0x40, 1.0, 2.0, true);
servo = new Servo(0x40, 0.55, 2.25, true);   //FUTABA S30003 & H-KING HK 152169

// Set PWM frequency to 50Hz (20ms) and enable the output
servo.setFrequency(50,0);
servo.outputEnable();

var count = 0;
var sens = 1;
var pas = 1;
var ralenti = 75;
var myTimer = setInterval(clockTimer, ralenti);   // create a timer object that runs every second

servo.move(1, 1, 250);
pos=servo.getPosition(1,250);
console.log("init pos="+pos);

function clockTimer() {
    servo.move(1,count,250);
    if (sens == 1) {
       count += pas;
    }
    if (sens == 0) {
       count -= pas;
    }
    if (count >= 250) {
       sens = 0;
       count = 250;
    }
    if (count <= 0) {
       sens = 1;
       count = 0;
    }
    pos=servo.getPosition(1,250);
    console.log("sens="+sens+" pas="+pas+" ralenti="+ralenti+" pos="+pos);
}
