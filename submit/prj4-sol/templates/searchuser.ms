
<!DOCTYPE html> 
<html>
  <head>
    <title>User Search</title>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <h1>Users Search</h1>
    <p class="error">{{Error}}</p>
    <p>
      Please fill in one or more of the following fields
    </p>
    <form method="GET" action="/search/users">
      <label for="userId">User ID</label>
      <div>
	<input name="id" id="userId" value="">
	<div class="error" id="userIdErr"></div>
      </div>
      <label for="email">User Email</label>
      <div>
	<input name="email" id="email" value="{{email}}">
	<div class="error"></div>
      </div>
      <label for="firstName">First Name</label>
      <div>
	<input name="firstName" id="firstName" value="{{firstName}}">
	<div class="error"></div>
      </div>
      <label for="lastName">Last Name</label>
      <div>
	<input name="lastName" id="lastName" value="{{lastName}}">
	<div class="error"></div>
      </div>
      <label for="creationTime">ISO Creation Time</label>
      <div>
	<input name="creationTime" id="creationTime" value="{{creationTime}}">
	<div class="error"></div>
      </div>
      &nbsp;<input name="submit" type="submit" value="search" class="control">
    </form> 
    <footer>
      <ul>
        <li><a href="/users">List Users</a></li>
        <li><a href="/search/users">Search Users</a></li>
      </ul>
    </footer>
  </body>
</html>

