/*
jsPatterns v0.1
Requires: jQuery 1.4 or newer, paginator.js, jquery.jsonf.js
Contributions from Vlad Bokov aka razum2um
Dual licensed under the MIT and GPL licenses.
*/
(function($, undefined){
    $.fn.extend({
        // utility method
        smartPatterns: function(options){
            return this.each(function(){
                
                var defaults = {
                    // paginator init
                    smartScript: $('script[type="text/x-jquery-tmpl"]', this),
                    smartReplace: $('.replaceable', this),
                    smartSearch: $('.filter form', this),
                    smartPager: $('.pagination', this), // set of links , have href='?page=N'
                    smartOrder: $('.sorting tr.table-names', this), // set of links, whose `href` of `.up|.down` will go to GET['order']
                    smartCallback: function(smartScript, smartReplace, smartPager) { 
                        if (window.console){
                            console.info('smartScript.selector = %s', smartScript.selector);
                        }
                        return false; 
                    },
                };
                var opts = $.extend(defaults, options);

                // copy to inner scope
                var smartWrapper = $(this);
                var smartScript = opts.smartScript;
                var smartReplace = opts.smartReplace;
                var smartSearch = opts.smartSearch;
                var smartPager = opts.smartPager;
                var smartOrder = opts.smartOrder;
                function smartCallback() {
                    opts.smartCallback(smartScript, smartReplace, smartPager);
                    return false;
                };
                //var smartCallback = function() { 
                    //windows.console && console.info('your ads may be here!');
                    //return false; 
                //};

                // eval some additional data
                var dataUrl = smartSearch.attr('action');
                if (dataUrl===undefined) {
                    var dataUrl = document.URL;
                };

                function getQueryVariable(variable, query, default_val) {
                  if (query===undefined) {
                      var query = window.location.search.substring(1);
                  }
                  var vars = query.split("&");
                  for (var i=0;i<vars.length;i++) {
                    var pair = vars[i].split("=");
                    if (pair[0] == variable) {
                      return pair[1];
                    }
                  }
                  return default_val
                };

                function getSendData() {
                    // data will be send to get new data.objects
                    // TODO: get params from current GET

                    // filer data
                    var filterData = $(smartSearch).jsonf();
                    var sendData = $.extend({}, filterData);

                    // pager data
                    var page = $('.current', smartPager).attr('href');
                    sendData['page'] = getQueryVariable('page', page, 1);

                    // only trust on-page handler
                    var per_page = $('.select-dropdown', smartPager).getSetSSValue();
                    if (per_page===undefined) {
                        if (smartWrapper.hasClass('popup')) {
                            var per_page = 9;
                        } else {
                            var per_page = 20;
                        }
                    }
                    sendData['per_page'] = per_page;

                    // sorting data
                    var _order = $('.up', smartOrder); // is_rev=0
                    var order = 'pk';
                    var is_rev = 0;
                    if (_order.length) {
                        var order = _order.attr('href');
                        var is_rev = 0;
                    } else {
                        var _order = $('.down', smartOrder);
                        if (_order.length) {
                            var order = _order.attr('href');
                            var is_rev = 1;
                        };
                    };

                    sendData['order'] = order;
                    sendData['is_rev'] = is_rev;

                    // end building sendData
                    return sendData;
                };

                function successCallback(data, statusText, xhr){
                    smartReplace.empty();
                    $.tmpl(smartScript, data.objects).appendTo(smartReplace);
                    $('.pager', smartPager).empty();
                    if (data.paginator===undefined) {
                        smartPager.hide();
                    } else {
                        smartPager.paginate({
                            'per_page': data.paginator.per_page, 
                            'current_page': data.paginator.page,
                            'total': data.paginator.total,
                        }).show();
                        // bind pagination
                        
                        
                    }
                };

                function ajaxQuery(dataUrl, getSendData, successCallback, userCallback) {
                    $.ajax({
                        url: dataUrl,
                        data: getSendData(),
                        dataType: 'json',
                        success: function(data, statusText, xhr){
                            successCallback(data, statusText, xhr);
                            userCallback();
                        }
                    });
                };

                function bindWrapper() {
                    // to prevent immediatly call in `bind`
                    return ajaxQuery(dataUrl, getSendData, successCallback, smartCallback)
                };

                // bind sorting
                $('a', smartOrder).click(function(e) {
                    e.preventDefault();
                    if ($(this).hasClass('up')) {
                        $('a', smartOrder).removeClass('down').removeClass('up');
                        $(this).removeClass('up').addClass('down');
                    } else {
                        $('a', smartOrder).removeClass('down').removeClass('up');
                        $(this).addClass('up').removeClass('down');
                    }
                    smartWrapper.trigger('rebuild');
                });
                
                // bind pagination
                smartPager.paginate().change(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        smartWrapper.trigger('rebuild');
                    });
                // bind search
                $('select', smartSearch).change(function(){
                    $(this).removeClass('empty').addClass('filled');
                    smartWrapper.trigger('rebuild');
                });
                // TODO: double-hit db on `nomenclature` as bound to smartPatterns twice
                // FIXME: nethertheless, double-hit almoust everywhere @19.04.11
                $('input[type="text"]', smartSearch).unbind('change').change(function(){
                    if ($(this).val().length > 2 || $(this).val().length == 0) {
                        $(this).removeClass('empty').addClass('filled');
                        smartWrapper.trigger('rebuild');
                    }
                });
                /*
                $('.pager a', smartPager).click(function(e) {
                    e.preventDefault();
                    $('.pager a', smartPager).removeClass('current');
                    $(this).addClass('current');
                    smartWrapper.trigger('rebuild');
                });
                */

                smartWrapper.addClass('smartWrapper').bind('rebuild', bindWrapper)
                return smartWrapper;

            }); // end return-function
        }, // end smartTable
    }); // end .extend
})(jQuery);
        
