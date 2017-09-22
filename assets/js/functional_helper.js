
//////////////////////////////////////////////firebase code/////////////////////////////////////////////////

var config = {
    apiKey: "AIzaSyBzJ9AknkEz3TmAHLEryoXaT74nLSf9mQQ",
    authDomain: "project1-ad91c.firebaseapp.com",
    databaseURL: "https://project1-ad91c.firebaseio.com",
    projectId: "project1-ad91c",
    storageBucket: "project1-ad91c.appspot.com",
    messagingSenderId: "297815876711"
};
firebase.initializeApp(config);

var dB = firebase.database();
var Auth = firebase.auth();
var provider_fb = new firebase.auth.FacebookAuthProvider();
var provider_goog = new firebase.auth.GoogleAuthProvider();
var myReftoDisconnect;
var myLocationRef;

var userObj;//will be user object with all kinds of datas
var databaseObj,modalShown = false;
//get instance of real-time database
dB.ref().on("value",function(snapshot){
    databaseObj = snapshot.toJSON();//setting databaseObj to the entire firebase onvalue change snapshot gives me the current firebase with every change that occurs to the firebase
    //firebase function to check whether user is logged into site
    Auth.onAuthStateChanged(function(user) {
        if (user) {
            userObj = user;
            myReftoDisconnect = dB.ref("/users/"+userObj.uid+"/iconnect");
            myReftoDisconnect.set(true);
            myReftoDisconnect.onDisconnect().set("disconnected");

            var name = databaseObj.users[userObj.uid].name;
            var email = databaseObj.users[userObj.uid].email;
            var phoneNumber = databaseObj.users[userObj.uid].phoneNumber;
            //want to put user info on page in a list-style:none list. want to include address if possible if not just put name, email, and phone
            if(databaseObj.users[userObj.uid].address !=undefined){
                accountInfo = "<ul><li>" + name + "</li><li>" + email + "</li><li>" + phoneNumber + "</li><li>"+databaseObj.users[userObj.uid].address+"</li><li id='signOut'>Sign Out</li></ul>";
            } else {//don't include address yet, this will be included when the user provides address
                accountInfo = "<ul><li>" + name + "</li><li>" + email + "</li><li>" + phoneNumber + "</li><li id='signOut'>Sign Out</li></ul>";
            }
            $("#userInfo").html(accountInfo);//set the string accountInfo created above to be userInfo's html
            requestFunctions();//I force order of onvalue change event listeners to follow after getting the most up to date database 18 lines up. this allows for more refined control of data flow
            if(databaseObj!=null&&databaseObj!=undefined&&address!=undefined&&gpsProcessed==false&&databaseObj.users[userObj.uid].serving==undefined){
                gpsProcessor();//dealing with two asynchronous and separately fired functions and want this to run only when all of this information is available (database and address each being generated from two different functions) and for it to run only once - so I check that all data has been set and then I put in a boolean gpsProcessed to allow me to control how many times this runs
            }
        }
    });
});

//////////////////////MODAL CSS - CHANGE COLOR OF BACKGROUND DEPENDING ON WHICH MODAL IS SHOWN

//I want different colored backdrops for the modals depending on the modal
$("#requestModal").on("show.bs.modal", function() {
    setTimeout(function(){        
        $(".modal-backdrop").css("background", "#003600");//change color of modal-backdrop
        $(".modal-backdrop").css("opacity","1");
    },10);
});

// Triggers as soon as 'requestModal' is closed
$('#requestModal').on('hidden.bs.modal', function() {
  $('.modal-backdrop').css("background", "");//change color of modal-backdrop
    $(".modal-backdrop").css("opacity","0");
});

// Triggers as soon as 'gpsModal' Opens
$('#gpsModal').on('show.bs.modal', function() {
    setTimeout(function(){
        $('.modal-backdrop').css("background", "#404040");//change color of modal-backdrop
        $(".modal-backdrop").css("opacity",".7");
    },10);
});

// Triggers as soon as 'gpsModal' is closed
$('#gpsModal').on('hidden.bs.modal', function() {
  $('.modal-backdrop').css("background", "");//change color of modal-backdrop
  $(".modal-backdrop").css("opacity","0");
});


