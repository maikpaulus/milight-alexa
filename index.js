'use strict'; 

const Alexa = require('alexa-sdk');
const amqp = require('amqp');
const config = require('config');
const APP_ID = undefined;
let exc;

const languageStrings = {
  'de': {
      'WELCOME_MESSAGE': 'Willkommen bei deinem Smarthome. Wie kann ich dir helfen?',
      'WELCOME_REPROMPT': '3'
  }
};

const handlers = {
    'LaunchRequest': function () {
        this.attributes.speechOutput = 'Willkommen bei deinem Smarthome. Wie kann ich dir helfen?';
        this.attributes.repromptSpeech = 'Wie kann ich dir helfen?';
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'ExecuteActionIntent': function () {
        const actionSlot = this.event.request.intent.slots.action;
	    let actionName;

        if (actionSlot && actionSlot.value) {
            actionName = actionSlot.value.toLowerCase();
        }
        else {
            this.response.speak('Ok, dann bis bald!');
            this.emit(':responseReady');
            return;
        }
    
        let msg = {
          command: 'switch.' + (actionName === 'an' ? 'on' : 'off')
        }
        
        exc.publish('milight', JSON.stringify(msg), (err) => {
          if (err) throw(err);
        });

        exc.publish('milight', JSON.stringify(msg), (err) => {
          if (err) throw(err);
        });   

        this.emit(':ask', 'Kann ich sonst noch etwas tun?', this.attributes.repromptSpeech);
    },

    'AMAZON.StopIntent': function () {
        this.response.speak('Bis bald!');
        this.emit(':responseReady');
    },

    'AMAZON.CancelIntent': function () {
        this.response.speak('Bis bald!');
        this.emit(':responseReady');
    },

    'SessionEndedRequest': function () {
        console.log(`Session ended: ${this.event.request.reason}`);
    },

    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    
    const connectionParams = config.has('rabbitmq') ? config.get('rabbitmq') : undefined;
    if (!connectionParams) {
        console.log('Es wurde keine Konfiguration von RabbitMQ gefunden. Bitte konfigurieren.');
        process.exit(0);
    }
	const connection = amqp.createConnection({ 
		host: connectionParams.host,
		port: connectionParams.port,
		login: connectionParams.user,
		password: connectionParams.password,
		vhost: connectionParams.vhost
	});

	// add this for better debuging 
	connection.on('error', function(e) {
	  console.log("Error from amqp: ", e);
	});
 
	// Wait for connection to become established. 
	connection.on('ready', function () {
	   exc = connection.exchange('amq.direct', function (exchange) {});
    
        exc.on('open', () => {
            alexa.APP_ID = APP_ID;
            // To enable string internationalization (i18n) features, set a resources object.
            alexa.resources = languageStrings;
            alexa.registerHandlers(handlers);
            alexa.execute();
        });
    });
};