////////////////CONFIGURE FIREBASE, GET INSTANCE OF REAL-TIME DATABASE AND CHECK IF SOMEONE IS LOGGED INTO SITE - IF SO FORMAT HTML
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
	var provider_fb = new firebase.auth.FacebookAuthProvider();//facebook auth firebase instance
	var provider_goog = new firebase.auth.GoogleAuthProvider();//google auth firebase instance
	var userLoggedIn=false;
	var myRefToDisconnect;//used to determine if user is online at any time

	var userObj;//will be user object with all kinds of datas
	var databaseObj;//to allow easy use of the database, I am storing the database in a variable that is updated on every value change so that we are always working with the most up to date database
	//get instance of real-time database
	dB.ref().on("value",function(snapshot){
		databaseObj = snapshot.toJSON();
		//firebase function to check whether user is logged into site
	Auth.onAuthStateChanged(function(user) {
	  	if (user) {//will return non-null if there is a user logged in 
	    	userObj = user;//get the returned object for the auth, which has the logged in user's information, namely uid
	    	userLoggedIn=true;//used below to state user is logged in and to proceed to next page
			if(databaseObj!=null){//if there is nothing in the database , then snapshot is null
		    	myRefToDisconnect = dB.ref("/users/" + userObj.uid +"/iconnect")
		    	myRefToDisconnect.set(true);
		    	myRefToDisconnect.onDisconnect().set("disconnected");			    	
	    		$("#Welcome").html("Welcome back, " + databaseObj.users[userObj.uid].name + "<p id='signOut'>(Not " + databaseObj.users[userObj.uid].name + "? Click here to sign out.)</p>");//provides welcome greeting to logged in user
	    	}
	  	} else {
	    	userLoggedIn=false;//used below to state user is not logged in and to prompt user with a modal
	  	}
	});
	});

//////////////////////////////////HOME PAGE LOAD/////////////////////////////////////

var pageToLoad;

//listener for when helper button is clicked on home screen
$("#helper").on("click",function(){
	//checks to see if user is logged in prior to proceeding to helper page
	if(!userLoggedIn){//userLoggedIn is set above in OnAuthChange
		$("#loginModal").modal({backdrop: 'static', keyboard: false}); //if user not logged in, show modal for user to log in
		$("#loginModal").modal("show");
		pageToLoad = "helper_page.html";//store page to load so that user can be directed to it after login
	} else {//if user is logged in
		dB.ref("/users/" + userObj.uid + "/cameFromOtherPage").set(false);
		var win = window.open("helper_page.html","_self");
		win.focus();
	}

})

//listener for when help button is clicked on home screen
$("#help").on("click",function(){
	//checks to see if user is logged in prior to proceeding to helper page
	if(!userLoggedIn){//userLoggedIn is set above in OnAuthChange
		$("#loginModal").modal({backdrop: 'static', keyboard: false}); //if user not logged in, show modal for user to log in
		$("#loginModal").modal("show");
		pageToLoad = "help_page.html";//store page to load so that user can be directed to it after login
	} else {
		dB.ref("/users/" + userObj.uid + "/cameFromOtherPage").set(false);
		var win = window.open("help_page.html","_self");
		win.focus();
	}

})

//////////////////////////////////MODAL CODE/////////////////////////////////////