var gpsProcessed=false;
function gpsProcessor(){//this function only runs when database is set and when address is set. these pieces of information come from two different asynchronous functions but I have set up boolean checks within these functions so that 
    gpsProcessed=true;
    if(databaseObj.users[userObj.uid].cameFromOtherPage == false){//will run when the user came from the other page because cameFromOtherPage will be false - address just set by user on the other page, so asking for address again is not necessary
        if(address != databaseObj.users[userObj.uid].address || databaseObj.users[userObj.uid].address == undefined){                          
            if(address!=undefined){
                if(acceptPushed==false&&submitPushed==false){//don't want to run this more than once on any page refresh so I have booleans that will be set to true when buttons on the modal are clicked
                    if(modalShown==false){//show gps modal
                        $("#gpsModal").modal({backdrop: 'static', keyboard: false});
                        $("#gpsModal").modal("show");                                
                        $("#address").html("We have calculated your address to be:<br><span id='returnedAddress'>"+address+"</span><br>Is this correct?");
                        $("#accept").css("display","block");
                        $("#reject").css("display","block");
                        modalShown = true;
                    }
                }
            }
        } else {//will run when the address generated by the navigator.geolocation matches what is in the database
            if(acceptPushed==false&&submitPushed==false){
            //when either the accept button is pushed or the submit button is pushed, I push new information to firebase under certain circumstances, and then I call google maps functions to perform map operations. if I don't have this condition, the operations will be performed twice when those buttons are pushed because this code will be executed on the firebase onvalue change trigger
                if(mapSet==false){
                    loc_GoogMaps = new google.maps.LatLng(databaseObj.users[userObj.uid].coords.lat, databaseObj.users[userObj.uid].coords.long);
                    moveToLocation();
                    ajaxWeather_latlng(databaseObj.users[userObj.uid].coords.lat, databaseObj.users[userObj.uid].coords.long);
                }
            }
        }
    } else {//will run when the user came from the other page because cameFromOtherPage will be false - address just set by user on the other page, so asking for address again is not necessary
        if(mapSet==false){//mapSet is set to true on running moveToLocation the first time (a function which sets map center based on helper marker and then calls a function that places request markers and expands bounds to show all markers), so if mapSet is still false, this means that moveToLocation hasn't been called and the map should be set up. for gpsProcessor to run, the databaseObj must have been set and address must have been set. I can then set loc_GoogMaps, what I am calling a google maps latlng geo coord set, with information from database
            loc_GoogMaps = new google.maps.LatLng(databaseObj.users[userObj.uid].coords.lat, databaseObj.users[userObj.uid].coords.long);
            moveToLocation();
            //I then call the weather ajax request
            ajaxWeather_latlng(databaseObj.users[userObj.uid].coords.lat, databaseObj.users[userObj.uid].coords.long);
        }
    }
}

var lat,long,address,streetAddress,city,state,zip,country,success,geocoder;
var loc_GoogMaps,acceptPushed = false,submitPushed = false;
$("#accept").on("click",function(){//accept the geolocation calculated by browser and proceed
    acceptPushed=true;
    $("#address").css("display","none");
    $("#accept").css("display","none");
    $("#reject").css("display","none");
    $("#reject").css("display","none");
    $("#reject").css("display","none");
    $("#gps-body").append("Thank you. Click button to continue.");
    $("#Proceed").css("display","block");
    loc_GoogMaps = new google.maps.LatLng(lat, long);
    initMap();
    moveToLocation();
    if(databaseObj.users[userObj.uid].address!=address){//if the address calculated is not the currently stored address for the user, then change the currently stored address and coords to the calculated address and coords - notice that I have set the coords in the database, this step helped a lot when trying to set help request markers on the map instead of setting trying to calculate the geolocation coordinates during that setting - the asynchronous nature of the geo function caused a lot of problems until I did this
        dB.ref("/users/"+userObj.uid+"/coords").set({"lat":lat,"long":long});
        dB.ref("/users/"+userObj.uid+"/address").set(address);
    }
    ajaxWeather_latlng(lat,long);
})

$("#reject").on("click",function(){//reject the current html5 geolocation api calculated address
    $("#address").css("display","none");
    $("#accept").css("display","none");
    $("#reject").css("display","none");
    $("#correctAddress").css("display","block");
    $("#submit").css("display","block");
    $("#instruct").css("display","block");
    if(databaseObj.users[userObj.uid].address!=undefined){
        $("#correctAddress").val(databaseObj.users[userObj.uid].address);
    }
})

$("#submit").on("click",function(){//when the user clicks reject calculated address and enters a new address and clicks the submit button the following code runs
    submitPushed=true;

    $("#instruct").css("display","none");
    $("#address").css("display","none");
    $("#accept").css("display","none");
    $("#reject").css("display","none");
    $("#correctAddress").css("display","none");
    $("#submit").css("display","none");
    $("#gps-body").append("Thank you. Click button to continue.");
    $("#Proceed").css("display","block");

    var correctAddress = $("#correctAddress").val();
                
    geocoder = new google.maps.Geocoder;
    geocoder.geocode({"address":correctAddress},function(results,status){//need to get coordinates for marker placement so I need to do another geocoder function here
        if(status==="OK"){
            loc_GoogMaps = results[0].geometry.location;
            lat=results[0].geometry.location.lat();
            long=results[0].geometry.location.lng();
            dB.ref("/users/"+userObj.uid+"/coords").set({"lat":lat,"long":long});
            dB.ref("/users/"+userObj.uid+"/address").set(correctAddress);
            //notice that I have set the coords in the database, this step helped a lot when trying to set help request markers on the map instead of setting trying to calculate the geolocation coordinates during that setting - the asynchronous nature of the geo function caused a lot of problems until I did this
            initMap();
            moveToLocation();
            ajaxWeather_latlng(lat,long);
        }

    })

})

//series of functions to check different stuff that is added to firebase

var helperOpsRan=false,requesterStatusOpsRan=false,requesterAlert,uid_pair,numMsgs=0,msgNumb = 0,nextmsgcount=1,messagesArray=[],msgArrayCount=0;

//numMsgs counts number of messages sent between two users
//msgNumb increments for each message added to the messages node for two users

