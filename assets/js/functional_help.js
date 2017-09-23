
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
var userLoggedIn=false;
var myRefToDisconnect;

var accountInfo;//to be pushed to userInfo section - list of user account data
var userObj;//will be user object with all kinds of datas
var databaseObj,modalShown=false;
var placeholderSet=false;//to make sure that the personalized placeholder for the input field is only set to show user's name once

//get instance of real-time database
dB.ref().on("value",function(snapshot){
    databaseObj = snapshot.toJSON();
    //get current user's user obj, including uid
    Auth.onAuthStateChanged(function(user) {
        if (user) {
            userObj = user;
            myReftoDisconnect = dB.ref("/users/"+userObj.uid+"/iconnect");
            myReftoDisconnect.set(true);
            myReftoDisconnect.onDisconnect().set("disconnected");
            var name = databaseObj.users[userObj.uid].name;
            
            //making the help page more personalized by adding the user's first name to the placeholder of the input box
            if(!placeholderSet){
                var firstName = name.substr(0,name.indexOf(" "));
                var requestInput_placeholder = $("#requestInput").attr("placeholder");
                requestInput_placeholder = requestInput_placeholder.replace("?",", "+firstName+"?");
                $("#requestInput").attr("placeholder",requestInput_placeholder);
                placeholderSet=true
            }
            var email = databaseObj.users[userObj.uid].email;
            var phoneNumber = databaseObj.users[userObj.uid].phoneNumber;
            //want to put user info on page in a list-style:none list. want to include address if possible if not just put name, email, and phone                   
            if(databaseObj.users[userObj.uid].address !=undefined){
                accountInfo = "<ul><li>" + name + "</li><li>" + email + "</li><li>" + phoneNumber + "</li><li>"+databaseObj.users[userObj.uid].address+"</li><li id='signOut'>Sign Out</li></ul>";//provides welcome greeting
            } else {//don't include address yet, this will be included when the user provides address
                accountInfo = "<ul><li>" + name + "</li><li>" + email + "</li><li>" + phoneNumber + "</li><li id='signOut'>Sign Out</li></ul>";//provides welcome greeting
            }
            requestFunctions();
            //I force order of onvalue change event listeners to follow after getting the most up to date database 18 lines up. this allows for more refined control of data flow
            $("#userInfo").html(accountInfo);//set the string accountInfo created above to be userInfo's html
            if(databaseObj!=null&&databaseObj!=undefined&&address!=undefined&&gpsProcessed==false&&databaseObj.users[userObj.uid].helpRequest==undefined){
                    gpsProcessor();//dealing with two asynchronous and separately fired functions and want this to run only when all of this information is available (database and address each being generated from two different functions) and for it to run only once - so I check that all data has been set and then I put in a boolean processed to allow me to control how many times this runs. I also want to make sure that this doesn't run when there is a helprequest active for the user. another modal will pop up and I only want that modal to show. I check for this by checking the databaseObj node specific to the user's helpRequest to see if it is null
            }
        }
    });
});

