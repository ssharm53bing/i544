import mongo from 'mongodb';
import BlogError from './blog-error.js';
import Validator from './validator.js';


export default class DbStore{
	constructor(meta,options,client,db){
		this.meta = meta;
		this.options = options;
		this.client = client;
		this.db = db;
	}
	
	static async make(meta,options,client,db){
		return new DbStore(meta,options,client,db);
	}
	
	async close(){
		await this.client.close();
	}
	
	async clear(){
		await this.db.collection("users").deleteMany({});
		await this.db.collection("articles").deleteMany({});
		await this.db.collection("comments").deleteMany({});
	}
	
	async create(category,createSpecs){
		
		let id;
		const msg = 'ID already exists for the object being created'
		if(createSpecs.id === undefined){//Create id if not available in createSpecs
			id = parseFloat(Math.random()*100);
			createSpecs.id = id;
		}
		const found =  await this.find(category, {id:createSpecs.id});//find if the id already exists in the database
		
		if(createSpecs._id !== undefined){//check if _id is also sent along with other data
			throw new BlogError('BAD_FIELD','the internal mongo _id field is forbidden for users create');
		}
		
		if(found.length>0){
			throw new BlogError('EXISTS',msg);			
		}else{	//insert the value for category in the database 
			createSpecs._id= createSpecs.id;
			const q1 = await this.db.collection(category);
			const q2 = await q1.insertOne(createSpecs);  		
			return id;
		}
	}
	
	async find(category, findSpecs){
		const infos = metaInfo(this.meta);
		const search = Object.assign({}, findSpecs);
		const count = parseInt(search._count) || DEFAULT_COUNT;
		const pagination = parseInt(search._index) || DEFAULT_LIMIT;
		var query = {};
		delete search._count;
		delete search._index;
		let ids;
		if(search.id !== undefined){
			ids = search.id;
			delete search.id;
		}
	
		if(ids !== undefined){
		if(category!="users"){
			query['_id'] = parseFloat(ids);
		}
		else{
			query['_id'] = ids;	
		}
		/*search in a mongo database with _id*/
	    const q1 =  await this.db.collection(category);
		const q2 = await q1.find(query).project({_id:0}).skip(pagination).limit(count).sort({'creationTime':-1});
		const res = await q2.toArray();
		return res;	
	}	
	else{/*search in a mongo database with other parameters specified in meta*/
		for(const [name, value] of Object.entries(search)) {
			for(const [index_name, index_value] of Object.entries(infos[category].indexes)) {
				if(name === index_name){
					if(name === 'creationTime'){
						query[name]={$lte:value};						
					}
					else {
					query[name] = value;
					}					
				}						
			}
		}
		
		const q1 =  await this.db.collection(category);
		const q2 = await q1.find(query).project({_id:0}).skip(pagination).limit(count).sort({'creationTime':-1});
		const res =  await q2.toArray();
		return res;		
	
	}
	return [];
}


	async remove(category, rmSpecs){
		
		var msg = 'Entered ' + category + ' is referenced by ';    
		const infos = metaInfo(this.meta);
		var canremove = 1;
		
		for(const [index,field_name] of Object.entries(infos[category].identifiedBy)){
			var cat = field_name[0];
			var search_field = field_name[1].toString();
			var findjson = {};
			findjson[search_field] = rmSpecs.id;
			var found = await this.find(cat,findjson);//check if object from other category depends upon the object that is being removed
			if( found.length>0){
				canremove = 0;
				for(const i in found){
					msg = msg +''+ search_field +''+ found[i].id + ',';
				}
			}		
		}
		
		if(canremove == 1){//Remove if the removal doesn't lead the database in a inconsistent state.
			const q1 =  await this.db.collection(category);
			const q2 =  await q1.deleteOne({_id:parseFloat(rmSpecs.id)});
		}else{
			throw new BlogError('BAD_ID',msg);
		}
	}
	
	async update(category, updateSpecs){
		
		const q1 =  await this.db.collection(category);
		var ids;
		var findPara={};
		if(category!=="users")
		{
			ids = parseFloat(updateSpecs.id)
		}else{
		 ids = updateSpecs.id
		}
		findPara.id=ids;
		var found = await this.find(category,findPara);
		if(found.length<1){
			throw new BlogError('BAD_ID','Given ID for update doesnot exist in the database');
		}
		delete(updateSpecs.id);
		var update_values = {};
		for(const [name, value] of Object.entries(updateSpecs)) {		
			update_values[name] = value;
		}
		var new_values = { $set:update_values }
		const q2 =  await q1.updateOne({_id:ids},new_values);	
  }
}
/* This function is taken from the solution of project 1. It converts the meta into more useful structure*/
	function metaInfo(meta) {
		const infos = {};
		for(const [category, fields] of Object.entries(meta)) {
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
	
	for(const [category, info] of Object.entries(infos)) {
			for (const [field, cat] of Object.entries(info.identifies)) {
			infos[cat].identifiedBy.push([category, field]);
		}
	}
		return infos;
	}  

	
const DEFAULT_COUNT = 5;
const DEFAULT_LIMIT = 0;
	



