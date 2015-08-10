if ( typeof MSAN_SCRIPT_DEBUG === 'undefined') { MSAN_SCRIPT_DEBUG = true;}
(function($) {

if( MSAN_SCRIPT_DEBUG ){
	console.log(msan);	
}
		
var noticeManager = msan.app = {
	Model: {},
	View: {},
	Collection: {},
};

msan.add_query_arg = function( key, value, uri ){
	var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
	var separator = uri.indexOf('?') !== -1 ? "&" : "?";
	if (uri.match(re)) {
		return uri.replace(re, '$1' + key + "=" + value + '$2');
	}else {
		return uri + separator + key + "=" + value;
	}
};


//===============================================================
//Models
//===============================================================
noticeManager.Model.Controller = Backbone.Model.extend({
	initialize: function() {
		if( this.get( 'notices') ){
			this.notices = new noticeManager.Collection.Notices( this.get( 'notices') );
			this.set( 'notices', false );
		}
	},
});

noticeManager.Model.Notice = Backbone.Model.extend({
	url: function() {
		var url = msan.add_query_arg( 'action', 'msan-notice', msan.url );
		url = msan.add_query_arg( '_ajax_nonce', msan.nonce, url );
		if ( this.isNew() ) return url;
		return url + '&id=' + this.id;
    }
});


//===============================================================
//Collections
//===============================================================
noticeManager.Collection.Notices = Backbone.Collection.extend({	
	model: noticeManager.Model.Notice
});

//===============================================================
//Views
//===============================================================
noticeManager.View.NoticeView = Backbone.View.extend({
	tagName: 'li',
	
	templateRead: _.template( $( '#tmpl-msan-notice' ).html( ) ),
	
	templateEdit: _.template( $( '#tmpl-msan-notice-edit' ).html( ) ),
	
    initialize: function() {
		_.bindAll(this, 'render' );
		
		this.listenTo( this.model, 'destroy', this.removeNotice, this );
	},
	
	events: {
		'click .msan-delete-notice': 'deleteNotice',
		'click .msan-edit-notice':   'editNotice',
		'click .msan-update-notice':   'updateNotice',
		'click .msan-cancel-update':   'cancelUpdateNotice'
	},
	
	render: function(){
		$( this.el ).html( this.templateRead( this.getTemplateArgs() ) );
		$( this.el ).attr( 'id', 'msan-notice-' + this.model.cid );
		return this;
	},
	
	renderEdit: function(){
		$( this.el ).html( this.templateEdit( this.getTemplateArgs() ) );
		return this;
	},
	
	getTemplateArgs:function(){
		return this.model.toJSON();
	},

	deleteNotice: function( ev ){
		ev.preventDefault();
		this.model.destroy();
	},
	
	updateNotice: function( ev ){
		ev.preventDefault();
		
		var message = $( 'textarea', this.el ).val();
		this.model.set( 'message', message );
		this.model.save();
		this.render();
		this.model.trigger( 'move-to-top', this.model );
	},
	
	cancelUpdateNotice: function( ev ){
		ev.preventDefault();
		this.render();
	},
	
	removeNotice: function(){
		$(this.el).remove();
	},
	
	editNotice: function( ev ){
		ev.preventDefault();
		this.renderEdit();
		$( 'textarea', this.el ).focus();
	}
});

noticeManager.View.ControllerView = Backbone.View.extend({
	
	el: '#msan-notices',
	
	events: {
		'click .button': 'publishNotice',
	},
    
	initialize: function() {
		_.bindAll(this, 'render', 'addNotice', 'moveToTop' );

		var self = this;
		
		this.listenTo( this.model.notices, 'add', this.addNotice, this );
			this.listenTo( this.model.notices, 'move-to-top', function( notice ){
			self.moveToTop( notice );
		});
	},
	
	render: function(){
		
		var self = this;
		
		if( this.model.notices ){
			this.model.notices.each(function( notice ){
				self.addNotice( notice, false );
			});
			
		}
	},
	
	publishNotice: function( ev ){
		ev.preventDefault();
		
		var message = $( 'textarea', this.el ).val();
		
		if( !message ){
			return;
		}
		var notice = new noticeManager.Model.Notice({
			message: message
		});
		
		notice.save();
		this.model.notices.add( notice );
	},
	
	addNotice: function( notice, fadeIn ){

		fadeIn = ( typeof fadeIn == 'undefined ' ? true : fadeIn );
		
		noticeView = new noticeManager.View.NoticeView( { model: notice } );
		var noticeEl = noticeView.render().el;
		
		$list = $( 'ul', this.el );
		if( fadeIn ){
			$(noticeEl).css({opacity: 0}).prependTo( $list ).animate({opacity: 1}, 1500);
		}else{
			$(noticeEl).prependTo( $list );
		}

	},
	
	moveToTop: function( notice ){
		
		var $list      = $( 'ul', this.el );
		var listHeight = $list.innerHeight();
		var listTop    = $list.position().top;
		
		var $notice    = $( '#msan-notice-'+notice.cid );
		var noticeId   = $notice.attr("id");

		var elemHeight = $notice.height();
		var elemTop    = $notice.position().top;
		
		var liHtml     = $notice.clone().wrap('<div></div>').parent().html(); //outer HTML		
		
		var moveUp   = (listTop - elemTop );
		var moveDown = elemHeight;

		$( "li", this.el  ).each(function() {
			if ( $(this).attr("id") == noticeId ) {
				return false;
			}
			$(this).animate({"top": '+=' + moveDown}, 1000);
		});
		
		$notice.animate({"top": '+=' + moveUp}, 1000, function() {
			$notice.prependTo( $list );
			$("li").attr("style","");
		});
		
	}
});

//======================================
// Initialize
//======================================
$(document).ready(function(){
	
	var controller = new noticeManager.Model.Controller( {
		notices: msan.notices
	} );
	
	var noticesControllerView = new noticeManager.View.ControllerView({ model: controller });
	noticesControllerView.render();
});
})(jQuery);