var gpsProcessed=false;//to make sure the function below doesn't run more than once
function gpsProcessor(){
    gpsProcessed=true;
    if(databaseObj.users[userObj.uid].cameFromOtherPage == false){//will run when the user came from the other page because cameFromOtherPage will be false - address just set by user on the other page, so asking for address again is not necessary
        if(address != databaseObj.users[userObj.uid].address || databaseObj.users[userObj.uid].address == undefined){                          
            if(address!=undefined){
                if(acceptPushed==false&&submitPushed==false){
                    //don't want to run this more than once on any page refresh so I have booleans that will be set to true when buttons on the modal are clicked
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
        }
    }
}

var acceptPushed = false,submitPushed = false;
var lat,long,address,success,geocoder;

function getAddress(){
        //////////////////////////////html5 geolocation api mixed with Goog Maps API Geocoding///////////////////////////////

    var options = {
      enableHighAccuracy: true,//set it to this so that I can access the most accurate gps system available on user's system
      timeout: 5000,
      maximumAge: 0
    };

    //if the getCurrentPosition function was able to get your gps location, then I want to do the following function, including running google maps geocode api

    
    function success(pos) {

        var crd = pos.coords;
        lat = crd.latitude;
        long = crd.longitude;

        /////GOOGLE MAPS GEOCODE API FUNCTIONS - gets address
        geocoder = new google.maps.Geocoder;
        var geopos = {lat:lat,lng:long};
        geocoder.geocode({"location":geopos},function(results,status){
            if(status==="OK"){
                if(results[0]){
                    address = results[0].formatted_address;//formatted address with street address
                    if(databaseObj!=null && databaseObj!=undefined && address!=undefined && gpsProcessed==false && databaseObj.users[userObj.uid].helpRequest==undefined){
                        if(databaseObj.helpRequests!=undefined){
                            if(databaseObj.helpRequests[userObj.uid]==undefined){
                                gpsProcessor();            
                            }
                        } else {
                            gpsProcessor();
                        }
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

/////////////////////////ACCEPT CALCULATED ADDRESS BUTTON
$("#accept").on("click",function(){
    acceptPushed=true;
    if(databaseObj.users[userObj.uid].address!=address){
        //if the address calculated is not the currently stored address for the user, then change the currently stored address and coords to the calculated address and coords - notice that I have set the coords in the database, this step helped a lot when trying to set help request markers on the map instead of setting trying to calculate the geolocation coordinates during that setting - the asynchronous nature of the geo function caused a lot of problems until I did this
        dB.ref("/users/"+userObj.uid+"/coords").set({"lat":lat,"long":long});
        dB.ref("/users/"+userObj.uid+"/address").set(address);
    }
    $("#address").css("display","none");
    $("#accept").css("display","none");
    $("#reject").css("display","none");
    $("#reject").css("display","none");
    $("#reject").css("display","none");
    $("#gpsModal > div > div > div.modal-body.text-center").append("Thank you. Click button to continue.");
    $("#Proceed").css("display","block");
})


$("#reject").on("click",function(){
    //reject the current html5 geolocation api calculated address
    $("#address").css("display","none");
    $("#accept").css("display","none");
    $("#reject").css("display","none");
    if(databaseObj.users[userObj.uid].address!=undefined){
        $("#correctAddress").val(databaseObj.users[userObj.uid].address);
    }
    $("#correctAddress").css("display","block");
    $("#submit").css("display","block");
    $("#instruct").css("display","block");
})

$("#submit").on("click",function(){//when the user clicks reject calculated address and enters a new address and clicks the submit button the following code runs
    submitPushed=true;
    var correctAddress = $("#correctAddress").val();
                
    geocoder = new google.maps.Geocoder;
    geocoder.geocode({"address":correctAddress},function(results,status){//need to get coordinates for marker placement so I need to do another geocoder function here
        if(status==="OK"){
            lat=results[0].geometry.location.lat();
            long=results[0].geometry.location.lng();
            dB.ref("/users/"+userObj.uid+"/coords").set({"lat":lat,"long":long});
            dB.ref("/users/"+userObj.uid+"/address").set(correctAddress);
            //notice that I have set the coords in the database, this step helped a lot when trying to set help request markers on the map instead of setting trying to calculate the geolocation coordinates during that setting - the asynchronous nature of the geo function caused a lot of problems until I did this
        }
    })

    $("#instruct").css("display","none");
    $("#address").css("display","none");
    $("#accept").css("display","none");
    $("#reject").css("display","none");
    $("#correctAddress").css("display","none");
    $("#submit").css("display","none");
    $("#gpsModal > div > div > div.modal-body.text-center").append("Thank you. Click button to continue.");
    $("#Proceed").css("display","block");

})

var statusOpsRan=false,helperOpsRan=false,helperStatusOpsRan=false,helperAlert,helperUID,uid_pair,numMsgs=0,msgNumb = 0,nextmsgcount=1,messagesArray=[],msgArrayCount=0;
//series of functions to check different stuff that is added to firebase        
function requestFunctions(){//checking actions of other user
    dB.ref("/helpRequests/"+userObj.uid).on("value",function(snapshot){//when a new node is added to the helpRequests with the user's uid, this event triggers. this only occurs when the user has submitted a new help request
        if(snapshot.val()!=null && statusOpsRan==false){//adds tools that will serve as operations for the user to manage their new request            
            statusOpsRan = true;//prohibits the setup of the modal from happening more than once
            $("div#userInfo_Rmodal").html(accountInfo.replace("signOut","RsignOut"));//creates a unique id for the signout for the request modal
            $("#pendingRequest").empty();//empties the current contents of the pending request so that if the user submits a new request prior to disconnecting from the page, the modal will reset and add the contents below
            var menuBtn = $("<button class='btn btn-default btn-block' id='tools'>Tools for request: \"" + databaseObj.users[userObj.uid].helpRequest + "\"<i class='fa fa-fw'></i><i class='fa fa-plus-circle'></i></button>");
            //tools button that is a dropdown button - notice use of class collapsed in each of them. this is used to easily animate what happens when tools button above is clicked
            $("#pendingRequest").append(menuBtn);
            //1. chat button
            var DrpBtn1 = $("<button class='collapsed btn btn-block' id='startChat' state='hidden'><i class='fa fa-comments'></i><i class='fa fa-fw'></i>Open Chat<i class='fa fa-fw'></i><i class='fa fa-plus-circle'></button>");
            $("#pendingRequest").append(DrpBtn1);
                //div associated with chat button
                //contains a message area where new messages will be appended
                //an input for messages to be written in
                //and a send button which is used to send messages
            var chatBox = $("<div id='chatBox'><div class='msgContainer'></div><input type='text' class='form-control' id='chatmsg' placeholder='type here'><button id='sendText' class='btn btn-default' ng-click='send()'>Send</button></div>");
            $("#pendingRequest").append(chatBox);
            //2. withdraw request button
            var DrpBtn2 = $("<button class='collapsed btn btn-block' id='withdraw'><i class='fa fa-times-circle-o'></i><i class='fa fa-fw'></i>Withdraw Request</button>");
            $("#pendingRequest").append(DrpBtn2);
            //3. mark request as complete button
            var DrpBtn3 = $("<button class='collapsed btn btn-block' id='complete'><i class='fa fa-check-square-o'></i><i class='fa fa-fw'></i>Mark Complete</button>");
            $("#pendingRequest").append(DrpBtn3);
            //after all of this has been appended to the modal, show the modal
            $("#requestModal").modal({backdrop: 'static', keyboard: false});
            $("#requestModal").modal("show");
            $("#startChat").prop( "disabled", true );
            $("#complete").prop( "disabled", true );
        }
    })
    
    dB.ref("/users/"+userObj.uid+"/helpRequest").on("value",function(snapshot){
        $("#tools").html("Tools for request: \"" + databaseObj.users[userObj.uid].helpRequest + "\"<i class='fa fa-fw'></i><i class='fa fa-plus-circle'></i>");
    })

    dB.ref("/users/"+userObj.uid+"/helpedBy/helperUID").on("value",function(snapshot){
        //when helpedBy is set, the user's request has been picked up by a helper - the helper inserts this data into the requester's users node, so I'm listening for a value change here to determine if the user's request has been picked up and if so I add a note to the requester's modal which has popped up from the previous onvalue change listener
        //again, this is an onvalue change listener that I only want to execute its code block once
        //so I check the value of the snapshot and have a boolean variable that will prevent from the code block being executed more than once
        //this listener is purely to run code when the snapshot value is set to complete
        //this value changes from live to complete by the requester when the requester marks the request as complete

        if(snapshot.val()!=null && helperOpsRan==false){//i.e., there is a UID set here and thus a user has volunteered to help
            helperUID=snapshot.val();
            helperOpsRan=true;
            var helperName = databaseObj.users[snapshot.val()].name;
            var firstName = helperName.substr(0,helperName.indexOf(" "));
            var helperPhone = databaseObj.users[snapshot.val()].phoneNumber;
            var helperEmail = databaseObj.users[snapshot.val()].email;
            uid_pair = helperUID + userObj.uid;
            //alerts user that the requester has a helper  
            helperAlert="<div id='helper'>"+helperName+" has offered to help you. Here is "+firstName+"'s contact information:<p>Phone Number: " + helperPhone + "</p><p>Email: " + helperEmail + "</p><p>Alternatively, you can choose to chat with " + firstName + " through our chat app. Open the tools menu above to go to our chat app.</p></div>"
            $("#pendingRequest").append(helperAlert);
            //requester can no longer withdraw their request once a helper has picked up their request
            $("#withdraw").prop("disabled",true);
            //unlock the chat
            $("#startChat").prop("disabled",false);
            //unlock the mark as complete button
            $("#complete").prop("disabled",false);
        }
    })

    dB.ref("/users/"+userObj.uid+"/helpedBy/helperStatus").on("value",function(snapshot){
        //again, this is an onvalue change listener that I only want to execute its code block once
        //so I check the value of the snapshot and have a boolean variable that will prevent from the code block being executed more than once
        //this listener is purely to run code when the snapshot value is set to complete by the helper
        //this value changes from live to complete by the helper when the helper marks the request as complete
        if(snapshot.val()=="complete" && helperStatusOpsRan==false){
            helperStatusOpsRan=true;
            var helperName = databaseObj.users[helperUID].name;
            var firstName = helperName.substr(0,helperName.indexOf(" "));
            //alerts user that the helper has marked the request as complete
            helperAlert = "<p>Hey, "+firstName+" has marked this request as complete, and has been removed from this request. Mark this request as complete to submit another request.</p>" + helperAlert;
            $("#helper").html(helperAlert);
            //disables buttons and collapses contents of open tools
            $("#startChat").prop( "disabled", true );
            $("#startChat").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
            $("#chatBox").css("display","none");
        }
    })

    //in order for the following listener to work properly, and only be defined when uid_pair is set, I had to wrap it in an if statement to check the value of uid_pair. I didn't want to set uid_pair to "123" or any other number, because I didn't want to be checking the messages node of just any number, but the appropriate uid_pair
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
//////////////////////ADD ACTIONS FOR BUTTONS IN THE REQUEST MODAL
//what happens when the open chat button is clicked
$(document).on("click","#startChat",function(){
    if($(this).attr("state")=="hidden"){
        //the button has a state property that tells whether its associated div is hidden or shown. there are associated animations that I want to run on the chatbox when the chatbox goes from hidden to shown and to add a domlistener for when nodes are added to the msgContainer.
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
function slideToBottom() {
    //found this on stackoverflow - finds position of last msg in msgContainer and does an animation to put the overflow:auto msgContainer scrolled to the last msg
    if($(".msgContainer>.msg").length>0){            
        if(position<$('.msgContainer .msg:last-child').position().top){
            position = $('.msgContainer .msg:last-child').position().top;
            $('.msgContainer').animate({
                scrollTop: position
            }, 'slow');
        }
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

/////////////////////////WITHDRAW BUTTON - WITHDRAW REQUEST FOR HELP - CAN ONLY BE DONE WHEN SOMEONE HAS NOT ACCEPTED REQUEST
$(document).on("click","#withdraw",function(){
    dB.ref("/helpRequests/"+userObj.uid).remove();//new request opened
    dB.ref("/users/"+userObj.uid+"/helpRequest").remove();
    $(".msgContainer").empty();
    $('#requestModal').modal('hide');
    setTimeout(function(){
        statusOpsRan=false;
        helperOpsRan=false;
        helperStatusOpsRan=false;
    },200);
})

/////////////////////////COMPLETE BUTTON - MARK REQUEST AS COMPLETE
//when the requester clicks the complete button on the requesterModal then the following happens
//removes the messages node with uid_pair and sets uid_pair to undefined (to prevent the event listener from running)
//the I reset the messagesArray to an empty array so that messages aren't stored from previous conversations
//I remove the requester's helpRequests key and value and their helpRequest and the helper's helpedBy node
//I empty the msgContainer of all messages from the just closed messages
//then depending on the state of the requester's users node, the helper sets helperStatus to complete

$(document).on("click","#complete",function(){
    var uid_pair_temp = uid_pair;
    uid_pair=undefined;
    dB.ref("/messages/"+uid_pair_temp).remove();
    messagesArray=[];
    msgArrayCount=undefined;
    dB.ref("/helpRequests/"+userObj.uid).remove();//new request opened
    dB.ref("/users/"+userObj.uid+"/helpRequest").remove();//remove helprequest
    dB.ref("/users/"+userObj.uid+"/helpedBy").remove();//remove helper info from node
    $(".msgContainer").empty();
    if(databaseObj.users[helperUID].serving!=null){
        if(databaseObj.users[helperUID].serving.requesterUID==userObj.uid){
            dB.ref("/users/"+helperUID+"/serving/requesterStatus").set("complete");//sets off a listener on helper's page notifying helper that requester have marked the request as complete
        }
    }
    

    /*$('#requestModal').modal("hide");*/
    $('#requestModal').modal("hide");
    //I want to ensure that the firebase changes above go through prior to setting the booleans associated with blocking triggers back to false
    setTimeout(function(){
        statusOpsRan=false;
        helperOpsRan=false;
        helperStatusOpsRan=false;
    },1000);
})

//////////////////////MODAL CSS - CHANGE COLOR OF BACKGROUND DEPENDING ON WHICH MODAL IS SHOWN

//I want different colored backdrops for the modals depending on the modal
// Triggers as soon as 'requestModal' is open
$("#requestModal").on("show.bs.modal", function() {
    setTimeout(function(){        
        $(".modal-backdrop").css("background", "#991E37");//change color of modal-backdrop - red
        $(".modal-backdrop").css("opacity","1");
    },10);
});

// Triggers as soon as 'requestModal' is closed
$('#requestModal').on('hidden.bs.modal', function() {
  $('.modal-backdrop').css("background", "");
    $(".modal-backdrop").css("opacity","0");
});

// Triggers as soon as 'gps' opens
$('#gpsModal').on('show.bs.modal', function() {
    setTimeout(function(){
        $('.modal-backdrop').css("background", "#404040");
        $(".modal-backdrop").css("opacity",".7");
    },10);
});

// Triggers as soon as 'gps' closes
$('#gpsModal').on('hidden.bs.modal', function() {
  $('.modal-backdrop').css("background", "");
  $(".modal-backdrop").css("opacity","0");
});

//after the user enters a request in the input box, they press the requestSubmit button - this the click listener for that
$("#requestSubmit").on("click",function(){//submits request and 
    
    if($("#requestInput").val().length>0){
        dB.ref("/helpRequests/"+userObj.uid).set("open");//new request opened and so I push this to firebase in helpRequests
        dB.ref("/users/"+userObj.uid+"/helpRequest").set($("#requestInput").val()); 
        //additionally, I push the helpRequest to the users node of the requester. this is checked on page load and then opens up a modal with the request
        $("#requestInput").val("");          
    } else {
        $("#errorMsg").html("Please enter a request to submit");
    }

})

//for actions button animation
$(document).on("click","#tools",function(){//adding animations for clicking tools button on requestModal
    if($(".collapsed").hasClass("animation-show")){//if animation-show class is present, then action buttons are shown. I want to collapse them so I swap animation-show for animation-hide, change font awesome icon and after animation complete, make display for action buttons "none"
    $(".collapsed").removeClass("animation-show").addClass("animation-hide");
    $("#startChat").attr("state","hidden");
    $("#chatBox").css("display","none");
    $("#startChat").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
    $("#tools").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-plus-circle");
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//go to other pages

//go to Go Help page

$("p.goHelp").on("click",function(){
    gotoGoHelp();
})

function gotoGoHelp(){
    dB.ref("/users/" + userObj.uid + "/cameFromOtherPage").set(true);
    var win = window.open("helper_page.html","_self");
    win.focus(); 
}

//sign out and go to home page
$(document).on("click","#signOut,#RsignOut",function(){
    firebase.auth().signOut().then(function() {
        var win = window.open("index.html","_self");
        win.focus();     
    }, function(error) {
        console.error('Sign Out Error', error);
    });
})
