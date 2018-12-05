var servo = require('./ABElectronics_NodeJS_Libraries/lib/servopi/servopi');

// create a servo object on I2C channel 0x40 with a lower limit of 1ms, 
// a high limit of 2ms and reset the Servo Pi to its default state
//servo = new Servo(0x40, 1.0, 2.0, true);
servo = new Servo(0x40, 0.55, 2.25, true);   //FUTABA S30003 & H-KING HK 152169

// Set PWM frequency to 50Hz (20ms) and enable the output
servo.setFrequency(50,0);
servo.outputEnable();

var SENS_HORAIRE = 1;
var SENS_INVERSE = 0;

var pas = 1;

var servoSens = [];
var servoCount = [];
var servoRalenti = [];
var servoStart = [];
var servoStop = [];

//init servos
servoSens[1] = SENS_HORAIRE;  
servoCount[1] = 0;
servoSens[2] = SENS_HORAIRE;
servoCount[2] = 0;

//param servos
servoRalenti[1] = 75;   //param 75=20sec
servoStart[1] = 100;      //param
servoStop[1] = 200;     //param

servoRalenti[2] = 125;  //param 125=32sec
servoStart[2] = 0;      //param
servoStop[2] = 250;     //param

//var myServo = setInterval(moveServo, ralenti);   // create a timer object that runs every second
var myServo1 = setInterval(function() { moveServo(1) }, servoRalenti[1]);   //moveServo(servo_num)
var myServo2 = setInterval(function() { moveServo(2) }, servoRalenti[2]);   //moveServo(servo_num)

//servo.move(1, 1, 250);
//pos=servo.getPosition(1,250);
//console.log("init pos="+pos);

function moveServo(n) {
    
    servo.move(n, servoCount[n], 250);  //250 = nbre de pas du servo

    if (servoSens[n] == SENS_HORAIRE) {
       servoCount[n] += pas;
    }
    if (servoSens[n] == SENS_INVERSE) {
       servoCount[n] -= pas;
    }
    if (servoCount[n] >= servoStop[n]) {
       console.log("servo"+n+" limite stop atteinte:"+servoStop[n]+" change de sens !");
       servoSens[n] = SENS_INVERSE;       //on inverse le sens
       servoCount[n] = servoStop[n];      //on fixe le max (au cas ou)
    }
    if (servoCount[n] <= servoStart[n]) {
       console.log("servo"+n+" limite start atteinte:"+servoStart[n]+" change de sens !");
       servoSens[n] = SENS_HORAIRE;       //on iverse le sens
       servoCount[n] = servoStart[n];     //on fixe le min (au cas ou)
    }

    //console.log("servo="+n+" sens="+servoSens[n]+" pas="+pas+" ralenti="+servoRalenti[n]+" pos="+servo.getPosition(n, 250));
}