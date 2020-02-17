// -*- mode: JavaScript; -*-

import BlogError from './blog-error.js';
import Validator from './validator.js';

//debugger; //uncomment to force loading into chrome debugger

/**
A blog contains users, articles and comments.  Each user can have
multiple Role's from [ 'admin', 'author', 'commenter' ]. An author can
create/update/remove articles.  A commenter can comment on a specific
article.

Errors
======

BAD_CATEGORY:
  Category is not one of 'articles', 'comments', 'users'.

BAD_FIELD:
  An object contains an unknown field name or a forbidden field.

BAD_FIELD_VALUE:
  The value of a field does not meet its specs.

BAD_ID:
  Object not found for specified id for update/remove
  Object being removed is referenced by another category.
  Other category object being referenced does not exist (for example,
  authorId in an article refers to a non-existent user).

EXISTS:
  An object being created already exists with the same id.

MISSING_FIELD:
  The value of a required field is not specified.

*/
var userMap = new Map();
var articleMap = new Map();
var commentMap = new Map();
var userFound = 0;
var authorIDFound = 0;
var commenterIDFound=0;
export default class Blog544 {
	
  constructor(meta, options, data) {
	this.data = data;
	if(!data){
		this.data = data;
	}
	else{
	this.meta = meta;
    this.options = options;
    this.validator = new Validator(meta);
	}    
  }

  static async make(meta, options) {
	var data={};
    return new Blog544(meta, options,data);
  }

  /** Remove all data for this blog */
  async clear() {
	 userMap.clear();
	 articleMap.clear();
	 commentsMap.clear();
  }


  /** Create a blog object as per createSpecs and 
   * return id of newly created object 
   */
  async create(category, createSpecs) {
    const obj = this.validator.validate(category, 'create', createSpecs);
	var msg = 'Object Being Created Already Exists';
	if (category ==='users'){
		const val = this.find(category, { id: createSpecs.id});
		if (userFound === 1) {
			userFound = 0;
			  throw [ new BlogError('EXISTS', msg) ];
		}
		else{
			var newUserBlog = new Blog544(this.meta, this.options, createSpecs);		 
			let keyString = createSpecs.id.toString();
			userMap.set(keyString, newUserBlog);		
			var retUserId = {"id":keyString};
			return retUserId;
		}
		
	}
	else if (category === 'articles'){
		var articleId;
		var newArticleBlog = new Blog544(this.meta, this.options,createSpecs);
		articleId = Math.random()*100;
		articleMap.set(articleId,newArticleBlog);
		var retArticleId= {"id":articleId};
		return retArticleId;		
	}
	else {			
		var commentId;
		commentId = Math.random()*100;			
		var newCommentBlog = new Blog544(this.meta,this.options,createSpecs);
		commentMap.set(commentId,newCommentBlog);
		var retCommentId= {"id":commentId};
		return retCommentId;				
	}  
  }
  /** Find blog objects from category which meets findSpec.  Returns
   *  list containing up to findSpecs._count matching objects (empty
   *  list if no matching objects).  _count defaults to DEFAULT_COUNT.
   */
  async find(category, findSpecs={}) {
    const obj = this.validator.validate(category, 'find', findSpecs);
     if(category === 'users'){
		 if(findSpecs.id){
				 userFound=0;
				 for (let [k, v] of userMap) {
				 if(v.data.id === findSpecs.id){
				 userFound=1;
				 return [v.data];	
				}   
			}
		}
		
	 else if(findSpecs.email){
		    for (let [k, v] of userMap) {
		    if(v.data.email === findSpecs.email){
			return [v.data];	
				}   
			}
		}
		else if(findSpecs.firstName){
			for (let [k, v] of userMap) {
			if(v.data.firstName === findSpecs.firstName){
				 return [v.data];	
				}   
			}
		}
		else if(findSpecs.lastName){
				 for (let [k, v] of userMap) {
				 if(v.data.lastName === findSpecs.lastName){
				 return [v.data];	
				}   
			}
		}
		
		else{
			 var userObject = new Array();
			 for(let [k,v] of userMap){
				 userObject.push(v.data);
			 }
			 return userObject;
		}
		
	 return [];
}
	 else if( category === 'articles'){
			if(findSpecs.id){
				for (let [k, v] of articleMap) {			     
				if(k.toString() === findSpecs.id.toString()){
					return [v.data];	
				}
			}
		}
		  
		  else if(findSpecs.authorId){
			    authorIDFound=0;
				for (let [k, v] of articleMap) {	
				if(v.data.authorId === findSpecs.authorId){
				authorIDFound = 1;
				return [v.data];
				}
			}
		  }
		  
		  else if(findSpecs.keywords){
			  
		  }
	  return[]; 
  }
	
	 else if(category === 'comments'){
		 if(findSpecs.id){
			  for (let [k, v] of commentMap) {
			  if(k.toString() === findSpecs.id.toString()){
		      return [v.data];	
			}   
		}		
	}
		 else if(findSpecs.commenterId){
			 var totalComment = new Array();
			  for (let [k, v] of commentMap) {				
			    if(v.data.commenterId === findSpecs.commenterId){
				 commenterIDFound = 1;
			     totalComment.push(v.data);		         	
			}
			
		}
			return [totalComment];		
	}
	
	}
	return[];
  }
		 	 
