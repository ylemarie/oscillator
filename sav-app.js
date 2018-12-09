/*** INSTALL ***/
/*
	npm install jsonfile underscore express http socket.io dateformat onoff
*/

/*** PARAMETERS ***/

//read parameters from json file
var jsonfile = require('jsonfile');
var _ = require("underscore");
var file = 'parameters.json';
var parameters = jsonfile.readFileSync(file);
function getParam( pname) {
	return _.find( parameters, {name: pname} ).value;
}
function getParamIdx( pname ) {
	return _.findIndex( parameters, {name: pname} );
}
function setParam( pname, newValue ) {
	parameters[ getParamIdx( pname ) ].value = newValue;
}

//populate "const"
var NB_OSCILLOS	 = getParam('NB_OSCILLOS');	
var CHECK_PERIOD = getParam('CHECK_PERIOD');
var SERVER_PORT  = getParam('SERVER_PORT');
var DEBUG 		 = getParam('DEBUG');
var LOG 		 = getParam('LOG');
var OSCILLO      = getParam('OSCILLO');
var ADJUST_STEP  = getParam('ADJUST_STEP');
var SENS_HORAIRE = 1;
var SENS_INVERSE = 0;
var PAS = 1;
var ON  = 1;
var OFF = 0;

/*
var OSCILLO_RALENTI = [];
var OSCILLO_START = [];
var OSCILLO_STOP = [];
*/
var OSCILLO_STATE = [];
for (i=0; i<NB_OSCILLOS; i++) {
	num = i+1;
	/*
	OSCILLO_RALENTI[i] = getParam('OSCILLO'+num+'_RALENTI');
	OSCILLO_START[i]   = getParam('OSCILLO'+num+'_START');
	OSCILLO_STOP[i]    = getParam('OSCILLO'+num+'_STOP');
	*/
	OSCILLO_STATE[i]   = ON;
}

if (DEBUG) { 
	console.log("Nbr parameters: "+parameters.length); 
	//console.log("Parameter:"+parameters);
/*
	console.log("Ralenti: "+OSCILLO_RALENTI);
	console.log("Start: "+OSCILLO_START);
	console.log("Stop: "+OSCILLO_STOP);
	console.log("State: "+OSCILLO_STATE);
*/
	console.log("Oscillo: "+OSCILLO);
}

/*** SERVER & SOCKET ***/

//Server & socket
var express = require('express');
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);
server.listen(SERVER_PORT);				//start server
app.use(express.static('public'));		//static page
if (DEBUG) { console.log("Running web on port %s",SERVER_PORT); }

/*** DATE ***/
var dateFormat = require('dateformat');				//https://github.com/felixge/node-dateformat

/*********SERVO*****************/
var servo = require('./ABElectronics_NodeJS_Libraries/lib/servopi/servopi');
// create a servo object on I2C channel 0x40 with a lower limit of 1ms, 
// a high limit of 2ms and reset the Servo Pi to its default state
//servo = new Servo(0x40, 1.0, 2.0, true);
servo = new Servo(0x40, 0.55, 2.25, true);   //FUTABA S30003 & H-KING HK 152169

// Set PWM frequency to 50Hz (20ms) and enable the output
servo.setFrequency(50,0);
servo.outputEnable();

var servoSens = [];
var servoCount = [];

//init servos
for (i=0; i<NB_OSCILLOS; i++) {
	num = i+1;
	servoSens[num] = SENS_HORAIRE;  
	servoCount[num] = 0;
}

var myServo = [];
/* BUG on a que le n°4 ???
for (i=0; i<NB_OSCILLOS; i++) {
	num = i+1;
	myServo[i] = setInterval(function() { moveServo(num) }, OSCILLO_RALENTI[i]);
}
*/
/*
myServo[0] = setInterval(function() { moveServo(1) }, OSCILLO_RALENTI[0]);	//servo 1 = OSCILLO_RALENTI[0]
myServo[1] = setInterval(function() { moveServo(2) }, OSCILLO_RALENTI[1]);
myServo[2] = setInterval(function() { moveServo(3) }, OSCILLO_RALENTI[2]);
myServo[3] = setInterval(function() { moveServo(4) }, OSCILLO_RALENTI[3]);
*/
myServo[0] = setInterval(function() { moveServo(1) }, OSCILLO[0].ralenti);	//servo 1 = OSCILLO[0].ralenti
myServo[1] = setInterval(function() { moveServo(2) }, OSCILLO[1].ralenti);
myServo[2] = setInterval(function() { moveServo(3) }, OSCILLO[2].ralenti);
myServo[3] = setInterval(function() { moveServo(4) }, OSCILLO[3].ralenti);


