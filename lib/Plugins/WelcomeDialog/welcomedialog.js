// Welcome Dialog
// by Grant Dickie
// MITH 2011


var WelcomeDialog=function(args){
	// Constructor
	// args same as Dialog()
		var self=this;
		// Constructor:
		// 
		// @param: 
		// Obj: variables:
		// 	loc: {String} DOM object to be attached to
		if((!args.loc)) throw "Not enough arguments passed to Dialog";
		self.loc=args.loc;
		//set up JSON html
		var html='<div id="light" class="white_content"><div id="dialogImport" class="dialog"><div class="header"><h2 class="title">Welcome</h2><div class="clear"></div>'+
		'</div><div class="body"><div class="description"><h3>Introduction to TILE</h3>'+
		'<p>A collaborative project among the Maryland Institute for Technology in the Humanities (Doug Reside) and the'+
		' Indiana University Bloomington (Dot Porter, John A. Walsh), the Text-Image Linking Environment (TILE) is a project for developing '+
		'a new web-based, modular, collaborative image markup tool for both manual and semi-automated linking between encoded text and images'+
		' of text, and image annotation. <a href="http://mith.umd.edu/tile">Read more &#62;</a></p><p><a id="continueButton" class="button">Continue ></a></p><p class="version">0.9</p></div><div class="clear"></div>'+
		'</div></div></div><div id="fade" class="black_overlay"></div>';
		$(html).appendTo(self.loc);
		self.index=($("#dialog").length+self.loc.width());

		$("#continueButton").live('click',function(e){
			e.preventDefault();
			$("#light").remove();
			$("#fade").remove();
		});

	
		//lightbox content
		self.light=$("#light");
		self.fade=$("#fade");
		self.DOM=$("#dialogImport");
		self.closeB=$("#importDataClose");
		self.closeB.click(function(e){
			$(self).trigger("closeImpD");
		});
};

var WD={
	id:"WD1090910",
	// wrapper for TILE
	start:function(engine){
		var self=this;
		self.dialog=new WelcomeDialog({loc:$("body")});
		
		// show dialog at beginning - user clicks continue
		// and dialog goes away
		$("#light").show();
		$("#fade").show();
		$("#dialogImport").show();
		
	}
	
};