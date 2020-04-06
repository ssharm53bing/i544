import assert from 'assert';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import querystring from 'querystring';

import BlogError from './blog-error.js';
import Blog from './blog544.js';

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

export default function serve(port, meta, model) {
  const app = express();
  app.locals.port = port;
  app.locals.meta = meta;
  app.locals.model = model;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
  
 
}

  function setupRoutes(app) {
  app.use(cors());
  app.use(bodyParser.json());
  app.get('/users/:id', async function (req, res) {
	  var users =   await getObjectHandler('users',req.params, app,res);
		const selflink = selfUrl(req);
	   users[0].links = selflink ;
	  const finalResult = {users};
	  res.json(finalResult);  
	  
	   
  
});

 app.get('/articles/:id', async function (req, res) {
	  var articles = await getObjectHandler('articles',req.params,app,res);
	    const selflink = selfUrl(req);
	   articles[0].links = selflink ;
	  const finalResult = {articles};
	  res.json(finalResult);
  
});

 app.get('/comments/:id', async function (req, res) {
	  const comments = await getObjectHandler('comments',req.params,app,res);
	  const selflink = selfUrl(req);
	  comments[0].links = selflink ;
	  const finalResult = {comments};
	  res.json(finalResult);
  
});

app.get('/', function (req, res) {
	const meta = app.locals.meta;
	var links=[];
	const selfLink = selfUrl(req);
	links.push(selfLink);
	const metaLink = requestUrl(req) + '/meta';
	const metaUrl = {"rel":"describedby","name":"meta","url":metaLink};
	links.push(metaUrl);
	for(const category in meta){
		var url = requestUrl(req);
		url = url + '/'+ category;
		const categoryUrl = {"rel":"collection","name":category,"url":url}
		links.push(categoryUrl);
	}
	res.json({links});
});

  app.get('/meta', function (req, res) {
  var selfLink = {"links":selfUrl(req)};
  var mymeta = [];
  var metadata = app.locals.meta;
  mymeta.push(metadata);
  mymeta.push(selfLink);
  res.json(mymeta);
});

  app.get('/users', async function (req, res) {
  const result = await getCategoryHandler("users",req,app,res);
  res.json(result);
});

  app.get('/articles', async function (req, res) {
  const result = await getCategoryHandler("articles",req,app,res);
  res.json(result);
});

  app.get('/comments', async function (req, res) {
  const result = await getCategoryHandler("comments",req,app,res);
  res.json(result);
});

app.delete('/users/:id', async function (req, res) {
  const result = await deleteObjectHandler("users",req.params,app);
  res.json(result);
});

app.delete('/articles/:id', async function (req, res) {
  const result = await deleteObjectHandler("articles",req.params,app);
  res.json(result);
});

app.delete('/comments/:id', async function (req, res) {
  const result = await deleteObjectHandler("comments",req.params,app);
  res.json(result);
});

app.delete('/users', async function (req, res,next) {
  const result = await deleteObjectHandler("users",req.query,app);
  res.json(result);
});

app.delete('/articles', async function (req, res,next) {
  const result = await deleteObjectHandler("articles",req.query,app);
  res.json(result);
});

app.delete('/comments', async function (req, res,next) {
	
  const result = await deleteObjectHandler("comments",req.query,app);
  res.json(result);
});

app.patch('/users/:id', async function (req, res,next) {

  const result = await updateObjectHandler("users",req,res,app,next);
  res.json(result);
});

app.patch('/articles/:id', async function (req, res,next) {

  const result = await updateObjectHandler("articles",req,res,app,next);
  res.json(result);
});

app.patch('/comments/:id', async function (req, res,next) {

  const result = await updateObjectHandler("comments",req,res,app,next);
  res.json(result);
  
});




app.post('/users', async function (req, res,next) {

  const result = await createObjectHandler("users",req,res,app,next);
  var selfLink = selfUrl(req);
  var selfLinkHeader = selfLink.href+'/'+result;
  res.append("Location",selfLinkHeader);
  res.json({});
});

app.post('/articles', async function (req, res,next) {

  const result = await createObjectHandler("articles",req,res,app,next);
    var selfLink = selfUrl(req);
  var selfLinkHeader = selfLink.href+'/'+result;
  res.append("Location",selfLinkHeader);
  res.json({});
});

app.post('/comments', async function (req, res,next) {

  const result = await createObjectHandler("comments",req,res,app,next);
   var selfLink = selfUrl(req);
  var selfLinkHeader = selfLink.href+'/'+result;
  res.append("Location",selfLinkHeader);
  res.json({});
});


	
	

  //@TODO
}