function requestFunctions(){//checking actions of other user
    //order of things matter here. knowing that 
    dB.ref("/users/"+userObj.uid+"/serving").on("value",function(snapshot){
        //if this returns a snapshot that is not null, then a serving node has been added to this helper's users node that has content in it. the only time that a serving node gets added to a helper's users node is when the helper has pushed the confirm button, confirming that accept a help request. as soon as that request is marked complete by the helper, the serving node is removed from their users node. 
        //this event will be triggered at different times, from what I have seen.
        //but I only want to execute any code when the snapshot.val is not null, otherwise there wouldn't be anything there 
        //additionally, this code should only run once on any page load because it loads the modal portal
        //so I set a global variable helpersOpsRan to false, and then set it to true on its first run
        //checking for both of these conditions in the next if statement ensures that the code block inside of it only runs once and when appropriate 
        if(snapshot.val()!=null && helperOpsRan==false){//adds a tools button that will serve as operations for the user to manage their request
            helperOpsRan = true;
            var requester = snapshot.val();//sets the specific information about the help requester returned in snapshot as requester for easily following it 
            requesterUID = requester.requesterUID;
            uid_pair = userObj.uid + requesterUID;//uid_pair is used to create a unique messages array for each helper and requester. this allows for guaranteed pure one-to-one chat because the uids are unique per user and thus a string of two uids together will also be unique to two pairs of users 
            var requesterName = databaseObj.users[requesterUID].name;//retrieving the requester's name from their users node
            //when the requester marks their request as complete, it removes from their users node their helprequest, among other things. so in setting the offer message below on the helper's site, this is important to recognize. when the request is marked complete by the requester, it only changes the value of the requesterStatus in the helper's users node, so I can still retrieve the help request from the helpers users node
            if(databaseObj.users[requesterUID].helpRequest==undefined){
                var request = databaseObj.users[userObj.uid].serving.description;
            } else {
                var request = databaseObj.users[requesterUID].helpRequest;
            }
            var requesterPhone = databaseObj.users[requesterUID].phoneNumber;
            var requesterEmail = databaseObj.users[requesterUID].email;
            //accountInfo is a string set above when user is recognized as being signed in.
            //it is used to populate a list of user account info on the helper page through an html jquery function
            //one of the items that is in the list is a sign out list item. I want the same list item in the modal but with id Rsignout instead of signout. so I can simply replace the id in accountInfo
            $("div#userInfo_Rmodal").html(accountInfo.replace("signOut","RsignOut"));
            $("#pendingRequest").empty();//want to empy pendingRequest every time that the modal is open, to remove previous request info
            //here I set the contents of the modal
            var offerMsg = $("<p id='offerMsg'> You have offered to help " + requesterName + " with \"" + request + ".\"</p>");
            $("#pendingRequest").append(offerMsg);
            //menu button for modal 
            var menuBtn = $("<button class='btn btn-default btn-block' id='tools'>Tools for request: \"" + request + "\"<i class='fa fa-fw'></i><i class='fa fa-plus-circle'></i></button>");
            $("#pendingRequest").append(menuBtn);
            //tool buttons - notice use of class collapsed in each of them. this is used to easily animate what happens when tools button above is clicked
            //1. chat button
            var DrpBtn1 = $("<button class='collapsed btn btn-block' id='startChat' state='hidden'><i class='fa fa-comments'></i><i class='fa fa-fw'></i>Open Chat<i class='fa fa-fw'></i><i class='fa fa-plus-circle'></button>");
            $("#pendingRequest").append(DrpBtn1);
            //div associated with chat button
            //contains a message area where new messages will be appended
            //an input for messages to be written in
            //and a send button which is used to send messages
            var chatBox = $("<div id='chatBox'><div class='msgContainer'></div><input type='text' class='form-control' id='chatmsg' placeholder='type here'><button id='sendText' class='btn btn-default'>Send</button></div>");
            $("#pendingRequest").append(chatBox);
            //2. additional contact button
            var DrpBtn2 = $("<button class='collapsed btn btn-block' id='contact'><i class='fa fa-phone'></i><i class='fa fa-fw'></i>Additional Contact<i class='fa fa-fw'></i><i class='fa fa-plus-circle'></i></button>");
            $("#pendingRequest").append(DrpBtn2);
            //div associated with additional contact button - displays phone number, email
            var contactDiv = $("<div id='contactDiv'>Here's " + requesterName.substr(0,requesterName.indexOf(" ")) + "'s email and phone number: <p>Email: " + requesterEmail + "</p><p> Phone: " + requesterPhone + "</p><p>Alternatively, you can chat with " + requesterName.substr(0,requesterName.indexOf(" ")) + " using our chat app above.</div>");
            $("#pendingRequest").append(contactDiv);
            //3. Navigation button
            var DrpBtn3 = $("<button class='collapsed btn btn-block' id='navigation' state='hidden'><i class='fa fa-compass' aria-hidden='true'></i><i class='fa fa-fw'></i>Navigation<i class='fa fa-fw'></i><i class='fa fa-plus-circle'></i></button>");
            $("#pendingRequest").append(DrpBtn3);
            //parent div navDiv associated with navigation button - will show route and map with directions in it
            var navDiv = $("<div id='navDiv'></div>");
            //for map
            var mapDiv = $("<div id='mapDiv'></div>");
            //for route
            var routeDiv = $("<div id='routeDiv'></div>");
            navDiv.append(mapDiv);
            navDiv.append(routeDiv);
            $("#pendingRequest").append(navDiv);
            //4. mark request as complete button
            var DrpBtn3 = $("<button class='collapsed btn btn-block' id='complete'><i class='fa fa-check-square-o'></i><i class='fa fa-fw'></i>Mark Complete</button>");
            $("#pendingRequest").append(DrpBtn3);
            //after all of this has been appended to the modal, show the modal
            $("#requestModal").modal({backdrop: 'static', keyboard: false});
            $("#requestModal").modal("show");
        }
    })

    dB.ref("/users/"+userObj.uid+"/serving/requesterStatus").on("value",function(snapshot){
        //again, this is an onvalue change listener that I only want to execute its code block once
        //so I check the value of the snapshot and have a boolean variable that will prevent from the code block being executed more than once
        //this listener is purely to run code when the snapshot value is set to complete
        //this value changes from live to complete by the requester when the requester marks the request as complete
        if(snapshot.val()=="complete" && requesterStatusOpsRan==false){
            requesterStatusOpsRan=true;
            var requesterName = databaseObj.users[requesterUID].name;
            var firstName = requesterName.substr(0,requesterName.indexOf(" "));
            //alerts user that the requester has marked the request as complete
            requesterAlert = "<p>Hey, "+firstName+" has marked this request as complete, and has closed this request. Mark this request as complete to find someone else to help out. Thank you for your service.</p>";
            $("#pendingRequest").prepend(requesterAlert);
            //disables buttons and collapses contents of open tools
            $("#navigation").prop( "disabled", true );
            $("#navigation").removeClass("fa-minus-circle").addClass("fa-plus-circle");
            $("#navDiv").css("display","none");
            $("#contact").prop( "disabled", true );
            $("#contact").removeClass("fa-minus-circle").addClass("fa-plus-circle");
            $("#contactDiv").css("display","none");
            $("#startChat").prop( "disabled", true );
            $("#startChat").removeClass("fa-minus-circle").addClass("fa-plus-circle");
            $("#chatBox").css("display","none");
        }
    })

    //I had no idea that this would work and it might be weird coding but in order for the following listener to work properly, and only be defined when uid_pair is set, I had to wrap it in a check on teh value of uid_pair. I didn't want to set uid_pair to "123" or any other number, because I didn't want to be checking the messages node of just any number, but the appropriate uid_pair
    if(uid_pair!=undefined){
        dB.ref("/messages/"+uid_pair).on("value",function(snapshot){
            //here, uid_pair is a key and its value is an array with the messages stored in order
            //I want this to run any time a message gets appended to the array so I only want to check for whether the value of snapshot is null or not
            if(snapshot.val()!=null&&snapshot.val()!=undefined){
                //on page load, if this is an ongoing request, msgContainer which holds all the msgs will have no msgs in it. in this case, I want to load all messages from the snapshot the first time. for every subsequent accepted trigger of this event, I first check that the length of the array is longer than it was the previous appropriately triggered event, and, if so, I append the new message with its time
                if($(".msgContainer>.msg").length==0){
                    for (var i=0; i<snapshot.val().length; i++){

                            var message = snapshot.val()[i].message;
                            var date = snapshot.val()[i].date;
                            $(".msgContainer").append("<p class='msg'>"+message+"<br>"+date+"</p>");

                    }
                    messagesArray=snapshot.val();
                    msgArrayCount=snapshot.val().length;
                } else {
                    if (snapshot.val().length>msgArrayCount){
                        msgArrayCount=snapshot.val().length;
                        messagesArray=snapshot.val();
                        var message = messagesArray[msgArrayCount-1].message;
                        var date = messagesArray[msgArrayCount-1].date;
                        $(".msgContainer").append("<p class='msg'>"+message+"<br>"+date+"</p>");
                    }
                }
            }              
        })
    }
}

