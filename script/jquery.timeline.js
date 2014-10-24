/*
*	jquery timeline ext
*	author nicknzhang
*	email nicknzhang@tencent.com
*   date 2014-10-17	
*/

(function ($) {
	$.fn.jTimeline = function(){
		var el = $(this),
            defaultOptions ={
                title : '',
                begin : '2014-08-01',
                end : '2014-08-31',
                data : [],
                status_map : {1:'',2:'jtimeline-claim',3:'jtimeline-related'},
                //callback function
                click:null,
                commit:null
            },
            //global variables,needn't init
            tr = [],
            recent_id = 0,
            old_id = 0,
            old_begin = '',
            old_end = '',
            old_status = 1,

            //add one new td
            //v={'id':'10020001','col':5,'status':1,'begin':'2014-10-10','end':'2014-10-20','text':'hello world'}
			addTd = function(id,index,v){
        		$('#'+id).append('<td id="'+v.id+'" colspan="'+v.col+'" class="'+defaultOptions.status_map[v.status]+'" _begin="'+v.begin+'" _end="'+v.end+'" _status="'+v.status+'" _index="'+index+'" title="'+v.text+'">'+v.text+'</td>');
        	},
        	//calculate days between two days
        	countDate = function(start,end){ 
            	if(start==null||start.length==0||end==null||end.length==0){ 
                	return 0; 
            	} 
             
            	var arr=start.split("-");  
            	var starttime=new Date(arr[0],parseInt(arr[1]-1),arr[2]);  
            	var starttimes=starttime.getTime(); 
             
            	var arrs=end.split("-");  
            	var endtime=new Date(arrs[0],parseInt(arrs[1]-1),arrs[2]);  
            	var endtimes=endtime.getTime(); 

            	var intervalTime = endtimes-starttimes;
            	var Inter_Days = ((intervalTime).toFixed(2)/86400000)+1;

            	return Inter_Days; 
        	},
        	//get previous day of one day
        	getPreDate = function(date){
        		var arr=date.split("-");  
            	var datetime = new Date(arr[0],parseInt(arr[1]-1),arr[2]);  
            	var preDate = new Date(datetime.getTime()-86400000);
            	var year = preDate.getFullYear();
            	var month = (preDate.getMonth()<9?'0'+(preDate.getMonth()+1):preDate.getMonth()+1);
            	var day = preDate.getDate()<10?'0'+preDate.getDate():preDate.getDate();

            	return year+'-'+month+'-'+day;
        	}
        	//get next day of one day
        	getNextDate = function(date){
        		var arr=date.split("-");  
            	var datetime = new Date(arr[0],parseInt(arr[1]-1),arr[2]);  
            	var nextDate = new Date(datetime.getTime()+86400000);
            	var year = nextDate.getFullYear();
            	var month = (nextDate.getMonth()<9?'0'+(nextDate.getMonth()+1):nextDate.getMonth()+1);
            	var day = nextDate.getDate()<10?'0'+nextDate.getDate():nextDate.getDate();

            	return year+'-'+month+'-'+day;
        	};
            //get some day from one day
            getSomeDate = function(date,i){
                var arr=date.split("-");
                var datetime = new Date(arr[0],parseInt(arr[1]-1),arr[2]);  
                var someDate = new Date(datetime.getTime()+i*86400000);
                var year = someDate.getFullYear();
                var month = (someDate.getMonth()<9?'0'+(someDate.getMonth()+1):someDate.getMonth()+1);
                var day = someDate.getDate()<10?'0'+someDate.getDate():someDate.getDate();

                return year+'-'+month+'-'+day;
            },
            timelineValidate = function(tdindex,new_begin,new_end,tr){
                var flag = true;
                //begin must be earlier than or equal to end
                if(new_begin>new_end){
                    // alert('开始时间不能大于结束时间');
                    return false;
                }

                //beyond the valid time range
                if(new_begin<defaultOptions.begin||new_end>defaultOptions.end){
                    // alert('超出可选时间范围');
                    return false;
                }

                $.each(tr,function(i,v){
                    if(v.begin>new_end){
                        return false;
                    }else{
                        if(v.begin>=new_begin||v.end>=new_begin){
                            if(v.status!=1&& i!=tdindex){
                                flag = false;
                                return false;
                            }
                        }
                    }
                });

                return flag;
            },
            getTdInfo = function(td){
                old_id = $(td).attr('id');
                old_begin = $(td).attr('_begin');
                old_end = $(td).attr('_end');
                old_status = parseInt($(td).attr('_status'));
                return {
                    id : old_id,
                    status : old_status,
                    begin : old_begin,
                    end : old_end,
                    tdindex : $(td).attr('_index')
                };
            };

		//init single timeline
		this.single = function(options){
            var _self = this;

            $.extend(true, defaultOptions, options);

            var length = countDate(defaultOptions.begin,defaultOptions.end);

            //colspan of one th
            var th_width = Math.ceil(90*length/(el.width()-150));
            var th_interval = Math.ceil(length/4);

            var timeline_title = '';
            var timeline_html = '';
            var timeline_head = '';

            //timeline date th
            var th_i = 0;
            while(th_i<length){
                if(th_i%th_interval==0&&th_i+th_width<length){
                    timeline_head +='<th colspan="'+th_width+'">'+getSomeDate(defaultOptions.begin,th_i)+'</th>';
                    th_i +=th_width;
                }else{
                    if(th_i+th_interval-th_width<length){
                        var tmp_width = th_interval-th_width;
                    }else{
                        var tmp_width = length-th_i;
                    }
                    timeline_head +='<th colspan="'+tmp_width+'"></th>';
                    
                    th_i += tmp_width;
                }                   
            }

            //title and timeline
            $.each(defaultOptions.data,function(i,v){
                var td_index = 0;

                var begin = [];
                $.each(v.begin,function(key,val){
                    begin.push(key);
                });

                timeline_title += '<tr><td><div>'+v.name+'</div></td></tr>';

                timeline_html += '<div class="jtimeline-row"><div class="jtimeline-bg">\
                                    <table><tbody><tr><td class="jtimeline-unselect"></td></tr></tbody></table>\
                                    </div><div class="jtimeline-content-skeleton">\
                                    <table><tbody><tr id="jtlTr'+v.id+'">';

                //add timeline with data
                var recent_date = defaultOptions.begin;
                while(recent_date<=defaultOptions.end){
                    if(v.begin[recent_date]){
                        var val = v.value[v.begin[recent_date]];
                        var col = countDate(val.begin,val.end);

                        timeline_html +='<td id="'+v.begin[recent_date]+'" colspan="'+col+'" class="'+defaultOptions.status_map[val.status]+'" _status="'+val.status+'" _begin="'+val.begin+'" _end="'+val.end+'" _index="'+(td_index++)+'" title="'+val.text+'">'+val.text+'</td>';

                        begin.shift();

                        recent_date = getNextDate(val.end);
                    }else{
                        if(begin.length==0){
                            var col = countDate(recent_date,defaultOptions.end);

                            timeline_html +='<td id="0" colspan="'+col+'" _status="1" _begin="'+recent_date+'" _end="'+defaultOptions.end+'" _index="'+(td_index++)+'"></td>';
                                
                            recent_date = getNextDate(defaultOptions.end);
                        }else{
                            var preDate = getPreDate(begin[0]);
                            var col = countDate(recent_date,preDate);
                                
                            timeline_html +='<td id="0" colspan="'+col+'" _status="1" _begin="'+recent_date+'" _end="'+preDate+'" _index="'+(td_index++)+'"></td>';
                            recent_date = begin[0];
                        }                           
                    }
                }

                timeline_html +='</tr></tbody></table></div></div>';                
            });

            //init table frame
            el.append('<div class="jtimeline-title"><table><thead><tr><th>'+defaultOptions.title+'</th></tr></thead>\
                <tbody>'+timeline_title+'</tbody></table></div>\
                <div class="jtimeline-content"><table>\
                <thead><tr><td><div><table>\
                <thead><tr>'+timeline_head+'</tr></thead>\
                </table></div></td></tr></thead>\
                <tbody><tr><td><div class="tlcBody">'+timeline_html+'</div></td></tr></tbody>\
                </table></div>');

            //bind td click event
            el.delegate('.tlcBody td','click',function(){
                recent_id = $(this).parent().attr('id');
                var tds = $('#'+recent_id).find('td');

                tr = [];
                for(var i=0;i<tds.length;i++){
                    var col = $(tds[i]).attr('colspan')?parseInt($(tds[i]).attr('colspan')):1;
                    var val = parseInt($(tds[i]).attr('_status'));
                    var b = $(tds[i]).attr('_begin');
                    var e = $(tds[i]).attr('_end');
                    var text = $(tds[i]).text();
                    var id = $(tds[i]).attr('id');

                    tr.push({'id':id,'col':col,'status':val,'begin':b,'end':e,'text':text});
                }
                    
                var new_info = getTdInfo(this);
                if(defaultOptions.click){
                    defaultOptions.click(new_info);
                }
            });
		};

        //init multiple timeline
        this.multiple = function(options){
            var _self = this;

            $.extend(true, defaultOptions, options);

            var length = countDate(defaultOptions.begin,defaultOptions.end);

            //colspan of one th
            var th_width = Math.ceil(90*length/(el.width()-150));
            var th_interval = Math.ceil(length/4);

            var timeline_title = '';
            var timeline_html = '';
            var timeline_head = '';

            //timeline date th
            var th_i = 0;
            while(th_i<length){
                if(th_i%th_interval==0&&th_i+th_width<length){
                    timeline_head +='<th colspan="'+th_width+'">'+getSomeDate(defaultOptions.begin,th_i)+'</th>';
                    th_i +=th_width;
                }else{
                    if(th_i+th_interval-th_width<length){
                        var tmp_width = th_interval-th_width;
                    }else{
                        var tmp_width = length-th_i;
                    }
                    timeline_head +='<th colspan="'+tmp_width+'"></th>';
                    
                    th_i += tmp_width;
                }                   
            }

            //title and timeline
            $.each(defaultOptions.data,function(i,v){
                var td_index = 0;

                var begin = [];
                $.each(v.begin,function(key,val){
                    begin.push(key);
                });

                timeline_title += '<tr><td>';

                timeline_html +='<div class="multi-jtimeline-row">';

                $.each(v.name,function(index,value){
                    timeline_title += '<div>'+value.text+'</div>';

                    timeline_html += '<div class="multi-jtimeline-each-row"><div class="jtimeline-bg">\
                                    <table><tbody><tr><td class="jtimeline-unselect"></td></tr></tbody></table>\
                                    </div></div>';
                });

                timeline_title += '</td></tr><tr></tr>';

                timeline_html += '<div class="jtimeline-content-skeleton">\
                                    <table style="height:'+(28*v.name.length-8)+'px;"><tbody><tr id="jtlTr'+v.id+'">';

                //add timeline with data
                var recent_date = defaultOptions.begin;
                while(recent_date<=defaultOptions.end){
                    if(v.begin[recent_date]){
                        var val = v.value[v.begin[recent_date]];
                        var col = countDate(val.begin,val.end);

                        timeline_html +='<td id="'+v.begin[recent_date]+'" colspan="'+col+'" class="'+defaultOptions.status_map[val.status]+'" _status="'+val.status+'" _begin="'+val.begin+'" _end="'+val.end+'" _index="'+(td_index++)+'" title="'+val.text+'">'+val.text+'</td>';

                        begin.shift();

                        recent_date = getNextDate(val.end);
                    }else{
                        if(begin.length==0){
                            var col = countDate(recent_date,defaultOptions.end);

                            timeline_html +='<td id="0" colspan="'+col+'" _status="1" _begin="'+recent_date+'" _end="'+defaultOptions.end+'" _index="'+(td_index++)+'"></td>';
                                
                            recent_date = getNextDate(defaultOptions.end);
                        }else{
                            var preDate = getPreDate(begin[0]);
                            var col = countDate(recent_date,preDate);
                                
                            timeline_html +='<td id="0" colspan="'+col+'" _status="1" _begin="'+recent_date+'" _end="'+preDate+'" _index="'+(td_index++)+'"></td>';
                            recent_date = begin[0];
                        }                           
                    }
                }

                timeline_html +='</tr></tbody></table></div></div>';                
            });

            //init table frame
            el.append('<div class="multi-jtimeline-title"><table><thead><tr><th></th></tr></thead>\
                <tbody>'+timeline_title+'</tbody></table></div>\
                <div class="jtimeline-content"><table>\
                <thead><tr><td><div><table>\
                <thead><tr>'+timeline_head+'</tr></thead>\
                </table></div></td></tr></thead>\
                <tbody><tr><td><div class="tlcBody">'+timeline_html+'</div></td></tr></tbody>\
                </table></div>');

            //bind td click event
            el.delegate('.tlcBody td','click',function(){
                recent_id = $(this).parent().attr('id');
                var tds = $('#'+recent_id).find('td');

                tr = [];
                for(var i=0;i<tds.length;i++){
                    var col = $(tds[i]).attr('colspan')?parseInt($(tds[i]).attr('colspan')):1;
                    var val = parseInt($(tds[i]).attr('_status'));
                    var b = $(tds[i]).attr('_begin');
                    var e = $(tds[i]).attr('_end');
                    var text = $(tds[i]).text();
                    var id = $(tds[i]).attr('id');

                    tr.push({'id':id,'col':col,'status':val,'begin':b,'end':e,'text':text});
                }
                    
                var new_info = getTdInfo(this);
                if(defaultOptions.click){
                    defaultOptions.click(new_info);
                }
            });
        };

        //modify function
        this.modify = function(new_value){
            var new_status = new_value.new_status;
            var new_begin = new_value.new_begin;
            var new_end = new_value.new_end;
            var tdindex = new_value.tdindex;

            //whether modify timeline style
            if(old_begin==new_begin&&old_end==new_end&&old_status==new_status){
                return false;
            }

            //the only forbidden operation
            if(old_status!=1&&new_status==1&&(old_begin!=new_begin||old_end!=new_end)){
                alert('非法修改操作');
                return false;
            }

            //timeline validate function
            if(!timelineValidate(tdindex,new_begin,new_end,tr)){
                alert('日期范围不合法');
                return false;
            }

            //status=1=>status=1,needn't operate
            if(new_status==1&&old_status==1){
                return false;
            }

            //all operations valid,excute the commit function
            if(defaultOptions.commit){
                var cb_val = defaultOptions.commit(new_value);
            }else{
                alert('提交回调函数不能为空');
                return false;
            }

            $('#'+recent_id).empty();
            
            var i = 0;
            var length = tr.length;
            var new_tds = [];
            while(i<length){
                if(i==tdindex-1){
                    var v1 = tr[i];
                    var v2 = tr[tdindex];

                    if(1==v1.status){
                        if(1==new_status){
                            //three tds
                            if(tdindex+1<length){
                                var v3 = tr[tdindex+1];
                                //td1 td1 td1
                                if(1==v3.status){
                                    var num = countDate(v1.begin,v3.end);
                                    new_tds.push({'id':0,'col':num,'status':1,'begin':v1.begin,'end':v3.end,'text':''});
                                }else{
                                    //td1 td1 td!1
                                    var num = countDate(v1.begin,v2.end);
                                    new_tds.push({'id':0,'col':num,'status':1,'begin':v1.begin,'end':v2.end,'text':''});

                                    //draw tr[tdindex+1]
                                    new_tds.push(v3);
                                }
                            }else{
                                //td1 td1
                                var num = countDate(v1.begin,v2.end);
                                new_tds.push({'id':0,'col':num,'status':1,'begin':v1.begin,'end':v2.end,'text':''});
                            }
                        }else{
                            //first td is still existed,td1
                            if(v1.begin!=new_begin){
                                var preDate = getPreDate(new_begin);
                                var num = countDate(v1.begin,preDate);
                                new_tds.push({'id':1,'col':num,'status':1,'begin':v1.begin,'end':preDate,'text':''});
                            }

                            //draw tr[tdindex],td!1
                            var num = countDate(new_begin,new_end);
                            new_tds.push({'id':cb_val.id,'col':num,'status':new_status,'begin':new_begin,'end':new_end,'text':cb_val.text});

                            //three tds
                            if(tdindex+1<length){
                                var v3 = tr[tdindex+1];
                                //status=1
                                if(1==v3.status){
                                    //last td is still existed,td1
                                    if(new_end<v3.end){
                                        var nextDate = getNextDate(new_end);
                                        var num = countDate(nextDate,v3.end);
                                        new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':v3.end,'text':''});
                                    }
                                }else{
                                    //td1, tr[tdindex] => td!1 td1
                                    if(new_end!=v2.end){
                                        var nextDate = getNextDate(new_end);
                                        var num = countDate(nextDate,v2.end);
                                        new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':v2.end,'text':''});
                                    }

                                    //td!1
                                    new_tds.push(v3);
                                }
                            }else if(new_end<v2.end){
                                //two tds and tr[tdindex]=>td!1 td1 
                                var nextDate = getNextDate(new_end);
                                var num = countDate(nextDate,v2.end);
                                new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':v2.end,'text':''});
                            }
                        }
                    }else{
                        //first td, td!1
                        new_tds.push(v1);

                        if(1==new_status){
                            //three tds
                            if(tdindex+1<length){
                                var v3 = tr[tdindex+1];
                                if(1==v3.status){
                                    //merge and draw td1
                                    var num = countDate(new_begin,v3.end);
                                    new_tds.push({'id':0,'col':num,'status':1,'begin':new_begin,'end':v3.end,'text':''});
                                }else{
                                    //td1 td!1
                                    var num = countDate(new_begin,new_end);
                                    new_tds.push({'id':0,'col':num,'status':1,'begin':new_begin,'end':new_end,'text':''});

                                    new_tds.push(v3);
                                }
                            }else{
                                //td1 new_begin==old_begin & new_end==old_end
                                var num = countDate(new_begin,new_end);
                                new_tds.push({'id':0,'col':num,'status':1,'begin':new_begin,'end':new_end,'text':''});
                            }
                        }else{
                            //tr[tdindex].status!=1
                            //tr[tdindex]=>td1 td!1, this is td1
                            if(v2.begin<new_begin){
                                var preDate = getPreDate(new_begin);
                                var num = countDate(v2.begin,preDate);
                                new_tds.push({'id':0,'col':num,'status':1,'begin':v2.begin,'end':preDate,'text':''});
                            }

                            //new td!1
                            var num = countDate(new_begin,new_end);
                            new_tds.push({'id':cb_val.id,'col':num,'status':new_status,'begin':new_begin,'end':new_end,'text':cb_val.text});

                            //three tds
                            if(tdindex+1<length){
                                var v3 = tr[tdindex+1];
                                if(1==v3.status){
                                    //last td is still existed then merge, td1
                                    if(new_end<v3.end){
                                        var nextDate = getNextDate(new_end);
                                        var num = countDate(nextDate,v3.end);
                                        new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':v3.end,'text':''});
                                    }
                                }else{
                                    //td1 td!1
                                    if(new_end!=v2.end){
                                        var nextDate = getNextDate(new_end);
                                        var num = countDate(nextDate,v2.end);
                                        new_tds.push({'id':1,'col':num,'status':1,'begin':nextDate,'end':v2.end,'text':''});
                                    }

                                    new_tds.push(v3);
                                }
                            }else if(new_end<v2.end){
                                //two tds and tr[tdindex]=>td!1 td1
                                var nextDate = getNextDate(new_end);
                                var num = countDate(nextDate,v2.end);
                                new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':v2.end,'text':''});
                            }
                        }
                    }

                    i=tdindex+2;
                }else if(i==tdindex){   //tdindex==0
                    //tr[tdindex]=>td1 tdX
                    if(defaultOptions.begin<new_begin){
                        var preDate = getPreDate(new_begin);
                        var num = countDate(defaultOptions.begin,preDate);
                        new_tds.push({'id':0,'col':num,'status':1,'begin':defaultOptions.begin,'end':preDate,'text':''});
                    }                       

                    //two tds
                    if(tdindex+1<length){
                        var v1 = tr[tdindex];
                        var v2 = tr[tdindex+1];
                        var nextDate = getNextDate(new_end);

                        //new_end is earlier
                        if(new_end<=v1.end){
                            if(1==v2.status){
                                //merge tr[tdindex] td1 => td1
                                if(1==new_status){
                                    var num = countDate(new_begin,v2.end);
                                    new_tds.push({'id':0,'col':num,'status':1,'begin':new_begin,'end':v2.end,'text':''});
                                }else{
                                    //tr[tdindex] td1 => td!1 td1
                                    var num = countDate(new_begin,new_end);
                                    new_tds.push({'id':cb_val.id,'col':num,'status':new_status,'begin':new_begin,'end':new_end,'text':cb_val.text});

                                    var num = countDate(nextDate,v2.end);
                                    new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':v2.end,'text':''});
                                }
                            }else{
                                //td[tdindex] td!1 => td!1 td1 td!1
                                var num = countDate(new_begin,new_end);
                                new_tds.push({'id':cb_val.id,'col':num,'status':new_status,'begin':new_begin,'end':new_end,'text':cb_val.text});

                                if(new_end!=v1.end){
                                    var num = countDate(nextDate,v1.end);
                                    new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':v1.end,'text':''});
                                }                                   

                                new_tds.push(v2);
                            }
                        }else{
                            //new_end>v1.end
                            var num = countDate(new_begin,new_end);
                            new_tds.push({'id':cb_val.id,'col':num,'status':new_status,'begin':new_begin,'end':new_end,'text':cb_val.text});

                            if(new_end!=v2.end){
                                var num = countDate(nextDate,v2.end);
                                new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':v2.end,'text':''});
                            }
                        }
                    }else{
                        //only one td
                        var num = countDate(new_begin,new_end);
                        new_tds.push({'id':cb_val.id,'col':num,'status':new_status,'begin':new_begin,'end':new_end,'text':cb_val.text});

                        //only itself
                        if(new_end<defaultOptions.end){
                            var nextDate = getNextDate(new_end);
                            var num = countDate(nextDate,defaultOptions.end);
                            new_tds.push({'id':0,'col':num,'status':1,'begin':nextDate,'end':defaultOptions.end,'text':''});
                        }
                    }

                    i=tdindex+2;
                }else{
                    new_tds.push(tr[i++])
                }
            }

            $.each(new_tds,function(i,v){
                addTd(recent_id,i,v);
            });
        };

		return this;
	};
})(jQuery);