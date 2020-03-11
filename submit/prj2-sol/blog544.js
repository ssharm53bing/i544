// -*- mode: JavaScript; -*-

import mongo from 'mongodb';

import BlogError from './blog-error.js';
import Validator from './validator.js';
import DbStore from './db-store.js';
//debugger; //uncomment to force loading into chrome debugger

/**
A blog contains users, articles and comments.  Each user can have
multiple Role's from [ 'admin', 'author', 'commenter' ]. An author can
create/update/remove articles.  A commenter can comment on a specific
article.

Errors
======

DB:
  Database error

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

export default class Blog544 {

  constructor(meta, options,databaseStore) {
    //@TODO
    this.meta = meta;
    this.options = options;
	this.databaseStore = databaseStore;
    this.validator = new Validator(meta);	
  }

  /** options.dbUrl contains URL for mongo database */
  static async make(meta, options) {
	var categ = ["users","articles","comments"];
	var cl = mongo.MongoClient;
	const client = await cl.connect(options.dbUrl,MONGO_CONNECT_OPTIONS);
    const db = await client.db('mdata');
	const createIndexMeta = metaInfo(meta);
	
	 for(const category of categ){	//creates index for all the keys which is used for find
	 for(const [index_name, index_value] of Object.entries(createIndexMeta[category].indexes)) {
				if(index_name === 'creationTime'){
					db.collection(category).createIndex({index_name:-1});
				}
				else{
					db.collection(category).createIndex({index_name:1});
				}										
			}
	 }
	 const databaseStore = await DbStore.make(meta,options,client,db);
    return new Blog544(meta, options,databaseStore);
  }

  /** Release all resources held by this blog.  Specifically, close
   *  any database connections.
   */
  async close() {
    await this.databaseStore.close();
  }

  /** Remove all data for this blog */
  async clear() {
		await this.databaseStore.clear();
  }

  /** Create a blog object as per createSpecs and 
   * return id of newly created object 
   */
  async create(category, createSpecs) {
    	const obj = this.validator.validate(category, 'create', createSpecs);
		return (await this.databaseStore.create(category,createSpecs));
	}


  /** Find blog objects from category which meets findSpec.  
   *
   *  First returned result will be at offset findSpec._index (default
   *  0) within all the results which meet findSpec.  Returns list
   *  containing up to findSpecs._count (default DEFAULT_COUNT)
   *  matching objects (empty list if no matching objects).  _count .
   *  
   *  The _index and _count specs allow paging through results:  For
   *  example, to page through results 10 at a time:
   *    find() 1: _index 0, _count 10
   *    find() 2: _index 10, _count 10
   *    find() 3: _index 20, _count 10
   *    ...
   *  
   */
  async find(category, findSpecs={}) {
	const obj = this.validator.validate(category, 'find', findSpecs);
	const res = await this.databaseStore.find(category,findSpecs);
    return res;
	//return [];
}

  /** Remove up to one blog object from category with id == rmSpecs.id. */
  async remove(category, rmSpecs) {
	const obj = this.validator.validate(category, 'remove', rmSpecs);
	await this.databaseStore.remove(category,rmSpecs);
  }

  /** Update blog object updateSpecs.id from category as per
   *  updateSpecs.
   */
  async update(category, updateSpecs) {
	const obj = this.validator.validate(category, 'update', updateSpecs);
	await this.databaseStore.update(category,updateSpecs);
	}
}

/* This function is taken from the solution of project 1.
 It changes meta into a more useful structure*/ 
 function metaInfo(meta) {
  const infos = {};
  for (const [category, fields] of Object.entries(meta)) {
    const indexPairs =
      fields.filter(f => f.doIndex).
      map(f => [ f.name, f.rel || 'eq' ]);
    const indexes = Object.fromEntries(indexPairs);
    const identifiesPairs =
      fields.filter(f => f.identifies).
      map(f => [ f.name, f.identifies ]);
    const identifies = Object.fromEntries(identifiesPairs);
    infos[category] = { fields, indexes, identifies, identifiedBy: [], };
  }
  for (const [category, info] of Object.entries(infos)) {
    for (const [field, cat] of Object.entries(info.identifies)) {
      infos[cat].identifiedBy.push([category, field]);
    }
  }
  return infos;
}



const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };
