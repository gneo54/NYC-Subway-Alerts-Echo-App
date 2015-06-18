/**
 * This sample shows how to create a simple Lambda function for handling speechlet requests.
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and replace application.id with yours
         * to prevent other voice applications from using this function.
         */
        
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.07fa2e9b-6ec4-436d-b240-f2e30a1d4808") {
            context.fail("Invalid Application ID");
        }
        

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);

            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    //getWelcomeResponse(callback);
    getMTAWelcomeResponse(callback);
}

/** 
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    /*if ("MyColorIsIntent" === intentName) {
        setColorInSession(intent, session, callback);
    } 
    else if ("MyTrainLineIsIntent"  === intentName){
        setTrainLineInSession(intent, session, callback);
    }else if ("WhatsMyColorIntent" === intentName) {
        getColorFromSession(intent, session, callback);        
    } 
    else if ("WhatsMyTrainStatus" === intentName) {
        getTrainStatus(intent, session, callback);
    }*/
    if ("GetTrainStatus" === intentName) {
        var favoriteTrainLine;
        var favoriteTrainLineSlot = intent.slots.TrainLine;
            console.log(favoriteTrainLineSlot);

        if (favoriteTrainLineSlot) {
            favoriteTrainLine = favoriteTrainLineSlot.value;
        }

        getServiceStatus(favoriteTrainLine, function gettrainstatusexcallback(response){
            getTrainStatusEx(intent, session, callback, response, favoriteTrainLine);
        });
    }else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the app returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