  /** Remove up to one blog object from category with id == rmSpecs.id. */
  async remove(category, rmSpecs) {
    const obj = this.validator.validate(category, 'remove', rmSpecs);
	var idFound=0;
	var msg='ID not found';
	var msg1='This User referenced by authorID and CommenterID';
	if(category === 'users'){
		for (let [k, v] of userMap) {
			if(v.data.id === rmSpecs.id){
				idFound=1;
				}
		}
		if(idFound===1){
			const val = this.find('articles', { authorId: rmSpecs.id});
			const val1 = this.find('comments', { commenterId: rmSpecs.id});
			
			
			if(authorIDFound===1  || commenterIDFound===1){
					throw [ new BlogError('BAD_ID', msg1) ];
				 }
			else{
					console.log("User Deleted");
					userMap.delete(rmSpecs.id);
				 }				 
			}
			else{
				throw [ new BlogError('BAD_ID', msg) ];
			}	
			
	}
	else if(category === 'articles'){
			 for (let [k, v] of articleMap) {
			 if(k.toString() === rmSpecs.id.toString()){
			 articleMap.delete(k);
		     idFound=1;
			}		
		}
			if(idFound===0){
				throw [ new BlogError('BAD_ID', msg) ];
			}
		}
	else if(category === 'comments'){
			console.log("Inside Comment Map");
			for (let [k, v] of commentMap) {
			if(k.toString() === rmSpecs.id.toString()){
			 commentMap.delete(k);
			 idFound=1;
			}			
		}
	if(idFound===0){
			throw [ new BlogError('BAD_ID', msg) ];
		}
	}
	
    //@TODO
	
	
  }

  /** Update blog object updateSpecs.id from category as per
   *  updateSpecs.
   */
  async update(category, updateSpecs) {	  
    const obj = this.validator.validate(category, 'update', updateSpecs);
    if(category === 'users'){		
		for (let [k, v] of userMap) {			
			if(v.data.id === updateSpecs.id){
				for (var key in updateSpecs) {
				if(key === 'id'){continue};
				if (updateSpecs.hasOwnProperty(key)) {
				v.data[key]=updateSpecs[key];
			}
		}		
	  }   
    }
  }
	else if (category === 'articles'){
	for (let [k, v] of articleMap) {
		    if(k.toString() === updateSpecs.id.toString()){
				console.log("ID matched");
				for (var key in updateSpecs) {
				if(key === 'id'){continue};
				if (updateSpecs.hasOwnProperty(key)) {
				v.data[key]=updateSpecs[key];
			}
		}		
	}   
  }
	}
	else if(category === 'comments'){
			for (let [k, v] of commentMap) {			
				if(k.toString() === updateSpecs.id.toString()){
				console.log("ID matched");
				for (var key in updateSpecs) {
					if(key === 'id'){continue};
					if(updateSpecs.hasOwnProperty(key)) {
					v.data[key]=updateSpecs[key];
					}
				}		
			}   
		}
	}
	
  }
  
}