//what happens when the open chat button is clicked
$(document).on("click","#startChat",function(){
    if($(this).attr("state")=="hidden"){//the button has a state property that tells whether its associated div is hidden or shown. there are associated animations that I want to run on the chatbox when the chatbox goes from hidden to shown and to add a domlistener for when nodes are added to the msgContainer.
        $("#chatBox").css("display","block");

        $(this).attr("state","shown");
        $(this).find(".fa-plus-circle").removeClass("fa-plus-circle").addClass("fa-minus-circle");
        setTimeout(slideToBottom,1000);
        setTimeout(function(){
            $(".msgContainer").bind("DOMNodeInserted",function(){
                position = position+20;
                $('.msgContainer').animate({
                    scrollTop: position
                }, 'slow');
            });
        },5000);                
    } else {
        $("#chatBox").css("display","none");
        $('.msgContainer').animate({
            scrollTop: 0
        }, 'fast');
        $(this).attr("state","hidden");
        $(this).find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
    }
})

var position=0;
function slideToBottom() {//found this on stackoverflow - finds position of last msg in msgContainer and does an animation to put the overflow:auto msgContainer scrolled to the last msg 
    if(position<$('.msgContainer .msg:last-child').position().top){
        position = $('.msgContainer .msg:last-child').position().top;
        $('.msgContainer').animate({
            scrollTop: position
        }, 'slow');
    }
}

//prevents user from pressing enter to submit msg
$(document).on("keypress","#chatmsg", function(e){

    if($("#chatmsg").val().length>0){        
        if(e.which == 13){
            event.preventDefault();
            return false;
        }
    }

})

//only way that message can be submitted - note that I am only pushing the message to the messagesArray to keep current, because this is what is sent to firebase as the value of the uid_pair array and what is returned as snapshot when the event listener for changes in the messages array in the above is called
//messagesArray is then pushed to firebase at node messages - uid_pair
//then the messages input box is reset
$(document).on("click","#sendText",function(){

    if($("#chatmsg").val().length>0){
        messagesArray.push({
            message: databaseObj.users[userObj.uid].name + ": " + $("#chatmsg").val(),
            date: moment().format().replace("T"," ")
        });
        dB.ref("/messages/"+uid_pair).set(messagesArray);
        $("#chatmsg").val("");
    }

})        