//clearInterval(myServo[0]);	//stop un oscillo

function moveServo(n) {
	if (OSCILLO_STATE[n-1] == ON) {		//tous les oscillos start/stop en meme temps
	    servo.move(n, servoCount[n], 250);  //250 = nbre de PAS du servo

	    if (servoSens[n] == SENS_HORAIRE) {
	       servoCount[n] += PAS;
	    }
	    if (servoSens[n] == SENS_INVERSE) {
	       servoCount[n] -= PAS;
	    }
	    /*
	    if (servoCount[n] >= OSCILLO_STOP[n-1]) {
	       console.log("servo"+n+" limite stop atteinte:"+OSCILLO_STOP[n-1]+" change de sens !");
	       servoSens[n] = SENS_INVERSE;       //on inverse le sens
	       servoCount[n] = OSCILLO_STOP[n-1];      //on fixe le max (au cas ou)
	    }
	    if (servoCount[n] <= OSCILLO_START[n-1]) {
	       console.log("servo"+n+" limite start atteinte:"+OSCILLO_START[n-1]+" change de sens !");
	       servoSens[n] = SENS_HORAIRE;       //on iverse le sens
	       servoCount[n] = OSCILLO_START[n-1];     //on fixe le min (au cas ou)
	    }
	    */

	    if (servoCount[n] >= OSCILLO[n-1].stop) {
	       console.log("servo"+n+" limite stop atteinte:"+OSCILLO[n-1].stop+" change de sens !");
	       servoSens[n] = SENS_INVERSE;       //on inverse le sens
	       servoCount[n] = OSCILLO[n-1].stop;      //on fixe le max (au cas ou)
	    }
	    if (servoCount[n] <= OSCILLO[n-1].start) {
	       console.log("servo"+n+" limite start atteinte:"+OSCILLO[n-1].start+" change de sens !");
	       servoSens[n] = SENS_HORAIRE;       //on iverse le sens
	       servoCount[n] = OSCILLO[n-1].start;     //on fixe le min (au cas ou)
	    }	    
	    //console.log("servo="+n+" sens="+servoSens[n]+" PAS="+PAS+" ralenti="+OSCILLO_RALENTI[n-1]+" pos="+servo.getPosition(n, 250));
	} //else {
		//console.log("servo "+n+" stopped !");
	//}
}
/*********SERVO*****************/

/*** Envoi infos page web ***/
var loop = setInterval(function(){
	/*
	infos_obj = {
		oscillo1: { pos: servo.getPosition(1,250), ralenti: OSCILLO_RALENTI[0], start: OSCILLO_START[0], stop: OSCILLO_STOP[0], state: OSCILLO_STATE[0] },
		oscillo2: { pos: servo.getPosition(2,250), ralenti: OSCILLO_RALENTI[1], start: OSCILLO_START[1], stop: OSCILLO_STOP[1], state: OSCILLO_STATE[1] },
		oscillo3: { pos: servo.getPosition(3,250), ralenti: OSCILLO_RALENTI[2], start: OSCILLO_START[2], stop: OSCILLO_STOP[2], state: OSCILLO_STATE[2] },
		oscillo4: { pos: servo.getPosition(4,250), ralenti: OSCILLO_RALENTI[3], start: OSCILLO_START[3], stop: OSCILLO_STOP[3], state: OSCILLO_STATE[3] }
	};
	*/
	infos_obj = {
		oscillo1: { pos: servo.getPosition(1,250), ralenti: OSCILLO[0].ralenti, start: OSCILLO[0].start, stop: OSCILLO[0].stop, state: OSCILLO_STATE[0] },
		oscillo2: { pos: servo.getPosition(2,250), ralenti: OSCILLO[1].ralenti, start: OSCILLO[1].start, stop: OSCILLO[1].stop, state: OSCILLO_STATE[1] },
		oscillo3: { pos: servo.getPosition(3,250), ralenti: OSCILLO[2].ralenti, start: OSCILLO[2].start, stop: OSCILLO[2].stop, state: OSCILLO_STATE[2] },
		oscillo4: { pos: servo.getPosition(4,250), ralenti: OSCILLO[3].ralenti, start: OSCILLO[3].start, stop: OSCILLO[3].stop, state: OSCILLO_STATE[3] }
	};	
	io.sockets.emit('oscillator', {infos:infos_obj} );
}, CHECK_PERIOD * 1000)

