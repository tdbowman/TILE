//Main function that starts the interface for columns


var EngineC=Monomyth.Class.extend({
	init:function(args){
		//get HTML from PHP script and attach to passed container
		this.loc=(args.attach)?args.attach:$("body");
		var self=this;
		$.ajax({
			dataType:"json",
			url:"./lib/JSONHTML/columns.json",
			success:function(d){
				//d represents JSON data
				$(d.body).appendTo($("body"));
				self.DOM=$("body");
				//this.startURL=args.URL;
				self.getBase();
				//self.json=(args.json)?args.json:false;
				self.schemaFile=null;
				self.preLoadData=null;
				//global bind for sidebar completion event to loadCanvas()
				self.setUp(d);
			}
		});
		
	},
	getBase:function(){
		//check JSON file to configure main path
		var self=this;
		$.getJSON('TILECONSTANTS.json',function(d){
			//d refers to the JSON data
			self._base=d.base;
		});
		
	},
	setUp:function(d){
		//create log - goes towards left area
		this._log=new TileLogBar({html:d.log,logitemhtml:d.logitem});
		
		
		//important variables
		this.imageLoaded=false;
		
		//finishes the rest of init
		this.toolbarArea=$("#header");
		// this.ToolBar=new TILETopToolBar({
		// 			loc:this.toolbarArea,
		// 			position:'top'
		// 		});
		
	
		//load the sidebar that handles tags
		// this.SideBar=new TileTabBar({
		// 			loc:"tools"
		// 		});
		
		//global bind for when the VectorDrawer in raphaelImage is completed
		$("body").bind("VDCanvasDONE",{obj:this},this.createShapeToolBar);
		
		this.loadCanvas();
		 //load new tags - opened by TopToolBar
		this.loadTags=new LoadTags({
			loc:$("body")
		});
		
		//load dialog boxes
		this.importDialog=new ImportDialog({
			loc:$("body")
		});
		
		this.imageDialog=new NewImageDialog({
			loc:$("body")
		});
		
		//JSON Reader
		this.jsonReader=new jsonReader({});
		
		//set global listeners
		$("body").bind("schemaFileImported",{obj:this},this.ingestSchema);
		//$("body").bind("multiFileListImported",{obj:this},this.setMultiURL);
		
		//OLD: use ingestSchema, NEW: use jsonReader object
		$("body").bind("newImageAdded",{obj:this},this.setMultiURL);
		$("body").bind("saveAllSettings",{obj:this},this.saveSettings);		
		//TODO:create restartALL procedure
		$("body").bind("restartAll",{obj:this},this.start_New_Session);
		//global bind for clearing all tags on current image
		$("body").bind("clearPage",{obj:this},this.clear_Image_Tags);
		//global bind for clearing all tags on every image
		$("body").bind("clearSession",{obj:this},this.clear_All_Tags);
		//if json data present, set up urls
		if(this.json){
			//parse data
			var p=this.jsonReader.read(this.json);
			if(!p) window.location(".");
			$("body").bind("tagRulesSet",{obj:this},this.loadJSONImages);
			this.DOM.trigger("schemaLoaded",[p]);
		} else {
			this.DOM.trigger("openImport");
		}
	},
	loadCanvas:function(){
		//load raphael canvas - for drawing shapes onto
		this.raphael=new RaphaelImage({
			loc:"contentarea",
			maxZoom:5,
			minZoom:1,
			url:[]
		});
		this.imageLoaded=true;
		this.imagesON=true;

	},	
	//called once the VectorDrawer makes its first build
	createShapeToolBar:function(e){
		var obj=e.data.obj;
		$("body").unbind("VDCanvasDONE",obj.createShapeToolBar); //remove the bind - done only once
		
		//load the second toolbar - shapes, etc.
		obj.ShapeToolBar=new TILEShapeToolBar({
			loc:"tools"
		});
		
		//load schema tags if haven't done so already (i.e. user loads JSON first)
		obj.jsonReader.readSchemaFromFile(obj.schemaFile);
		
		//load the image scroller (at the bottom)
		//load the scroller
		//obj.Scroller=new TileAnimatedScroller({});
		//scroller events
		//$("body").bind("switchImage",{obj:obj},obj.switchToImage);
		//obj.Scroller.loadImages(obj.raphael.getUrlList());
		
	},
	// ***multiURL***
	// 	called by ImportDialog 
	// 	@path refers to file URI for loading multiple images in a set OR to a single image
	setMultiURL:function(e,path){
		if(e){
			var obj=e.data.obj;
			obj.DOM.trigger("closeImpD");
			if(/.jpg|.JPG|.gif|.GIF|.png|.PNG|.tif|.TIF/.test(path)){
				obj.raphael.addUrl([{title:'unknown',uri:path,desc:'none'}]);
				obj.Scroller.loadImages([path]);
				obj.DOM.trigger("imageAdded");
			} else if(/.txt/.test(path)){
				var list=$.ajax({
					url:path,
					async:false,
					dataType:'text'
				}).responseText.replace(/\n+\s+/g,"").split(/,/);
				var listarray=[];
				var self=obj;
				jQuery.each(list,function(i,val){
					if(val){//getting rid of undefined types - BUG
						listarray.push({
							uri:self._base+val.replace(/^[\n\r]+/g,"")
						});
					}
				});

				obj.raphael.addUrl(listarray);
			//	obj.canvasImage.addUrl(listarray);
				//update the scroller bar
				if(obj.Scroller) obj.Scroller.loadImages(obj.raphael.getUrlList());
				obj.DOM.trigger("imageAdded");
			} else {
				obj.DOM.trigger("openNewImage");
			}
		} else {
			this.DOM.trigger("closeImpD");
			if(/.jpg|.JPG|.gif|.GIF|.png|.PNG|.tif|.TIF/.test(path)){
				this.raphael.addUrl([{title:'unknown',uri:path,desc:'none'}]);
				this.Scroller.loadImages([path]);
				this.DOM.trigger("imageAdded");
			} else if(/.txt/.test(path)){
				var list=$.ajax({
					url:path,
					async:false,
					dataType:'text'
				}).responseText.replace(/\n+\s+/g,"").split(/,/);
				var listarray=[];
				var self=this;
				jQuery.each(list,function(i,val){
					if(val){//getting rid of undefined types - BUG
						listarray.push({
							uri:self._base+val.replace(/^[\n\r]+/g,"")
						});
					}
				});

				this.raphael.addUrl(listarray);
			//	this.canvasImage.addUrl(listarray);
				//update the scroller bar
				if(this.Scroller) this.Scroller.loadImages(this.raphael.getUrlList());
				this.DOM.trigger("imageAdded");
			} else {
				this.DOM.trigger("openNewImage");
			}
		}

	},
	//LOADING IN SCHEMA TAG RULES
	//@file is {String} representing path to image list
	//@schema is {String} object representing filepaths
	ingestSchema:function(e,file,schema){
		
		var obj=e.data.obj;
		if(!obj.schemaFile){
			//send image file data to canvas
			obj.setMultiURL(null,file);
			obj.schemaFile=schema;
			
			// obj.schemaFile=schema;
			// 			//get the JSON data
			// 			//url,data,function
			// 			$.getJSON(obj.schemaFile,function(d){
			// 				var b=[];
			// 				//go through tag objects and create array of tags
			// 				//and their rules
			// 				$.each(d.tags,function(i,tag){
			// 					b.push(tag.name);
			// 
			// 				});
			// 
			// 				$("body").trigger("tagRulesSet",[b]);
			// 			});
		}
	},
	start_New_Session:function(e){
		var obj=e.data.obj;
		//restart the entire session
		//erases images, tags, shapes
		obj.raphael._startOver();
		if(obj.Scroller) obj.Scroller._resetContainer();
		if(obj.SideBar) obj.SideBar._resetAllTags();
		//open up import dialog 
		obj.DOM.trigger("openImport");
	},
	//clear only the shapes and tags drawn on the current image
	clear_Image_Tags:function(e){
		var obj=e.data.obj;
		obj.SideBar.reset_Curr_Manifest();
		obj.raphael._resetCurrImage();
	},
	clear_All_Tags:function(e){
		var obj=e.data.obj;
		obj.SideBar._resetAllTags();
		obj.raphael._eraseAllShapes();
	}
	
});