//navigation button click listener - button has state attr that tells us state of associated navDiv
//if state is hidden then on click should show the navDiv, set the height of the mapDiv and set the height of the routeDiv
//google maps have proven finicky in my experience and need to be placed only in a div when that div has a set height - not before its height has been set, so I delay the setting of the map by 500 ms. then I set the button attr state to shown
//if the state is shown then this button click is to close the navdiv - empty the map and route
$(document).on("click","#navigation",function(){
    if($(this).attr("state")=="hidden"){

        $("#navDiv").css("display","block");
        $("#mapDiv").css("height","300px");
        $("#routeDiv").css("height","100%");
        setTimeout(function(){
            startLoc = databaseObj.users[userObj.uid].address;
            endLoc = databaseObj.users[requesterUID].address;
            initNavMap(startLoc,userObj.uid,endLoc,requesterUID);
        },500);
        $(this).attr("state","shown");
        //swapping font awesome to show minus
        $("#navigation").find(".fa-plus-circle").removeClass("fa-plus-circle").addClass("fa-minus-circle");
    } else if($(this).attr("state")=="shown"){
    
        $("#mapDiv").empty();
        $("#routeDiv").empty();
        $("#navDiv").css("display","none");
        $(this).attr("state","hidden");
        //swapping font awesome to show fa-plus-circle
        $("#navigation").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
    }
})

//for tools button animation
$(document).on("click","#tools",function(){//adding animations for clicking tools button on requestModal
    if($(".collapsed").hasClass("animation-show")){//if animation-show class is present, then tool buttons are shown. I want to collapse them so I swap animation-show for animation-hide, change font awesome icon and after animation complete, make display for tool buttons "none"
    $(".collapsed").removeClass("animation-show").addClass("animation-hide");
    $("#tools").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
    $("#contactDiv").css("display","none");
    $("#contactDiv").removeClass("contact-animation-show").addClass("contact-animation-hide");
    $("#contact").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
    $("#navDiv").css("display","none");
    $("#mapDiv").empty();
    $("#routeDiv").empty();
    $("#navigation").attr("state","hidden");
    $("#navigation").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
    $("#chatBox").css("display","none");
    $("#startChat").attr("state","hidden");
    $("#startChat").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
    setTimeout(function(){$(".collapsed").css("display","none")},100);
  } else if($(".collapsed").hasClass("animation-hide")){//if animation-hide class is present, then action buttons are collapsed. I want to show them so I swap animation-hide for animation-show, change font awesome icon and make display for action buttons "block" so that animation can be seen
    $("#tools").find(".fa-plus-circle").removeClass("fa-plus-circle").addClass("fa-minus-circle");
    $(".collapsed").removeClass("animation-hide").addClass("animation-show");
    $(".collapsed").css("display","block");
  } else {//animation-show and animation-hide are classes specifically for animation, so they are not part of the action buttons at first. this way the buttons can stay collapsed. so if neither class is present, this means that the buttons are collapsed and need to be shown. so if the action menu button is clicked, I want to add the animation class animation-show to the collapse action buttons to show the buttons, swap the font awesome icon and make the display be block so that the animation can be seen
    $(".collapsed").addClass("animation-show");
    $("#tools").find(".fa-plus-circle").removeClass("fa-plus-circle").addClass("fa-minus-circle");
    $(".collapsed").css("display","block");
  }
})

$(document).on("click","#contact",function(){//adding animations for clicking contact button on requestModal
    if($("#contactDiv").hasClass("contact-animation-show")){//if animation-show class is present, then action buttons are shown. I want to collapse them so I swap animation-show for animation-hide, change font awesome icon and after animation complete, make display for action buttons "none"
    $("#contactDiv").removeClass("contact-animation-show").addClass("contact-animation-hide");
    $("#contact").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
    setTimeout(function(){$("#contactDiv").css("display","none")},100);
  } else if($("#contactDiv").hasClass("contact-animation-hide")){//if animation-hide class is present, then action buttons are collapsed. I want to show them so I swap animation-hide for animation-show, change font awesome icon and make display for action buttons "block" so that animation can be seen
    $("#contact").find(".fa-plus-circle").removeClass("fa-plus-circle").addClass("fa-minus-circle");
    $("#contactDiv").removeClass("contact-animation-hide").addClass("contact-animation-show");
    $("#contactDiv").css("display","block");
  } else {//animation-show and animation-hide are classes specifically for animation, so they are not part of the action buttons at first. this way the buttons can stay collapsed. so if neither class is present, this means that the buttons are collapsed and need to be shown. so if the action menu button is clicked, I want to add the animation class animation-show to the collapse action buttons to show the buttons, swap the font awesome icon and make the display be block so that the animation can be seen
    $("#contactDiv").addClass("contact-animation-show");
    $("#contact").find(".fa-plus-circle").removeClass("fa-plus-circle").addClass("fa-minus-circle");
    $("#contactDiv").css("display","block");
  }
})

