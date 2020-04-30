<!DOCTYPE html>
<html>
  <head>
    <title>Users List</title>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
	<h1>Users List</h1>
    	<p class="error"></p>
    	<table>
		<tbody>
		<tr>
			<th>UserID</th>
			<th>Name</th>
			<th>Email</th>
			<th>Roles</th>
			<th>CreationTime</th>
			<th>Update Time</th>
		</tr>
		{{#users}}
		<tr>
			<td>{{id}}</td>
			<td>{{firstName}}</td>
			<td>{{email}}</td>
			<td>{{roles}}</td>
			<td>{{creationTime}}</td>
			<td>{{updateTime}}</td>			
		</tr>
		{{/users}}
		</tbody>
	</table>

      <div class="scroll">
      	{{#prev}}		  
		<a href="/users?_index={{prev}}" rel="prev">&lt;&lt;</a>		
	{{/prev}}
	
	{{#next}}      
	<a href="/users?_index={{next}}" rel="next">&gt;&gt;</a>
      	{{/next}}
      </div>

    <footer>
      <ul>
        <li><a href="/users">List Users</a></li>
        <li><a href="/search/users">Search Users</a></li>
      </ul>
    </footer>

  </body>
</html>

