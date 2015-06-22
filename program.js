/**
 * This app scraps NYC MTA Subway Service Alerts in a simple AWS Lambda function for handling requests from Amazon Echo (Alexa).
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest)
// The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Check for Unique Application ID to prevent other voice applications from using this function.
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
                     function onActionCallback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
            
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function onActionCallback(sessionAttributes, speechletResponse) {
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
 * Called when the user launches the app
 */
function onLaunch(launchRequest, session, onActionCallback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);    
    getMTAWelcomeResponse(onActionCallback);
}

/** 
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, onActionCallback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;


    if ("GetTrainStatus" === intentName) {
        var favoriteTrainLine;
        var favoriteTrainLineSlot = intent.slots.TrainLine;
            console.log(favoriteTrainLineSlot);

        if (favoriteTrainLineSlot) {
            favoriteTrainLine = favoriteTrainLineSlot.value;
        }

        getServiceStatus(favoriteTrainLine, function getTrainStatusExCallback(response, translatedtrainline){
            getTrainStatusEx(intent, session, onActionCallback, response, translatedtrainline, favoriteTrainLine);
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
            title:  title,
            content: output
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

function getMTAWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the MTA Subway Service Status echo app, "
                + "Please tell me what train line you are interested in by saying, "
                + "The one Train or The D. train";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me what train line you are interested in by saying, "
                + "The one Train or The D. train";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}



function getTrainStatusEx(intent, session, callback, actualstatus, translatedTrainLine, trainline) {


    var cardTitle = intent.name;
    var favoriteTrainLine;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = true;
    var cardTitle = "Train Line Status";
    var speechOutput = "";


    if(trainline != '') {
        //translate trainline
        speechOutput = "The Status of the " + translatedTrainLine + " train line is " + actualstatus;//Good Service"  + getServiceStatus();
        shouldEndSession = true;
    }
    else {
        speechOutput = "I'm not sure what train line that is. Try saying, What is the status of the one train or the D. train?";
        shouldEndSession = false;
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user. 
    // If the user does not respond or says something that is not understood, the app session 
    // closes.
   callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


 // use Cheerio and Request 
 // to scrap an aspx body response and look for specific content
 
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

function getServiceStatus(trainlineslot, getTrainStatusExCallbackfunction){

    var trainline; var translatedTrainLine;
    var trainlineUnderstood = false;

    if (trainlineslot.toLowerCase() == 'one' || trainlineslot.toLowerCase() == 'two' || trainlineslot.toLowerCase() == 'three'){
        trainline = '123';
        trainlineUnderstood = true;
        translatedTrainLine =trainlineslot.toLowerCase(); 
    }   
    else if (trainlineslot.toLowerCase() == 'four' || trainlineslot.toLowerCase() == 'five' || trainlineslot.toLowerCase() == 'six'){
        trainline = '456';
        trainlineUnderstood = true;
        translatedTrainLine = trainlineslot.toLowerCase(); 
    }   
    else if (trainlineslot.toLowerCase() == 'a' || trainlineslot.toLowerCase() == 'c' ||  trainlineslot.toLowerCase() == 'e' || trainlineslot.toLowerCase() == 'a.' || trainlineslot.toLowerCase() == 'c.' ||  trainlineslot.toLowerCase() == 'e.'){
        trainline = 'ACE';
        trainlineUnderstood = true;
        if (trainlineslot.length>1){
            translatedTrainLine =trainlineslot.toLowerCase().substring(0,1); 
        }
        else
        {
            translatedTrainLine =trainlineslot.toLowerCase();
        }
    }
    else if (trainlineslot.toLowerCase() === 'b' || trainlineslot.toLowerCase() == 'd' ||  trainlineslot.toLowerCase() == 'f' || trainlineslot.toLowerCase() == 'm' ||trainlineslot.toLowerCase() === 'b.' || trainlineslot.toLowerCase() == 'd.' ||  trainlineslot.toLowerCase() == 'f.' || trainlineslot.toLowerCase() == 'm.'){
        trainline = 'BDFM';
        trainlineUnderstood = true;
        if (trainlineslot.length>1){
            translatedTrainLine =trainlineslot.toLowerCase().substring(0,1);
        }
        else
        {
            translatedTrainLine =trainlineslot.toLowerCase();
        }
    }
    else if (trainlineslot.toLowerCase() == 'n' || trainlineslot.toLowerCase() == 'q' ||  trainlineslot.toLowerCase() == 'r' || trainlineslot.toLowerCase() == 'n.' || trainlineslot.toLowerCase() == 'q.' ||  trainlineslot.toLowerCase() == 'r.' ){
        trainline = 'NQR';
        trainlineUnderstood = true;
        if (trainlineslot.length>1){
         translatedTrainLine =trainlineslot.toLowerCase().substring(0,1);
        }
        else
        {
            translatedTrainLine =trainlineslot.toLowerCase();
        }
    }
    else if (trainlineslot.toLowerCase() == 'l' || trainlineslot.toLowerCase() == 'l.'){
        trainline = 'L';
        trainlineUnderstood = true;
        if (trainlineslot.length>1){
            translatedTrainLine =trainlineslot.toLowerCase().substring(0,1);
        }
        else
        {
            translatedTrainLine =trainlineslot.toLowerCase();
        }
    }
    else if (trainlineslot.toLowerCase() == 'j' ||  trainlineslot.toLowerCase() == 'z' ||trainlineslot.toLowerCase() == 'j.' ||  trainlineslot.toLowerCase() == 'z.' ){
        trainline = 'JZ';
        trainlineUnderstood = true;
        if (trainlineslot.length>1){
            translatedTrainLine =trainlineslot.toLowerCase().substring(0,1);
        }
        else
        {
            translatedTrainLine =trainlineslot.toLowerCase();
        }
    }
    if (trainlineUnderstood == true) {

         docall(trainline, 'http://service.mta.info/ServiceStatus/statusmessage.aspx', function(response){
            console.log('Service Status:', response);        
            getTrainStatusExCallbackfunction(response, translatedTrainLine);
            //return response;
         });
     }else
     {
        getTrainStatusExCallbackfunction('');
     }

     

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