//when the helper clicks the complete button on the requesterModal then the following happens
//empties mapDiv and routeDiv
//removes the messages node with uid_pair and sets uid_pair to undefined (to prevent the event listener from running)
//the I reset the messagesArray to an empty array so that messages aren't stored from previous conversations
//I remove the helper's users serving node so that a new request can be filled by user
//I empty the msgContainer of all messages from the just closed messages
//then depending on the state of the requester's users node, the helper sets helperStatus to complete
$(document).on("click","#complete",function(){//when helper pushes complete button
    $("#mapDiv").empty();
    $("#routeDiv").empty();
    var uid_pair_temp = uid_pair;
    uid_pair=undefined;
    dB.ref("/messages/"+uid_pair_temp).remove();
    messagesArray=[];
    msgArrayCount=undefined;
    dB.ref("/users/"+userObj.uid+"/serving").remove();//remove helper info from node
    $(".msgContainer").empty();
    if(databaseObj.users[requesterUID].helpedBy!=null){
        if(databaseObj.users[requesterUID].helpedBy.helperUID==userObj.uid){
            dB.ref("/users/"+requesterUID+"/helpedBy/helperStatus").set("complete");//notify requester that you have marked the request as complete, only if the requester has a helpedBy node and only if the helperUID of the helpedBy node is that of the helper
        }
    }
    //call the ajaxWeather function to get current weather from open weather api
    ajaxWeather_latlng(databaseObj.users[userObj.uid].coords.lat,databaseObj.users[userObj.uid].coords.lat);
    $('#requestModal').modal("hide");
    //I want to ensure that the firebase changes above go through prior to setting the booleans associated with blocking triggers back to false
    setTimeout(function(){
        
        statusOpsRan=false;
        helperOpsRan=false;
        requesterStatusOpsRan=false;
    },1000);
})


var navMap; 
//navMap will be the map that shows directions for the helper to use to get to help requester
//need to pass a start location, the helper's current location
//and an end location, the help requester's current location
function initNavMap(startLoc,helperUID,endLoc,requesterUID){
    var directionsService = new google.maps.DirectionsService;//set up the directions service
    var directionsDisplay = new google.maps.DirectionsRenderer;//set up the directions renderer
    var center_lat = databaseObj.users[userObj.uid].coords.lat;//set center to be that of the helper
    var center_lng = databaseObj.users[userObj.uid].coords.long;
    var center = {lat:center_lat,lng:center_lng};
    navMap=new google.maps.Map(document.getElementById('mapDiv'),{//create new map for the map div that has already at this point been set to have height 300px
        zoom:15,
        center:center,
        fullscreenControl:false//setting this to false because for some reason full screen mode when on a modal messes up - need to check into this later
    });
    directionsDisplay.setMap(navMap);//tells google that the map that I want to show directions on is navMap

    directionsService.route({//sets route given by me - this is going to be route from helper loc to requester loc
        origin: startLoc,
        destination: endLoc,
        travelMode: "DRIVING"
    }, function(response,status){
        if(status=="OK"){
            directionsDisplay.setDirections(response);
            //if the call was a success, then I want to set the directions (one line up) and take information from the response and use it to create a table of the route - the route is returned in response.routes[0].legs[0]
            createTable(response.routes[0].legs[0]);
        } else {
            window.alert("Directions request failed due to " + status);
        }
    });

    //event listener for when bounds are changed
    //event listener for when map is resized
    google.maps.event.addDomListener(navMap, 'resize', function() {
        navMap.setCenter(center);
    });

    //following code is for responsiveness
    //keep center of map focused when resizing window - center will be set to center of bounds, which for the most part will be center of route
    google.maps.event.addDomListener(window, 'resize', function() {
        //get coordinates and make them a google coordinate set, then pass them to function to fit bounds
        if($('#requestModal').hasClass('in')){
            var startloc_lat=databaseObj.users[userObj.uid].coords.lat;
            var startloc_lng=databaseObj.users[userObj.uid].coords.long;
            var startloc_latlng=new google.maps.LatLng(startloc_lat, startloc_lng);
            var endloc_lat=databaseObj.users[requesterUID].coords.lat;
            var endloc_lng=databaseObj.users[requesterUID].coords.long;
            var endloc_latlng=new google.maps.LatLng(endloc_lat, endloc_lng);

            var bounds = new google.maps.LatLngBounds();
            bounds.extend(startloc_latlng);
            bounds.extend(endloc_latlng);

            navMap.setCenter(bounds.getCenter());
            navMap.fitBounds(bounds);
        }

    });


}