//button click listener for sign in button that is presented when modal opens
//this button opens up the sign in options
	$("#sign-in").on("click",function(){
		signInUp("si");
	})

	//button click listener for sign up button that is presented when modal opens
	//this button opens up the sign up options
	$("#sign-up").on("click",function(){
		signInUp("su");
	})

	//function that runs when "sign up" or "sign in" button is clicked
	//reformats the form depending on which button the user clicks, the sign in or the sign up button
	function signInUp(type){
		var othertype = type=="su"? "si":"su";
		$("#sign-in").css("display","inline");
		$("#sign-in").removeClass("btn-block");
		$("#sign-in").css("width","49%");
		$("#sign-up").css("display","inline");
		$("#sign-up").removeClass("btn-block");
		$("#sign-up").css("width","49%");
		$("#facebook-"+othertype).css("display","none");
		$("#google-"+othertype).css("display","none");
		$("#form-"+othertype).css("display","none");
		$("#facebook-"+type).css("display","block");
		$("#google-"+type).css("display","block");
		$("#form-"+type).css("display","block");
		$("#sign-up-form").css("display","none");
		$("#sign-in-form").css("display","none");
		$("#errorMsg").empty();
	}

	//when facebook login button is clicked for sign up
	$("#facebook-su").on("click",function(){
		federatedLogin("su",provider_fb);
})

	//when facebook login button is clicked for sign in
	$("#facebook-si").on("click",function(){
		federatedLogin("si",provider_fb);
})

	//when google login button is clicked for sign up
	$("#google-su").on("click",function(){
		federatedLogin("su",provider_goog);
})

	//when google login button is clicked for sign in
	$("#google-si").on("click",function(){
		federatedLogin("si",provider_goog);
})

	var FederatedSignIn_flag = false; //needed to distinguish sign-ups from sign-ins
	//function that runs for federated logins (google and facebook), complete with error handling
	function federatedLogin(type,provider){
  	
  	Auth.signInWithPopup(provider).then(function(result) {//firebase auth method for signing in with facebook or google
	  // This gives you a Federated Provider Access Token. You can use it to access the Facebook API.
	  var token = result.credential.accessToken;
	  // The signed-in user info.
	  userObj = result.user;
	  // ...
	  //google and facebook doesn't provide phone number, so we need to ask for this information from user
	  //the code below sets modal to show instructions to user to enter phone number when signing up
	  $("#errorMsg").empty();
	  var type_ext = type=="su" ? "up":"in";
	  $("#sign-"+type_ext+"-form").css("display","none");//if the sign in/up form is showing when button is clicked, then when the log-in is successful, hide the form
	  FederatedSignIn_flag = type == "su" ? false : true;
	  if(databaseObj == null || databaseObj == undefined){//when database is empty (i.e. brand new)
	  		//do a lot of css to hide components of css and show others
	  		//general purpose is to get modal to ask for user's phone so that we can get the remaining information that is not provided by auth log in
		  	$("#sign-"+type_ext).css("display","none");
		  	if(provider.providerId==="google.com"){$("#facebook-"+type).css("display","none");} else {$("#google-"+type).css("display","none");}
		  	$("#form-"+type).css("display","none");
		  	$("form#sign-in-form>p").css("display","none");
		  	$("form#sign-up-form>p").css("display","none");
			$("form#sign-up-form").prepend("<p>In order to best use our services, please provide a phone number below:</p>");//prompts user as to why their phone number is being asked for
		  	$("form#sign-up-form").prepend("<p>Welcome, " + userObj.displayName + "</p>");
		  	$("form#sign-up-form").css("display","block");
		  	$("form#sign-up-form>#instructions").css("display","none");
		  	$("form#sign-up-form>#firstName-su").css("display","none");
		  	$("form#sign-up-form>#lastName-su").css("display","none");
		  	$(".awesomplete").css("display","none");

		  	$("form#sign-up-form>#email-su").css("display","none");
			$("form#sign-up-form>#password-su").css("display","none");
		  	$("form#sign-up-form>#phoneNumber-su").css("display","block");
		  	$("form#sign-up-form>#submit-su").html("Set Phone");//sets submit button to read Set Phone

	  } else if(!(userObj.uid in databaseObj.users)){//checks whether user who just logged in is in database by using uid - users is a set of uids that have as values objects with user information - all publicly accessible in our app's ui
	  //because this is pretty much the same as the above boolean check, i use the same css setting changes to generate the request for a phone number
	  	$("#sign-"+type_ext).css("display","none");
	  	if(provider.providerId==="google.com"){$("#facebook-"+type).css("display","none");} else {$("#google-"+type).css("display","none");}
	  	$("#form-"+type).css("display","none");
	  	$("form#sign-up-form>p").css("display","none");
		$("form#sign-up-form").prepend("<p>In order to best use our services, please provide a phone number below:</p>");			  	
	  	$("form#sign-up-form").prepend("<p>Welcome, " + userObj.displayName + "</p>");
	  	$("form#sign-up-form").css("display","block");
	  	$("form#sign-up-form>#instructions").css("display","none");
	  	$("form#sign-up-form>#firstName-su").css("display","none");
	  	$("form#sign-up-form>#lastName-su").css("display","none");
	  	$("form#sign-up-form>#email-su").css("display","none");
		$("form#sign-up-form>#password-su").css("display","none");
	  	$("form#sign-up-form>#phoneNumber-su").css("display","block");
	  	$("form#sign-up-form>#submit-su").html("Set Phone");//sets submit button to read Set Phone
	  } else {//user is in database
	  	$("body").append("<p>Welcome, " + userObj.displayName + "</p>");//personal welcome message
	  	$("#sign-in").css("display","none");
		$("#sign-up").css("display","none");
		$("#facebook-su").css("display","none");
		$("#google-su").css("display","none");
	  	$("#form-su").css("display","none");
		$("#facebook-si").css("display","none");
		$("#google-si").css("display","none");
	  	$("#form-si").css("display","none");
	  	$("form#sign-in-form").css("display","none");
	  	$("form#sign-up-form").css("display","none");
	  	$(".awesomplete").css("display","none");
	  	//displays thank you for signing in message and a notice of asking for gps on next page
	  	$(".modal-body").append("<p>Thank you, " + userObj.displayName + ", please click the button below to continue to site.</p><br><p>Please note that, on the next page, you will be asked to allow our website to access your location. This helps us be able to match you with people that are in your vicinity.</p>");
	  	$("#logInComplete").css("display","block");
	  }
	}).catch(function(error) {
	  // Handle Errors here.
	  var errorCode = error.code;
	  var errorMessage = error.message;
	  // The email of the user's account used.
	  var email = error.email;
	  // The firebase.auth.AuthCredential type that was used.
	  var credential = error.credential;
	  $("#errorMsg").empty();
	  $("#errorMsg").append(errorMessage);
	});
}