/*** Ecoute socket de page web */
io.sockets.on('connection', function (socket) {
    //debug
    socket.emit('message', 'Vous êtes bien connecté !');

    // Quand le serveur reçoit un signal de type "startstop" du client    
    socket.on('startstop', function (data) {
        //console.log('Un client me parle ! Il me dit : ' + data);
       	state = data.state;
        console.log("Socket startstop state:"+state);
        if (state == ON) {
        	console.log("STOP");
        	for (i=0; i<NB_OSCILLOS; i++) {
        		OSCILLO_STATE[i] = OFF;
        		//console.log("move servo "+(i+1)+" to "+OSCILLO_START[i]);
        	}
   			resetPos = setInterval(function() {
				console.log("resetPos");
		    	servo.move(1, OSCILLO_START[0], 250);
		    	servo.move(2, OSCILLO_START[1], 250);
		    	servo.move(3, OSCILLO_START[2], 250);
		    	servo.move(4, OSCILLO_START[3], 250);
			}, 1000);		       	
        	//servo.sleep();		//pas la peine c'est le move ave STATE OFF qui les bloque
        } else {	//OFF
        	console.log("START");
        	for (i=0; i<NB_OSCILLOS; i++) {
        		OSCILLO_STATE[i] = ON;
        	}
        	console.log("clear resetPos");
        	clearInterval(resetPos);
        	//servo.wake();
        }
    });	

    socket.on('oscillomove', function (data) {
       	num = data.oscillo;
       	sens = data.sens;
        console.log("Socket oscillomove num:"+num+" sens:"+sens);
        if (OSCILLO_STATE[0] == OFF) {	//ts les oscillos dans le meme état
            
            console.log("clear resetPos depuis oscillomove");
        	clearInterval(resetPos);

        	destination = servo.getPosition(num, 250) + ADJUST_STEP*sens;
        	console.log("destination:"+destination);
        	if (destination >= 250) {
        		destination = 250;
        		console.log("Max 250!");
        	}
        	if (destination <= 1) {
        		destination = 1;
        		console.log("Mini 1!");
        	}        	
	    	servo.move(num, destination, 250);
        } else {	//ON
        	console.log("Can't move oscillos ON");
        }        
    });

    socket.on('save', function (data) {
       	num = data.oscillo;
       	limite = data.limite;
       	val = data.value;
        console.log("Socket save num:"+num+" limite:"+limite+" val:"+val);
        /*
		setParam( "TEMP_FAN", TEMP_FAN );
		setParam( "TEMP_ATTENUATION", TEMP_ATTENUATION );
		setParam( "ATTENUATION_SCALE", ATTENUATION_SCALE );
		setParam( "CHECK_PERIOD", CHECK_PERIOD );
		setParam( "TPS", TPS );
		setParam( "NB_RAMPES", NB_RAMPES );
		setParam( "SERVER_PORT", SERVER_PORT );
		setParam( "ON", ON );
		setParam( "OFF", OFF );
		setParam( "DEBUG", DEBUG );
		setParam( "LOG", LOG );
		jsonfile.writeFileSync(file, parameters);
		if (DEBUG) { console.log( jsonfile.readFileSync(file) ); }        
		*/
    });    

});


//End main program--- -------------------------------------