//function for creating route table
//notice that columns are being assigned classes - this is for responsiveness - when screen gets to a certain smaller width, I hide distance column
function createTable(directionsArray){
    var requesterName = databaseObj.users[requesterUID].name;
    var firstName = requesterName.substr(0,requesterName.indexOf(" "));
    $("#routeDiv").append("<p>Start Address (Point A - Where you are): " + directionsArray.start_address + "</p><p>End Address (Point B - Where "+firstName+" is): " + directionsArray.end_address + "</p><p>Distance from Point A to Point B: " + directionsArray.distance.text + "</p><p>Duration: " + directionsArray.duration.text + "</p>Driving Directions below:");
    var bigTableText;
    bigTableText = "<table style='width:100%'><tr><th>Instructions</th><th class='dur'>Duration</th><th class='dist'>Distance</th></tr>"
    for (var i=0; i<directionsArray.steps.length; i++){
        var instructions=directionsArray.steps[i].instructions;
        var duration=directionsArray.steps[i].duration.text;
        var distance=directionsArray.steps[i].distance.text;
        bigTableText=bigTableText+ "<tr><td>"+instructions+"</td><td class='dur'>"+duration+"</td><td class='dist'>"+distance+"</td></tr>";
    }
    bigTableText+="</table>";
    $("#routeDiv").append(bigTableText);//appends the string as html into routeDiv
}
//function to generate main page map
var map, geolocationFound = false;
function initMap(){
    //first creates a map that centers on Dallas
    var center={lat:32.7767,lng:-96.7970};
    map = new google.maps.Map(document.getElementById('map'),{
        zoom:15,
        center:center,
        fullscreenControl:true //allow for full screen control here (I think this is standard)
    });

//////////////////////////////html5 geolocation api mixed with Goog Maps API Geocoding///////////////////////////////
    //options for html5 geolocation api

    var options = {
      enableHighAccuracy: true,//set it to this so that I can access the most accurate gps system available on user's system - I think this is a setting that would only be active for mobiles
      timeout: 5000,
      maximumAge: 0
    };

    //if the getCurrentPosition function was able to get your gps location, then I want to do the following function, including running google maps geocode api
  
    function success(pos) {//pos is an object that returns among other things the coordinates of the user

        var crd = pos.coords;
        lat = crd.latitude;
        long = crd.longitude;

        /////GOOGLE MAPS GEOCODE API FUNCTIONS - gets address
        geocoder = new google.maps.Geocoder;//sets up new geocoder
        var geopos = {lat:lat,lng:long};//creates an object using the html5 geolocation calculated latlng
        geocoder.geocode({"location":geopos},function(results,status){//and passes it to the google maps geocoder api as location
            if(status==="OK"){//then if return is good, sets global variable address to the part of the result object
                if(results[0]){
                    address = results[0].formatted_address;//formatted address with street address
                    if(databaseObj!=null&&databaseObj!=undefined&&address!=undefined&&gpsProcessed==false&& databaseObj.users[userObj.uid].serving==undefined){
                        geolocationFound=true;
                        gpsProcessor();
                    }                            
                }
            }
        })

    };

    function error(err) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    };

    //geolocation.getCurrentPosition takes three parameters, 
    //success - function - what do you want to do with the information returned if the function getCurrentPosition runs successfully
    //error - function - how to handle errors
    //options - object - optional parameters for how to handle getting coordinates
    navigator.geolocation.getCurrentPosition(success, error, options);
}

var mapSet = false;//to prevent more than one call to the function moveToLocation from the database onvalue change function
var helperMarker;
function moveToLocation(){//sets location to show user's current location and sets green helper marker with an infowindow that opens when clicked. also stores marker in markers array
    mapSet = true;
    // using global variable:
    if(loc_GoogMaps==undefined){//in case this function is called when loc_GoogMaps has not be set elsewhere, I set it with what is currently in the users node of the database
        if(databaseObj.users[userObj.uid].coords!=undefined){
            loc_GoogMaps = new google.maps.LatLng(databaseObj.users[userObj.uid].coords.lat, databaseObj.users[userObj.uid].coords.long);
            
        }
    }
    map.panTo(loc_GoogMaps);//center on loc_GoogMaps
    //creation of helper marker
    helperMarker = new google.maps.Marker({
      position: loc_GoogMaps,
      map: map,
      animation: google.maps.Animation.DROP,
      icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'//green dot to distinguish from help request markers which will be standard red
    });
    //infowindow for helper marker (user marker because user on this page is going to be "helper")
    var infowindow = new google.maps.InfoWindow({
      content: "You are here"
    });
    //adds click listener for clicking helper marker
    helperMarker.addListener('click', function() {
      infowindow.open(map, helperMarker);
    });
    //re-centers map on helper marker
    google.maps.event.addDomListener(window, 'resize', function() {
        map.setCenter(loc_GoogMaps);
    });
    //helpRequest markers
    addRequestMarkersWithinRadius();//now set help request markers
}

//function for adding help request markers
function addRequestMarkersWithinRadius(){//help request markers
    var bounds = new google.maps.LatLngBounds();//I want to expand bounds of map to see all markers so I set up a latlngbounds object here
    var markers = [];//marker array to push newly created marker objects
    var content;//content for each infowindow attached to a marker

    if(databaseObj.helpRequests!=null&&databaseObj.helpRequests!=undefined){
        //I access information from this databaseObj at the helpRequests node, so need to make sure that the node is not null or undefined
        //given that the helpRequests node has requests in it, I can go through all of the help request keys, verify it isn't the current users uid (where the user is on the helper page) and it is not open (because I only want to show open help requests) and then start putting help request markers down on the map
        for (var i=0; i<Object.keys(databaseObj.helpRequests).length;i++){
            var helpuid = Object.keys(databaseObj.helpRequests)[i];//the key is the uid as can be seen on the help page code

            if(helpuid!=userObj.uid && databaseObj.helpRequests[helpuid]=="open"){
                //set a new LatLng coord set to pass to marker
                var helpAddress=databaseObj.users[helpuid].address;
                var lat_help = databaseObj.users[helpuid].coords.lat;
                var long_help = databaseObj.users[helpuid].coords.long;
                var loc_GoogMaps_help = new google.maps.LatLng(lat_help, long_help);  
                
                var marker = new google.maps.Marker({
                  position: loc_GoogMaps_help,
                  map: map,
                  animation: google.maps.Animation.DROP
                });

                markers.push(marker);//push marker to markers array

                bounds.extend(helperMarker.getPosition());//extend bounds to show helperMarker

                for (var j = 0; j < markers.length; j++) {//extend bounds to include all helper Markers latlng
                    bounds.extend(markers[j].getPosition());
                }
                //content for infowindows that are attached to markers through function attachListener
                //contains request, requester name, requester address, and button that has as an attr uid
                content = "<div><p id='request'>"+databaseObj.users[helpuid].helpRequest+"</p><p id='help_name'>"+databaseObj.users[helpuid].name + "</p><p id='help_address'>" + databaseObj.users[helpuid].address + "</p><button class='contact' uid="+helpuid+">Help!</button></div>";

                attachListener(marker,content);
            
            }

        }
        //if there are any helper markers (all of which will have been placed in the markers array) then set bounds to show all markers
        if(markers.length>0){
            map.fitBounds(bounds);
        }

    }

        
}