$("#form-su").on("click",function(){//click listener for sign up with email and password
	$("#sign-up-form").css("display","block");//shows sign up form
	$("input").css("display","block");
	$("#sign-in-form").css("display","none");
	$("#errorMsg").empty();
})

$("#form-si").on("click",function(){//click listener for sign in with email and password
	$("#sign-in-form").css("display","block");//shows sign in form
	$("input").css("display","block");
	$("#sign-up-form").css("display","none");
	$("#errorMsg").empty();
})


$("#submit-su").on("click",function(){//used for both sign up form and for getting phone from people signing up with facebook or google
	if($("#submit-su").html()!="Set Phone"){//federated signups will push this button when providing a phone number - when this occurs, the html on the button #submit-su will be "Set Phone". so here we check whether the submit su button is being used in part of the user form for signing up with email and password of if it is being used as a part of a federated signup
	//code that will execute if it is an email-password sign up
		if($("#firstName-su").val()!=="" && $("#lastName-su").val()!=="" && $("#email-su").val() !== "" && $("#phoneNumber-su").val() !=="" && $("#password-su").val() !== ""){
			if($("#phoneNumber-su").val().length == 12){
				submitForm("su");
			} else {//phone number provided was not valid
				$("#errorMsg").empty();
				$("#errorMsg").append("<p>Please provide a valid phone number.</p>");	
			}
		} else {//user did not fill all fields correctly
			$("#errorMsg").empty();
			$("#errorMsg").append("<p>Not all fields are filled out correctly. Please fill all forms.</p>");
		}
	} else { //code that will execute if it is a federated sign up
		if($("#phoneNumber-su").val().length == 12){
			pushPhone();//add phone and other items to database of users
		} else {
			$("#errorMsg").empty();//return a warning that the user entry for phone number was not valid
			$("#errorMsg").append("<p>Please provide a valid phone number.</p>");	
		}
	}
})

function pushPhone(){//for federated signups - we need to get a phone number from user and federated signups don't provide this information
//if this function runs, it is due to the user login being successful and the user providing a valid phone
//provide further instructions for user to use site
	var type = FederatedSignIn_flag == true ? "si" : "su";
	$("#signUpInButtons").css("display","none");
	$("#sign-up-form").css("display","none");
	$("#sign-in-form").css("display","none");
	$(".modal-body>button").css("display","none");
	$(".modal-body").append("<p>Thank you, " + userObj.displayName + ", please click the button below to continue to site.</p><br><p>Please note that on the next page, you will be asked to allow our website to access your location. This helps us be able to match you with people that are in your vicinity.</p>");
	$("#logInComplete").css("display","block");
	//since this is a new log-in, create a new node for node users that will pass name, phone and email information about user to the user's uid


		dB.ref("/users/"+userObj.uid).set({
			iconnect: true,
			name : userObj.displayName,
			phoneNumber: $("#phoneNumber-su").val(),
			email: userObj.email
		});


}

function submitForm(type){//for user form signups - gets values from input fields
		var email = $("#email-" + type).val();
		var password = $("#password-" + type).val();
		var name = $("#firstName-su").val() + " " + $("#lastName-su").val();
		var phoneNumber = $("#phoneNumber-su").val();
		var errorCode="";
		$("#errorMsg").empty();//removes error message from modal
  	Auth.createUserWithEmailAndPassword(email, password).then(function(user){
  		//creates user and shows message explaining that gps will be asked for on next page
  		$("#logInComplete").css("display","block");
		$("#signUpInButtons").css("display","none");
		$("#sign-up-form").css("display","none");
		$(".modal-body>button").css("display","none");
		$(".modal-body").append("<p>Thank you, " + name + ", please click the button below to continue to site.</p><br><p>Please note that on the next page, you will be asked to allow our website to access your location. This helps us be able to match you with people that are in your vicinity.</p>");
		dB.ref("/users/"+user.uid).set({//sets preliminary information gathered in user form to firebase in the node users/the user's uid - since uid is a primary key for the user, this makes sense to set data here since uid will always be unique to the particular user
			name : name,
			phoneNumber: phoneNumber,
			email: email
		});
  	}).catch(function(error) {//for error handling - typically only happens when user already has an account with site
		  // Handle Errors here.
		  errorCode = error.code;
		  var errorMessage = error.message;
		  if(errorMessage == "The email address is already in use by another account."){
		  	
		  	$("#errorMsg").append("<p>" + errorMessage + " If this is your account, please click the sign in button to sign in.</p>")
		  } else {

		  	$("#errorMsg").append("<p>" + errorMessage + " Please try again.</p>")
		  }
	});
}

