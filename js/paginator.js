/*
Djaginator v0.1
Requires: jQuery 1.4 or newer
Contributions from Vlad Bokov aka razum2um
Dual licensed under the MIT and GPL licenses.
*/
(function($, undefined){
    $.fn.extend({
    // utility method
    // given clear div as pager container with `back`, `pages`, `forward` elements
    // returns the same with pagination
        paginate: function(options){
            return this.each(function(){

                var defaults = {
                    // paginator init

                    // main element identificators
                    pages_cl: 'pages', // <ul> to be purged!
                    forward_cl: 'forward',
                    back_cl: 'back',

                    disabled_cl: 'disabled',
                    GET_page: 'page', // `page` key in .ajax(){'data'}
                    per_page: 20, // some SHOULD BE updated via json result fron callback
                    total: 20,

                    BIG_SLICE: 4,
                    SMALL_SLICE: 2, 
                    MID_SLICE: 3, // should be odd (summary length=2*MID_SLICE - 1)
                    SIDE_SLICES: 1, // if page in the middle slice
                };
                var opts = $.extend(defaults, options);
                var BIG_SLICE = opts.BIG_SLICE;
                var SMALL_SLICE = opts.SMALL_SLICE; 
                var MID_SLICE = opts.MID_SLICE; // should be odd
                var SIDE_SLICES = opts.SIDE_SLICES; // if page in the middle slice
                var SEP = '<li class="sep">&nbsp;...&nbsp;</li>';
                var page_item = '<li><a href="#"></a></li>';
                var current_page_item = '<li><span></span></li>';

                // copy to global scope
                var per_page = opts.per_page;
                var current_page = opts.current_page;
                var total = opts.total;

                var $wrapper = $(this);
                var pager = $('.pager', this);
                      
                if (current_page!==undefined) {
                // create main sections
                var back_ref = pager.children('.' + opts.back_cl).removeClass('current'); // we gotta purge all
                if (!back_ref.length) {
                    var back_ref = $('<a>').attr('href', '#').addClass(opts.back_cl).text('Назад').appendTo(pager);
                };

                var pages = pager.children('.' + opts.pages_cl).empty();
                if (!pages.length) {
                    var pages = $('<ul>').addClass(opts.pages_cl).appendTo(pager); // empty ul-container   
                };

                var forward_ref = pager.children('.' + opts.forward_cl).removeClass('current');
                if (!forward_ref.length) {
                    var forward_ref = $('<a>').attr('href', '#').addClass(opts.forward_cl).text('Вперед').appendTo(pager);
                };
                
                // set back-forwarding
                if ( current_page >= total ) {
                    $(forward_ref).addClass(opts.disabled_cl).hide();
                } else {
                    $(forward_ref).removeClass(opts.disabled_cl).show();
                }
                $(forward_ref).attr('href', '?&' + opts.GET_page + '=' + (current_page+1))

                if ( current_page <=  1 ) { 
                    $(back_ref).addClass(opts.disabled_cl).hide();
                } else {
                    $(back_ref).removeClass(opts.disabled_cl).show();
                }
                $(back_ref).attr('href', '?&' + opts.GET_page + '=' + (current_page-1))

                if ( total == 1 ) { 
                    pager.hide(); 
                    return false;
                } else {
                    pager.show(); 
                }

                // purge pager
                //pager.empty();
                //back_ref.appendTo(pager);
                //pages.appendTo(pager);
                //forward_ref.appendTo(pager);

                // start filling
                var make_link = function(i) {
                    if ( i==current_page ) { 
                        var new_page = $(current_page_item).clone();
                        new_page.children('span').addClass('current').text(i);
                    } else {
                        var new_page = $(page_item).clone();
                        new_page.children('a').attr('href', '?&' + opts.GET_page + '=' + i).text(i);
                    }
                    return new_page;
                }

                if ( BIG_SLICE+SMALL_SLICE+MID_SLICE < total ) {
                    // handle where is current closer to
                    if (current_page < BIG_SLICE ) {
                        // closer to the beginning
                        for (var i=1; i<=BIG_SLICE; ++i ) {
                            make_link(i).appendTo($(pages));
                        }
                        $(SEP).appendTo($(pages));
                        var i = total - SMALL_SLICE + 1; // right small startswith
                        for (i; i<=total; ++i) {
                            make_link(i).appendTo($(pages));
                        }
                    } else if ( current_page > total - BIG_SLICE + 1 ) {
                        // closer to the end
                        for (var i=1; i<=SMALL_SLICE; ++i ) {
                            make_link(i).appendTo($(pages));
                        }
                        $(SEP).appendTo($(pages));
                        var i = total - BIG_SLICE + 1; // right big startswith
                        for (i; i<=total; ++i) {
                            make_link(i).appendTo($(pages));
                        }
                    } else {
                        // in the middle slice 
                        for ( var i=1; i<=SIDE_SLICES; ++i ) {
                            make_link(i).appendTo($(pages));
                        }
                        $(SEP).appendTo($(pages));
                        
                        var neighbours = Math.ceil(MID_SLICE/2); 
                        for ( var i=current_page-neighbours; i<current_page; ++i ) {
                            make_link(i).appendTo($(pages));
                        }

                        make_link(current_page).appendTo($(pages));

                        for ( var i=current_page+1; i<=current_page+neighbours; ++i ) {
                            make_link(i).appendTo($(pages));
                        }

                        $(SEP).appendTo($(pages));

                        var i = total - SIDE_SLICES + 1; // right side startswith
                        for (i; i<=total; ++i) {
                            make_link(i).appendTo($(pages));
                        }
                    }
                } else {
                    // draw all
                    for ( var i=1; i<=total; ++i ) {
                        make_link(i).appendTo($(pages));
                    }
                }// end page-building
    
                } // if `current_page`
                $('a', pager).unbind('click');
                $('a', pager).click(function(e) {
                    e.preventDefault();
                    $('a, span', pager).removeClass('current');
                    $(this).addClass('current');
                    $wrapper.trigger('change');
                });

                var $per_page_list = $('.select-dropdown', $wrapper);
                if ($per_page_list.length) {
                    // large paginator
                    $per_page_list.unbind('change'); // as its called many times
                    $per_page_list.change(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        $wrapper.trigger('change');
                    });
                }

                return $wrapper
            }); // end `return`
        } // end main .paginate
    }); // end .extend
})(jQuery);