function attachListener(marker,content){//for setting info window data to each help marker
    var infowindow = new google.maps.InfoWindow({
        content:content
    });
    //this function is called for each marker in the big for loop of the function above and adds a click listener for each of the help request markers on the map. the click listener, when triggered, opens the infowindow attached to the marker
    marker.addListener("click",function(){
        infowindow.open(marker.get("map"),marker);
    });
}

var requesterUID,statusOfRequest; //store UID of requester
$(document).on("click",".contact",function(){
    requesterUID = $(this).attr("uid");//gets uid of requester from the button and store it in a variable
    statusofRequest = databaseObj.helpRequests[requesterUID];//gets current status of helprequest for requesterUID
    var name = databaseObj.users[requesterUID].name;
    if(statusofRequest=="open"){//if status is still open when user clicks on help request contact button, then display this message
        $("#confirmModal").modal("show");
        $(".confirmMessage").html("<p id='confirm-message'>Help " + $(this).parent().find("#help_name").html() + " with \"" + $(this).parent().find("#request").html()+"\"?</p><button id='confirmBtn' class='btn btn-primary btn-block' data-dismiss='modal' aria-hidden='true'>Continue</button>");
    } else {//otherwise display message that states that request was either withdrawn or is being serviced by someone else
        $("#confirmModal").modal("show");
        $(".confirmMessage").html("<p id='confirm-message'>Either someone else has recently accepted "+name.substr(0,name.indexOf(" "))+"'s request or "+name.substr(0,name.indexOf(" "))+" has withdrawn his request for help. The map is being updated now. Click outside this box to find another person in need of help.</p>");
        initMap();//in which case, update map to show only currently opened requests
        moveToLocation();
    }
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//go to other pages

//go to Get Help page
$("#disclaimer>a").on("click",function(){
   gotoGetHelp();
})

$("p.getHelp").on("click",function(){
   gotoGetHelp();
})

function gotoGetHelp(){//in addition to navigating to get help page, the function also sets the cameFromOtherPage to true - this allows the user to navigate between pages without having to be asked multiple times if the html5 geolocation api calculated address is correct
    dB.ref("/users/" + userObj.uid + "/cameFromOtherPage").set(true);
    var win = window.open("help_page.html","_self");
    win.focus();
}

//sign out and go to home page
$(document).on("click","#signOut",function(){
    firebase.auth().signOut().then(function() {
        var win = window.open("index.html","_self");
        win.focus();     
    }, function(error) {
        console.error('Sign Out Error', error);
    });
})

//sign out and go to home page
$(document).on("click","#RsignOut",function(){
    firebase.auth().signOut().then(function() {
        var win = window.open("index.html","_self");
        win.focus();     
    }, function(error) {
        console.error('Sign Out Error', error);
    });
})

//what happens when the user clicks the confirm help offer to help request 
$(document).on("click","#confirmBtn",function(){
    dB.ref("/helpRequests/"+requesterUID).set("beingHelped");//I change the helpRequest from open to beingHelped
    dB.ref("/users/"+requesterUID+"/helpedBy").set({//I pass the helper uid to the person requesting help and a status of live to the requester - this will trigger an event listener to execute code and show a note that the requester is being helped
        helperUID:userObj.uid,
        helperStatus:"live"
    });
    dB.ref("/users/"+userObj.uid+"/serving").set({//sets in helper's own users node a serving node which stores requester status (this will be set to complete by user when they mark the request as complete),the request description, and the requesterUID to allow easy retrieval of requester information (phone, address, etc)
        requesterStatus:"live",
        description:databaseObj.users[requesterUID].helpRequest,
        requesterUID:requesterUID
    });
    initMap();
    moveToLocation();
})

///////////////////////////////////////////////////////////////////want to refresh the main map on this page every 20 seconds to update help request markers
setInterval(function(){
    $("#map").empty();
    initMap();
    moveToLocation();
    ajaxWeather_latlng(databaseObj.users[userObj.uid].coords.lat,databaseObj.users[userObj.uid].coords.lat);
},20000)

//openweather api ajax call
function ajaxWeather_latlng(lat,long){
    $.getJSON("https://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+long+"&cnt=10&appid=037ae0f267a4d5e7fb06436b5baf1089", function(json, textStatus) {
        var temperature = Math.round(((json.main.temp - 273.15) * 1.8) + 32);
        var weatherCond = json.weather[0].description;
        $("#todayWeather").html(temperature + "°F and " + weatherCond);
    });
}