//button click listener for sign in form
//if email and password are filled in will return my personalized validation
$("#submit-si").on("click",function(){
	$("#errorMsg").empty();
	if($("#email-si").val() !== "" && $("#password-si").val() !== ""){
		submitForm_si();
	} else {
		
		$("#errorMsg").append("<p>Not all fields are filled out correctly. Please fill all forms.</p>");
	}
})

//function that runs whenever the user signs in with email and password
function submitForm_si(){//sign-in function for email/password
	var email = $("#email-si").val();
		var password = $("#password-si").val();
		//firebase sign in with email and password function
		//returns user - used to personal statement on post sign in modal
		firebase.auth().signInWithEmailAndPassword(email, password).then(function(user){
			$("#signUpInButtons").css("display","none");
		$("#sign-in-form").css("display","none");
		$(".modal-body>button").css("display","none");
		$(".modal-body").append("<p>Thank you, " + databaseObj.users[user.uid].name + ", please click the button below to continue to site.</p><br><p>Please note that on the next page, you will be asked to allow our website to access your location. This helps us be able to match you with people that are more readily available to help.</p>");
		$("#logInComplete").css("display","block");
		}).catch(function(error) {//for error handling - shows firebase auth error warning
	  // Handle Errors here.
	  var errorCode = error.code;
	  var errorMessage = error.message;
	  // ...
	  $("#errorMsg").empty();
	  $("#errorMsg").append(errorMessage);
	});
}

////////////////////////////////validation for phone number entry
////////////////////////////////checking keys on keydown event

//keydown listener for phone number input element 
$("#phoneNumber-su").on("keydown",function(){
	phoneNumbVal($(this).val(),"#phoneNumber-su");
})

//USED IN FORM VALIDATION - won't accept anything but number keys in this field

//phone number validation - what I am doing here is making sure that the key is either from above the letters or in the number pad

phoneNumbVal = function(numb_forValidation,id){
	var e = event || window.event;  // get event object
	var key = e.keyCode || e.which;

	if (key >= 48 && key <= 57 || key >= 96 && key <= 105) {     
		if(numb_forValidation.length==3||numb_forValidation.length==7){
			$(id).val($(id).val()+"-");
		} else if(numb_forValidation.length == 12){
		   	if (e.preventDefault){
				e.preventDefault();
		        e.returnValue = false;
		    }				
		}
	} else if (key==8){//if key code is a backspace
		if(numb_forValidation.length==5||numb_forValidation.length==9){
			//want to make sure that if the key is a backspace that we handle the 5th and the 9th characters in the phone number (the numbers after the "-"s)
			$(id).val($(id).val().substr(0,$(id).val().length-1));//when it is these numbers, then we want to remove not just the number, but the number after it
		}			
	} else if (key!=9){//tab key
	   	if (e.preventDefault){//I want to prevent the default behavior of what the tab key does
			e.preventDefault();
	        e.returnValue = false;
	    }
	}
}



//after signing in or up, user is prompted with the logincomplete button to proceed to next page
//this code defines what happens when the button is clicked
$("#logInComplete").on("click",function(){
	dB.ref("/users/" + userObj.uid + "/cameFromOtherPage").set(false);//creates a value in firebase that allows for avoidance of asking the user twice about correct address when switching between go Help and get Help pages. here it is set to false because user is coming from home page
	myRefToDisconnect = dB.ref("/users/" + userObj.uid +"/iconnect")//to be used to tell that the user is online
	myRefToDisconnect.set(true);
	myRefToDisconnect.onDisconnect().set("disconnected");
	var win = window.open(pageToLoad,"_self");//pageToLoad is set when the user clicks the go help or the get help button. it will be set to either helper_page or help_page. clicking the logInComplete button loads the page
	win.focus();
})

//one of the libraries that I used.  This library attaches to input text fields, and allows autocomplete based on user input. here it is used to autocomplete emails. As soon as the @ is input, it provides a list (the list below with email providers) that autocompletes the email
//this code is pretty much straight from documentation on awesomplete's site
new Awesomplete('input[type="email"]', {
	list: ["aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com", "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com", "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk"],
	data: function (text, input) {
		return input.slice(0, input.indexOf("@")) + "@" + text;
	},
	filter: Awesomplete.FILTER_STARTSWITH
});

//signs out user
$(document).on("click","#signOut",function(){
    firebase.auth().signOut().then(function() {
        var win = window.open("index.html","_self");
        win.focus();     
    }, function(error) {
        console.error('Sign Out Error', error);
    });
})
