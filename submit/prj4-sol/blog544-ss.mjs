//-*- mode: javascript -*-

import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import Path from 'path';
import mustache from 'mustache';
import querystring from 'querystring';
import blog544ws from './blog544-ws.mjs';

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

//emulate commonjs __dirname in this ES6 module
const __dirname = Path.dirname(new URL(import.meta.url).pathname);

export default function serve(port, ws) {
  const app = express();
  app.locals.port = port;
  app.locals.ws = ws;       //web service wrapper
  process.chdir(__dirname); //so paths relative to this dir work
  setupTemplates(app);
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

/******************************** Routes *******************************/

function setupRoutes(app) {
  app.use('/', express.static(STATIC_DIR));
  //@TODO add routes to handlers
  app.get('/users', async function (req, res) {
  const result = await listUserHandler(req,res,app);
  res.json(result);
 });	

  app.get('/search/users', async function (req, res) {
  const result = await searchUserHandler(req,res,app);
  res.json(result);
 });
  app.use(doErrors(app)); //must be last   
}

/****************************** Handlers *******************************/

//@TODO: add handlers
async function listUserHandler(req,res,app){
	const blog544web = await blog544ws.make("http://zdu.binghamton.edu:2345");
	
	var result = await blog544web.list("users", req.query);
	if(result.prev === 0 ){
		result.prev = '0';	
	}
	const html = doMustache(app,`listuser`,result);
	res.send(html);
}

async function searchUserHandler(req,res,app){
	const blog544web = await blog544ws.make("http://zdu.binghamton.edu:2345");
	var count =0;
	if(req.query.submit === 'search'){
		var queryObject={};
		for(var key in req.query){
			if(req.query[key]!="" && req.query[key]!="search"){
				queryObject[key] = req.query[key];	
				count++;		
			}	
		}
		if(count === 0){
			const html = doMustache(app,`searchuser`,{"Error":"One or more values must be specified"});
			res.send(html);					
		}
		if(req.query.email!="" || req.query.creationTime!=""){
			console.log("Inside Email");
			var match = 0;
			var outputerror={};
			var emailError={};
			var creationError={};
			var emailadd = req.query.email;
			if(emailadd!=""){	
			const regex = /^\S+@\S+\.\S+$/;
			 if(!emailadd.match(regex)){
				console.log("Email Time Error");
				match = 1;
				console.log("Email not valid");
				 queryObject["Emailerror"] = "bad value "+emailadd+" the user email fields must be of the 				form id@domain for users find";
				}
			}
			if(req.query.creationTime!=""){
				
				console.log("Inside create time error");
				var createTime = req.query.creationTime;
				const newregex = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/;
				if(!createTime.match(newregex)){
				queryObject["Creationerror"] = "bad value "+createTime+"; the user creation time must be a 	valid 					 ISO-8601 date-time for users find";
				 match = 1;
				 console.log("not matched");
				 
			}
		}
			if(match===1){			
				console.log("Searching uSers");	
				const html = doMustache(app,`searchuser`,queryObject);
				res.send(html);
				res.end();
			}			
			
		}
		var result = await blog544web.list("users", queryObject);
		console.log(result.next);
		
		if(Object.keys(result.users).length === 0){
			console.log("result 0");
			queryObject["Error"] = "No users found for specified query"
			const html = doMustache(app,`searchuser`,queryObject);
			res.send(html);
			res.end();	
		}
		console.log("Sending Result");
		console.log("Hello1");
		if(result.prev === 0){
			
			result.prev = 1;		
		}
		const html = doMustache(app,`listuser`,result);
		res.send(html);	
		
	} else if(req.query.submit==="checkuserexist"){
		var queryObject={};
		for(var key in req.query){
			if(req.query[key]!="" && req.query[key]!="checkuserexist"){
				queryObject[key] = req.query[key];	
						
			}	
		}
		var result = await blog544web.list("users", queryObject);
		if(Object.keys(result.users).length === 0){
			queryObject["Error"] = "No users found for specified query"
			const html = doMustache(app,`searchuser`,queryObject);
			res.send("usernotfound");
			res.end();	
		}else{
			res.send("userfound");
		}
	}else{
		const html = doMustache(app,`searchuser`,{});
		console.log("Hello");
		res.send(html);
	}

}

function doErrors(app) {
  return async function(err, req, res, next) {
    console.log('doErrors()');
    const errors = [ `Server error` ];
    const html = doMustache(app, `errors`, {errors, });
    res.send(html);
    console.error(err);
  };
}

/************************ General Utilities ****************************/

/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      console.log('errorWrap()');
      next(err);
    }
  };
}

function isNonEmpty(v) {
  return (v !== undefined) && v.trim().length > 0;
}

/************************ Mustache Utilities ***************************/

function doMustache(app, templateId, view) {
  const templates = { footer: app.templates.footer };
  return mustache.render(app.templates[templateId], view, templates);
}

function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}

function extend(dest,src){
	for(var key in src){
		dest[key] = src[key];	
}
	return dest;
}