/****************************** Handlers *******************************/

async function getObjectHandler(category,obj,app,res){
	const meta = app.locals.meta;
	const options = app.locals.model.options;
	const blogObj =  await Blog.make(meta,options);
	try{
		const result =  await blogObj.find(category,obj);	
		if(result.length === 0){
			//res.json({})
			var error = [];
			error.push('status:404');
			error.push('message:requested resource not found');
			res.json(error);
		}
		else{
		return result;	
		}
			
		
		 
	}catch(errors){
		var errorjson = mapError(errors);
		res.status(errorjson.status);
		res.json(errorjson);
	}
}

async function getCategoryHandler(category,req,app,resp){
	const meta = app.locals.meta;
	const options = app.locals.model.options;
	const blogObj =  await Blog.make(meta,options);
	const res =  await blogObj.find(category,req.query);	
	var count = 0;
	for(const i in res){
		var url = selfUrl(req);
		url.href=url.href + '/' +res[i].id;
		res[i].links = url;
		count++;
	}
	var selfURL = selfUrl(req);
	selfURL.href = selfURL.href + '?' + querystring.stringify(req.query);
	
	if(req.query._index===undefined){
		req.query._index = 0;
	}
	req.query._index=parseInt(req.query._index)+count;
	const nextres = await blogObj.find(category,req.query);
	if(nextres.length === 0 ){
	}else{
		var nextUrl = selfUrl(req);
		var newQuery = querystring.stringify(req.query);
		nextUrl.href=nextUrl.href + '?' +newQuery;
		nextUrl.rel="next";
		nextUrl.name="next";
		res.push({"next":req.query._index});
	}
	if(req.query._index>count){
		req.query._index = req.query._index-2*count;
		var prevUrl = selfUrl(req);
		var newQuery = querystring.stringify(req.query);
		prevUrl.href=prevUrl.href + '?' +newQuery;
		prevUrl.rel="prev";
		prevUrl.name="prev";
		res.push({"prev":req.query._index});
	}
	var links = {selfURL,nextUrl,prevUrl};
	
	res.push({links});
	
	
	return res;
}

async function deleteObjectHandler(category, params, app){
	const meta = app.locals.meta;
	const options = app.locals.model.options;
	const blogObj =  await Blog.make(meta,options);
	try{
		const result = await blogObj.remove(category,params);
		return {};
	}catch(errors){
		return mapError(errors);
	}
	 
}

async function updateObjectHandler(category, req,res, app,next){
	const meta = app.locals.meta;
	const options = app.locals.model.options;
	var updatequery = mergeJSON(req.params,req.body);
	const blogObj =  await Blog.make(meta,options);
	try{
		var result = await blogObj.update(category,updatequery);	
		return {};
	}catch(errors){
		var errorjson = mapError(errors);
		res.status(errorjson.status);
		res.json(errorjson);
		//return mapError(errors);
	}
	 
}

async function createObjectHandler(category, req,res, app,next){
	const meta = app.locals.meta;
	const options = app.locals.model.options;
	const blogObj =  await Blog.make(meta,options);
	try{
		var result = await blogObj.create(category,req.body);	
		 return result;
	}catch(errors){
		var errorjson = mapError(errors);
		res.status(errorjson.status);
		res.json(errorjson);
	}
	 
}


//@TODO

/**************************** Error Handling ***************************/

/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */ 
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  };
}

/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      next(err);
    }
  };
}

const ERROR_MAP = {
  BAD_CATEGORY: NOT_FOUND,
  EXISTS: CONFLICT,
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapError(err) {
  console.error(err);
  return (err instanceof Array && err.length > 0 && err[0] instanceof BlogError)
    ? { status: (ERROR_MAP[err[0].code] || BAD_REQUEST),
	code: err[0].code,
	message: err.map(e => e.message).join('; '),
      }
    : { status: SERVER_ERROR,
	code: 'INTERNAL',
	message: err.toString()
      };
} 

/****************************** Utilities ******************************/

/** Return original URL for req (excluding query params)
 *  Ensures that url does not end with a /
 */
function requestUrl(req) {
  const port = req.app.locals.port;
  const url = req.originalUrl.replace(/\/?(\?.*)?$/, '');
  return `${req.protocol}://${req.hostname}:${port}${url}`;
}


const DEFAULT_COUNT = 5;

function selfUrl(req){
	const selfLink = {};
	selfLink.href = requestUrl(req);
	selfLink.name = 'self';
	selfLink.rel = 'self';
	return selfLink;
}

function mergeJSON(dest, src) {
for(var key in src) {
dest[key] = src[key];
}
return dest;
}
//@TODO
