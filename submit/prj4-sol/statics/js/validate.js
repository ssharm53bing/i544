

function checkUser(){
	var userid = document.getElementById('userId').value;
	if(userid===""){
	}else{
		var xhttp = new XMLHttpRequest();
  		xhttp.onreadystatechange = function() {
    		if (this.readyState == 4 && this.status == 200) {
			if(this.responseText=="usernotfound"){
			document.querySelector("#userIdErr").innerHTML="There is no user with id " +userid;				
		}
      		    
			
    	}
  };
  	xhttp.open("GET", "/search/users?submit=checkuserexist&id="+userid, true);
  	xhttp.send();
	}
}