/**
 * Helpers that build all of the responses.
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}

/** 
 * Functions that control the app's behavior.
 */
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the Alexa AppKit session sample app, "
                + "Please tell me your favorite color by saying, "
                + "my favorite color is red";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me your favorite color by saying, "
                + "my favorite color is red";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getMTAWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the MTA Subway Service Status app, "
                + "Please tell me what train line you are interested in by saying, "
                + "The one Train or The D train";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me what train line you are interested in by saying, "
                + "The one Train or The D train";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function setColorInSession(intent, session, callback) {
    var cardTitle = intent.name;
    var favoriteColorSlot = intent.slots.Color;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (favoriteColorSlot) {
        favoriteColor = favoriteColorSlot.value;
        sessionAttributes = createFavoriteColorAttributes(favoriteColor);
        speechOutput = "I now know your favorite color is " + favoriteColor + ". You can ask me "
                + "your favorite color by saying, what's my favorite color?";
        repromptText = "You can ask me your favorite color by saying, what's my favorite color?";
    } else {
        speechOutput = "I'm not sure what your favorite color is, please try again";
        repromptText = "I'm not sure what your favorite color is, you can tell me your "
                + "favorite color by saying, my favorite color is red";
    }

    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getTrainStatusEx(intent, session, callback, actualstatus, trainline) {


    var cardTitle = intent.name;
    var favoriteTrainLine;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    //Get Line
    //if(session.attributes) {
    //    favoriteTrainLine = session.attributes.favoriteTrainLine;
    //}

    

    if(trainline) {
        //translate trainline
        speechOutput = "The Status of Train Line " + trainline + " is " + actualstatus;//Good Service"  + getServiceStatus();
        shouldEndSession = true;
    }
    else {
        speechOutput = "I'm not sure what train line that is. Try saying what is the status of the  1 train or the D train?";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user. 
    // If the user does not respond or says something that is not understood, the app session 
    // closes.
   callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

function setTrainLineInSession(intent, session, callback) {
    var cardTitle = intent.name;
    var favoriteTrainLineSlot = intent.slots.TrainLine;
    console.log(favoriteTrainLineSlot);
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (favoriteTrainLineSlot) {
        favoriteTrainLine = favoriteTrainLineSlot.value;
        sessionAttributes = createFavoriteColorAttributes(favoriteTrainLine);
        speechOutput = "I now know your Preferred Train Line is  " + favoriteTrainLine + ". You can ask me "
                + "for that train line's current status by saying, what's the status of my train line?";
        repromptText = "You can ask me for a status by saying, what's the status of my train line?";
    } else {
        speechOutput = "I'm not sure what your favorite color is, please try again";
        repromptText = "I'm not sure what your favorite color is, you can tell me your "
                + "favorite color by saying, my favorite color is red";
    }

    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


function createFavoriteColorAttributes(favoriteColor) {
    return {
        favoriteColor: favoriteColor
    };
}

function createFavoriteTrainLineAttributes(favoriteTrainLine) {
    return {
        favoriteTrainLine: favoriteTrainLine
    };
}

function getTrainStatus(intent, session, callback) {
    var cardTitle = intent.name;
    var favoriteTrainLine;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    //Get Line
    if(session.attributes) {
        favoriteTrainLine = session.attributes.favoriteTrainLine;
    }

    if(favoriteTrainLine) {
        //translate trainline
        speechOutput = "The Status of Train Line " + favoriteTrainLine + " is Good Service";// + getServiceStatus();
        shouldEndSession = true;
    }
    else {
        speechOutput = "I'm not sure what your preferred train line is, you can say my preferred train line is the 1 train or the D train.";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user. 
    // If the user does not respond or says something that is not understood, the app session 
    // closes.
    callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

function docall(trainline, urlToCall, callbackfunc){

    var request = require('request');
    var cheerio = require('cheerio');
    

    request.post(
        urlToCall,
        { form: { 'lineName': trainline, 'mode': 'Subways'  } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //console.log(body)

            $ = cheerio.load(body);
            var newserviceStatus = $('#status-contents').text().replace(/[\n\t\r]/g,"");
            
                return callbackfunc(newserviceStatus);
            }
        }
    );
}

function getServiceStatus(trainlineslot, callbackfunction){

    var trainline;
    if (trainlineslot == 'one' || trainlineslot == 'two' || trainlineslot == 'three' || trainlineslot == '1' || trainlineslot == '2' || trainlineslot == '3'){
        trainline = '123';
    }   

    if (trainlineslot.toLowerCase() == 'a' || trainlineslot.toLowerCase() == 'c' ||  trainlineslot.toLowerCase() == 'e'){
        trainline = 'ACE'
    }

   if (trainlineslot.toLowerCase() === 'b' || trainlineslot.toLowerCase() == 'd' ||  trainlineslot.toLowerCase() == 'f' || trainlineslot.toLowerCase() == 'm'){
        trainline = 'BDFM'
    }


    if (trainlineslot == 'n' || trainlineslot == 'q' ||  trainlineslot == 'r' || trainlineslot == 'N' || trainlineslot == 'Q' ||  trainlineslot == 'R'){
        trainline = 'NQR';
    }

    if (trainlineslot == 'l' || trainlineslot == 'L'){
        trainline = 'L';
    }

       if (trainlineslot == 'j' || trainlineslot == 'J' ||  trainlineslot == 'z' || trainlineslot == 'Z'){
        trainline = 'JZ';
    }

     docall(trainline, 'http://service.mta.info/ServiceStatus/statusmessage.aspx', function(response){
        console.log('Service Status:', response);        
        callbackfunction(response);
        //return response;
     });



     

}
function getColorFromSession(intent, session, callback) {
    var cardTitle = intent.name;
    var favoriteColor;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if(session.attributes) {
        favoriteColor = session.attributes.favoriteColor;
    }

    if(favoriteColor) {
        speechOutput = "Your favorite color is " + favoriteColor + ", goodbye";
        shouldEndSession = true;
    }
    else {
        speechOutput = "I'm not sure what your favorite color is, you can say, my favorite color "
                + " is red";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user. 
    // If the user does not respond or says something that is not understood, the app session 
    // closes.
    callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

/* INTENT 
{
  "intents": [
    {
      "intent": "GetTrainStatus",
      "slots": [
        {
          "name": "TrainLine",
          "type": "LITERAL"
        }
      ]
    }
  ]
}
*/