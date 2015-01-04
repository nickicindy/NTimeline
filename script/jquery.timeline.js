/*
 *	jquery timeline ext
 *	author nicknzhang
 *	email nicknzhang@tencent.com
 *   date 2014-10-17
 */

(function($) {
    $.fn.jTimeline = function() {
        var el = $(this),
            defaultOptions = {
                title: '',
                begin: '2014-01-01',
                end: '2015-06-31',
                data: [],
                status_map: {
                    0: '',
                    1: 'jtimeline-claim',
                    2: 'jtimeline-related'
                },
                //callback function
                click: null,
                checkbox: false
            },
            //global variables,needn't init
            tr = [],
            recent_id = 0,
            old_id = 0,
            old_begin = '',
            old_end = '',
            old_status = 0,
            recent_td = {},

            //add one new td
            //v={'id':'10020001','col':5,'status':1,'begin':'2014-10-10','end':'2014-10-20','text':'hello world'}
            addTd = function(id, index, v) {
                $('#' + id).append('<td id="' + v.id + '" colspan="' + v.col + '" class="' + defaultOptions.status_map[v.status] + '" _begin="' + v.begin + '" _end="' + v.end + '" _status="' + v.status + '" _index="' + index + '" _fatherid="' + v.fatherid + '" _fathername="' + v.fathername + '"><span class="help-point" _tips="' + v.text + '">' + v.text + '</span></td>');
            },
            //calculate days between two days
            countDate = function(start, end) {
                if (start == null || start.length == 0 || end == null || end.length == 0) {
                    return 0;
                }

                var arr = start.split("-");
                var starttime = new Date(arr[0], parseInt(arr[1] - 1), arr[2]);
                var starttimes = starttime.getTime();

                var arrs = end.split("-");
                var endtime = new Date(arrs[0], parseInt(arrs[1] - 1), arrs[2]);
                var endtimes = endtime.getTime();

                var intervalTime = endtimes - starttimes;
                var Inter_Days = ((intervalTime).toFixed(2) / 86400000) + 1;

                return Inter_Days;
            },
            //get previous day of one day
            getPreDate = function(date) {
                var arr = date.split("-");
                var datetime = new Date(arr[0], parseInt(arr[1] - 1), arr[2]);
                var preDate = new Date(datetime.getTime() - 86400000);
                var year = preDate.getFullYear();
                var month = (preDate.getMonth() < 9 ? '0' + (preDate.getMonth() + 1) : preDate.getMonth() + 1);
                var day = preDate.getDate() < 10 ? '0' + preDate.getDate() : preDate.getDate();

                return year + '-' + month + '-' + day;
            }
            //get next day of one day
        getNextDate = function(date) {
            var arr = date.split("-");
            var datetime = new Date(arr[0], parseInt(arr[1] - 1), arr[2]);
            var nextDate = new Date(datetime.getTime() + 86400000);
            var year = nextDate.getFullYear();
            var month = (nextDate.getMonth() < 9 ? '0' + (nextDate.getMonth() + 1) : nextDate.getMonth() + 1);
            var day = nextDate.getDate() < 10 ? '0' + nextDate.getDate() : nextDate.getDate();

            return year + '-' + month + '-' + day;
        };
        //get some day from one day
        getSomeDate = function(date, i) {
            var arr = date.split("-");
            var datetime = new Date(arr[0], parseInt(arr[1] - 1), arr[2]);
            var someDate = new Date(datetime.getTime() + i * 86400000);
            var year = someDate.getFullYear();
            var month = (someDate.getMonth() < 9 ? '0' + (someDate.getMonth() + 1) : someDate.getMonth() + 1);
            var day = someDate.getDate() < 10 ? '0' + someDate.getDate() : someDate.getDate();

            return year + '-' + month + '-' + day;
        },
        timelineValidate = function(tdindex, new_begin, new_end, tr) {
            var flag = true;
            //begin must be earlier than or equal to end
            if (new_begin > new_end) {
                // alert('开始时间不能大于结束时间');
                return false;
            }

            //beyond the valid time range
            if (new_begin < defaultOptions.begin || new_end > defaultOptions.end) {
                // alert('超出可选时间范围');
                return false;
            }

            $.each(tr, function(i, v) {
                if (v.begin > new_end) {
                    return false;
                } else {
                    if (v.begin >= new_begin || v.end >= new_begin) {
                        if (v.status != 1 && i != tdindex) {
                            flag = false;
                            return false;
                        }
                    }
                }
            });

            return flag;
        },
        getTdInfo = function(td) {
            old_id = $(td).attr('id');
            old_begin = $(td).attr('_begin');
            old_end = $(td).attr('_end');
            old_status = parseInt($(td).attr('_status'));
            return {
                id: old_id,
                status: old_status,
                begin: old_begin,
                end: old_end,
                tdindex: $(td).attr('_index'),
                fatherid: $(td).attr('_fatherid'),
                fathername: $(td).attr('_fathername')
            };
        };

        getMulTdInfo = function(td) {
            old_id = $(td).attr('id');
            old_begin = $(td).attr('_begin');
            old_end = $(td).attr('_end');
            old_status = parseInt($(td).attr('_status'));
            return {
                id: old_id,
                status: old_status,
                begin: old_begin,
                end: old_end,
                tdindex: $(td).attr('_index'),
                fatherid: $(td).attr('_fatherid'),
                fathername: $(td).attr('_fathername'),
                bigid: $(td).attr('_bigid'),
                bigname: $(td).attr('_bigname'),
                smallid: $(td).attr('_smallid'),
                smallname: $(td).attr('_smallname'),
            };
        };

        this.modifyLine = function(v) {
            var td_index = 0;
            var begin = [];
            $.each(v.begin, function(key, val) {
                begin.push(key);
            });
            var trid = 'jtlTr' + v.id;

            var recent_date = defaultOptions.begin;
            var timeline_html = '';
            while (recent_date <= defaultOptions.end) {
                if (v.begin[recent_date]) {
                    var val = v.value[v.begin[recent_date]];
                    var col = countDate(val.begin, val.end);
                    timeline_html += '<td id="' + v.begin[recent_date] + '" colspan="' + col + '" class="' + defaultOptions.status_map[val.status] + '" _status="' + val.status + '" _begin="' + val.begin + '" _end="' + val.end + '" _index="' + (td_index++) + '" _fatherid="' + v.id + '" _fathername="' + v.name + '"><span class="help-point" _tips="' + val.text + '">' + val.text + '</span></td>';
                    begin.shift();
                    recent_date = getNextDate(val.end);
                } else {
                    if (begin.length == 0) {
                        var col = countDate(recent_date, defaultOptions.end);
                        timeline_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + recent_date + '" _end="' + defaultOptions.end + '" _index="' + (td_index++) + '" _fatherid="' + v.id + '" _fathername="' + v.name + '"></td>';
                        recent_date = getNextDate(defaultOptions.end);
                    } else {
                        var preDate = getPreDate(begin[0]);
                        var col = countDate(recent_date, preDate);
                        timeline_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + recent_date + '" _end="' + preDate + '" _index="' + (td_index++) + '" _fatherid="' + v.id + '" _fathername="' + v.name + '"></td>';
                        recent_date = begin[0];
                    }
                }
            }
            $("#" + trid).empty().append(timeline_html);
        };

        //init single timeline
        this.single = function(options) {
            var _self = this;

            $.extend(true, defaultOptions, options);

            // var length = countDate(defaultOptions.begin,defaultOptions.end);

            //colspan of one th
            // var th_width = Math.ceil(90*length/(el.width()-130));
            // var th_interval = Math.ceil(length/4);

            var timeline_title = '';
            var timeline_html = '';
            var timeline_head = '';

            //timeline date th
            // var th_i = 0;
            // while(th_i<length){
            //     if(th_i%th_interval==0&&th_i+th_width<length){
            //         timeline_head +='<th colspan="'+th_width+'">'+getSomeDate(defaultOptions.begin,th_i)+'</th>';
            //         th_i +=th_width;
            //     }else{
            //         if(th_i+th_interval-th_width<length){
            //             var tmp_width = th_interval-th_width;
            //         }else{
            //             var tmp_width = length-th_i;
            //         }
            //         timeline_head +='<th colspan="'+tmp_width+'"></th>';

            //         th_i += tmp_width;
            //     }                   
            // }

            //new timeline date th
            var tmp_date = defaultOptions.begin;
            while (tmp_date < defaultOptions.end) {
                timeline_head += '<div class="jtimeline-content-thead-th">' + tmp_date + '</div>';

                var new_date = getSomeDate(tmp_date, 31);
                new_date_array = new_date.split("-");

                tmp_date = new_date_array[0] + '-' + new_date_array[1] + '-' + '01';
            }

            //title and timeline
            $.each(defaultOptions.data, function(i, v) {
                var td_index = 0,
                    earlier_begin = false;

                var begin = v.begin_arr;

                //judge boundary
                if (begin.length > 0 && defaultOptions.begin > begin[0]) {
                    earlier_begin = true;
                }

                timeline_title += '<tr><td><div class="jtimeline-title-td">' + (defaultOptions.checkbox ? '<input type="checkbox"  name="jtimeline-title-id" value="' + v.id + '">' : '') + '<span class="help-point" _tips="' + v.name + '">' + v.name + '</span></div></td></tr>';

                timeline_html += '<div class="jtimeline-row"><div class="jtimeline-bg">\
                                    <table><tbody><tr><td class="jtimeline-unselect"></td></tr></tbody></table>\
                                    </div><div class="jtimeline-content-skeleton">\
                                    <table><tbody><tr id="jtlTr' + v.id + '">';

                //add timeline with data
                var recent_date = defaultOptions.begin;
                while (recent_date <= defaultOptions.end) {
                    //first td
                    if (earlier_begin && td_index == 0) {
                        recent_date = begin[0];
                    }

                    if (v.begin[recent_date]) {
                        var val = v.value[v.begin[recent_date]];

                        //first td
                        if (earlier_begin && td_index == 0) {
                            var recent_begin = defaultOptions.begin;
                        } else {
                            var recent_begin = val.begin;
                        }

                        if (val.end > defaultOptions.end) {
                            var recent_end = defaultOptions.end;
                        } else {
                            var recent_end = val.end;
                        }

                        var col = countDate(recent_begin, recent_end);

                        timeline_html += '<td id="' + v.begin[recent_date] + '" colspan="' + col + '" class="' + defaultOptions.status_map[val.status] + '" _status="' + val.status + '" _begin="' + val.begin + '" _end="' + val.end + '" _index="' + (td_index++) + '" _fatherid="' + v.id + '" _fathername="' + v.name + '"><span class="help-point" _tips="' + val.text + '">' + val.text + '</span></td>';

                        begin.shift();

                        recent_date = getNextDate(val.end);
                    } else {
                        if (begin.length == 0) {
                            var col = countDate(recent_date, defaultOptions.end);

                            timeline_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + recent_date + '" _end="' + defaultOptions.end + '" _index="' + (td_index++) + '" _fatherid="' + v.id + '" _fathername="' + v.name + '"></td>';

                            recent_date = getNextDate(defaultOptions.end);
                        } else {
                            var preDate = getPreDate(begin[0]);
                            var col = countDate(recent_date, preDate);

                            timeline_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + recent_date + '" _end="' + preDate + '" _index="' + (td_index++) + '" _fatherid="' + v.id + '" _fathername="' + v.name + '"></td>';
                            recent_date = begin[0];
                        }
                    }
                }

                timeline_html += '</tr></tbody></table></div></div>';
            });

            //init table frame
            el.empty().append('<div class="jtimeline-title"><div style="height:32px;">' + (defaultOptions.checkbox ? '<input type="checkbox" id="jtimeline-check-all" style="cursor:pointer;">全选' : '') + '</div><div class="jtimeline-title-line"><table class="jtimeline-title-line-table">\
                <tbody>' + timeline_title + '</tbody></table></div></div>\
                <div class="jtimeline-content"><div class="jtimeline-content-thead">' + timeline_head + '</div>\
                <div class="jtimeline-content-line"><table class="jtimeline-content-table">\
                <tbody><tr><td><div class="tlcBody">' + timeline_html + '</div></td></tr></tbody>\
                </table></div></div>');

            //bind checkall event
            if (defaultOptions.checkbox) {
                $('#jtimeline-check-all').unbind('click');
                $('#jtimeline-check-all').bind('click', function() {
                    if ($(this).prop('checked')) {
                        $('input[name="jtimeline-title-id"]').prop('checked', true);
                    } else {
                        $('input[name="jtimeline-title-id"]').prop('checked', false);
                    }
                });
            }

            //bind td click event
            el.undelegate('.tlcBody td', 'click');
            el.delegate('.tlcBody td', 'click', function() {
                recent_id = $(this).parent().attr('id');
                var tds = $('#' + recent_id).find('td');

                tr = [];
                for (var i = 0; i < tds.length; i++) {
                    var col = $(tds[i]).attr('colspan') ? parseInt($(tds[i]).attr('colspan')) : 1;
                    var val = parseInt($(tds[i]).attr('_status'));
                    var b = $(tds[i]).attr('_begin');
                    var e = $(tds[i]).attr('_end');
                    var text = $(tds[i]).text();
                    var id = $(tds[i]).attr('id');

                    tr.push({
                        'id': id,
                        'col': col,
                        'status': val,
                        'begin': b,
                        'end': e,
                        'text': text
                    });
                }
                var new_info = getTdInfo(this);
                if (defaultOptions.click) {
                    defaultOptions.click(new_info);
                }
            });
        };

        this.mulModifyLine = function(v) {
            var multrid = v.father_id;
            var trid = v.id.replace(/\,/g, '');
            var need_id = $("#jtlMulRow" + multrid).find('#jtlRow' + trid)[0];
            $(need_id).empty();
            var timeline_html = '';
            timeline_html += '<div class="jtimeline-bg"><table><tbody><tr><td class="jtimeline-unselect"></td></tr></tbody></table></div><div class="jtimeline-content-skeleton"><table><tbody><tr>';

            var td_index = 0,
                earlier_begin = false;
            var begin = [];
            $.each(v.begin, function(key, val) {
                begin.push(key);
            });

            //judge boundary
            if (begin.length > 0 && defaultOptions.begin > begin[0]) {
                earlier_begin = true;
            }

            //add timeline with data
            var recent_date = defaultOptions.begin;
            while (recent_date <= defaultOptions.end) {
                //first td
                if (earlier_begin && td_index == 0) {
                    recent_date = begin[0];
                }
                if (v.begin[recent_date]) {
                    var val = v.value[v.begin[recent_date]];
                    //first td
                    if (earlier_begin && td_index == 0) {
                        var recent_begin = defaultOptions.begin;
                    } else {
                        var recent_begin = val.begin;
                    }

                    if (val.end > defaultOptions.end) {
                        var recent_end = defaultOptions.end;
                    } else {
                        var recent_end = val.end;
                    }
                    var col = countDate(recent_begin, recent_end);
                    timeline_html += '<td id="' + v.begin[recent_date] + '" colspan="' + col + '" class="' + defaultOptions.status_map[val.status] + '" _status="' + val.status + '" _begin="' + val.begin + '" _end="' + val.end + '" _index="' + (td_index++) + '" _bigid="' + v.father_id + '" _bigname="' + v.father_name + '" _smallid="' + v.id + '" _smallname="' + v.name + '" _fatherid="' + v.father_id + '" _fathername="' + v.id + '"><span class="help-point" _tips="' + val.text + '">' + val.text + '</span></td>';
                    begin.shift();
                    recent_date = getNextDate(val.end);
                } else {
                    if (begin.length == 0) {
                        var col = countDate(recent_date, defaultOptions.end);
                        timeline_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + recent_date + '" _end="' + defaultOptions.end + '" _index="' + (td_index++) + '" _bigid="' + v.father_id + '" _bigname="' + v.father_name + '" _smallid="' + v.id + '" _smallname="' + v.name + '" _fatherid="' + v.father_id + '" _fathername="' + v.id + '"></td>';
                        recent_date = getNextDate(defaultOptions.end);
                    } else {
                        var preDate = getPreDate(begin[0]);
                        var col = countDate(recent_date, preDate);
                        timeline_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + recent_date + '" _end="' + preDate + '" _index="' + (td_index++) + '" _bigid="' + v.father_id + '" _bigname="' + v.father_name + '" _smallid="' + v.id + '" _smallname="' + v.name + '" _fatherid="' + v.father_id + '" _fathername="' + v.id + '"></td>';
                        recent_date = begin[0];
                    }
                }
            }
            timeline_html += '</tr></tbody></table></div>';
            $(need_id).append(timeline_html);
        };

        //init multiple timeline
        this.multiple = function(options) {
            var _self = this;

            $.extend(true, defaultOptions, options);

            var timeline_title = '';
            var timeline_html = '';
            var timeline_head = '';

            //new timeline date th
            var tmp_date = defaultOptions.begin;
            while (tmp_date < defaultOptions.end) {
                timeline_head += '<div class="jtimeline-content-thead-th">' + tmp_date + '</div>';

                var new_date = getSomeDate(tmp_date, 31);
                new_date_array = new_date.split("-");

                tmp_date = new_date_array[0] + '-' + new_date_array[1] + '-' + '01';
            }

            //title and timeline
            $.each(defaultOptions.data, function(index, value) {
                var name_length = value.name.length;
                //left title
                timeline_title += '<tr><td><div class="jtimeline-title-td">' + value.name + ':</div></td><td id="jtlTd' + value.id + '">';

                timeline_html += '<div id="jtlMulRow' + value.id + '" class="multi-jtimeline-row">';
                //a set of items,draw timeline
                $.each(value.items, function(i, v) {
                    var tmp_id = v.id.replace(/\,/g, '');

                    timeline_title += '<div class="jtimeline-name-td" _titleid="' + value.id + '" _title="' + value.name + '" id="' + tmp_id + '" _value="' + v.id + '"><img _index="' + value.id + '" class="' + (v.name == "默认规则" ? "add-line-button" : "delete-line-button") + '" src="../images/' + (v.name == "默认规则" ? "add-icon.png" : "delete-icon.png") + '"><span class="help-point" _tips="' + v.name + '">' + v.name + '</span></div>';
                    var td_index = 0,
                        earlier_begin = false;
                    var begin = v.begin_arr;

                    //judge boundary
                    if (begin.length > 0 && defaultOptions.begin > begin[0]) {
                        earlier_begin = true;
                    }

                    timeline_html += '<div id="jtlRow' + tmp_id + '" class="multi-jtimeline-each-row"><div class="jtimeline-bg">\
                                    <table><tbody><tr><td class="jtimeline-unselect"></td></tr></tbody></table>\
                                    </div><div class="jtimeline-content-skeleton">\
                                    <table><tbody><tr>';

                    //add timeline with data
                    var recent_date = defaultOptions.begin;

                    while (recent_date <= defaultOptions.end) {
                        //first td
                        if (earlier_begin && td_index == 0) {
                            recent_date = begin[0];
                        }

                        if (v.begin[recent_date]) {
                            var val = v.value[v.begin[recent_date]];

                            //first td
                            if (earlier_begin && td_index == 0) {
                                var recent_begin = defaultOptions.begin;
                            } else {
                                var recent_begin = val.begin;
                            }

                            if (val.end > defaultOptions.end) {
                                var recent_end = defaultOptions.end;
                            } else {
                                var recent_end = val.end;
                            }

                            var col = countDate(recent_begin, recent_end);

                            timeline_html += '<td id="' + v.begin[recent_date] + '" colspan="' + col + '" class="' + defaultOptions.status_map[val.status] + '" _status="' + val.status + '" _begin="' + val.begin + '" _end="' + val.end + '" _index="' + (td_index++) + '" _bigid="' + value.id + '" _bigname="' + value.name + '" _smallid="' + v.id + '" _smallname="' + v.name + '" _fatherid="' + value.id + '" _fathername="' + v.id + '"><span class="help-point" _tips="' + val.text + '">' + val.text + '</span></td>';

                            begin.shift();

                            recent_date = getNextDate(val.end);
                        } else {
                            if (begin.length == 0) {
                                var col = countDate(recent_date, defaultOptions.end);

                                timeline_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + recent_date + '" _end="' + defaultOptions.end + '" _index="' + (td_index++) + '" _bigid="' + value.id + '" _bigname="' + value.name + '" _smallid="' + v.id + '" _smallname="' + v.name + '" _fatherid="' + value.id + '" _fathername="' + v.id + '"></td>';

                                recent_date = getNextDate(defaultOptions.end);
                            } else {
                                var preDate = getPreDate(begin[0]);
                                var col = countDate(recent_date, preDate);

                                timeline_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + recent_date + '" _end="' + preDate + '" _index="' + (td_index++) + '" _bigid="' + value.id + '" _bigname="' + value.name + '" _smallid="' + v.id + '" _smallname="' + v.name + '" _fatherid="' + value.id + '" _fathername="' + v.id + '"></td>';
                                recent_date = begin[0];
                            }
                        }
                    }
                    timeline_html += '</tr></tbody></table></div></div>';
                });
                timeline_title += '</td></tr><tr></tr>';
                timeline_html += '</div>';
            });

            // //init table frame
            el.empty().append('<div class="multi-jtimeline-title"><div style="height:32px;"></div><div class="jtimeline-title-line"><table class="jtimeline-title-line-table">\
                <tbody>' + timeline_title + '</tbody></table></div></div>\
                <div class="multi-jtimeline-content"><div class="jtimeline-content-thead">' + timeline_head + '</div>\
                <div class="jtimeline-content-line"><table class="jtimeline-content-table">\
                <tbody><tr><td><div class="tlcBody">' + timeline_html + '</div></td></tr></tbody>\
                </table></div></div>');

            //bind td click event
            el.undelegate('.tlcBody td', 'click');
            el.delegate('.tlcBody td', 'click', function() {
                recent_id = $(this).parent().attr('id');
                var tds = $('#' + recent_id).find('td');

                tr = [];
                for (var i = 0; i < tds.length; i++) {
                    var col = $(tds[i]).attr('colspan') ? parseInt($(tds[i]).attr('colspan')) : 1;
                    var val = parseInt($(tds[i]).attr('_status'));
                    var b = $(tds[i]).attr('_begin');
                    var e = $(tds[i]).attr('_end');
                    var text = $(tds[i]).text();
                    var id = $(tds[i]).attr('id');

                    tr.push({
                        'id': id,
                        'col': col,
                        'status': val,
                        'begin': b,
                        'end': e,
                        'text': text
                    });
                }

                var new_info = getMulTdInfo(this);
                if (defaultOptions.click) {
                    defaultOptions.click(new_info);
                }
            });

            el.undelegate('.jtimeline-name-td img', 'click');
            el.delegate('.jtimeline-name-td img', 'click', function() {
                //add one line
                if ($(this).hasClass('add-line-button')) {
                    recent_td = {
                        titleid: $(this).parent().attr('_titleid'),
                        title: $(this).parent().attr('_title'),
                        id: $(this).parent().attr('id'),
                        index: $(this).attr('_index')
                    };
                    defaultOptions.add(recent_td);
                } else if ($(this).hasClass('delete-line-button')) {
                    var delete_line = {
                        titleid: $(this).parent().attr('_titleid'),
                        title: $(this).parent().attr('_title'),
                        id: $(this).parent().attr('_value'),
                        city: $(this).parent().attr('title')
                    };
                    var tmp_id = $(this).parent().attr('id');

                    //delete one line
                    defaultOptions.reduce(delete_line, $(this).parent());
                }
            });
        };

        //modify function
        this.modify = function(new_value) {
            var new_status = new_value.new_status;
            var new_begin = new_value.new_begin;
            var new_end = new_value.new_end;
            var tdindex = parseInt(new_value.tdindex);
            var fatherid = new_value.fatherid;
            var fathername = new_value.fathername;
            var new_id = new_value.new_id;
            var new_title = new_value.new_title;

            //whether modify timeline style
            if (old_begin == new_begin && old_end == new_end && old_status == new_status) {
                return false;
            }

            //the only forbidden operation
            // if (old_status != 0 && new_status == 0 && (old_begin != new_begin || old_end != new_end)) {
            //     alert('非法修改操作');
            //     return false;
            // }

            //timeline validate function
            // if (!timelineValidate(tdindex, new_begin, new_end, tr)) {
            //     alert('日期范围不合法');
            //     return false;
            // }

            //status=0=>status=0,needn't operate
            if (new_status == 0 && old_status == 0) {
                return false;
            }

            //all operations valid,excute the commit function
            // if(defaultOptions.commit){
            //     var cb_val = defaultOptions.commit(new_value);
            // }else{
            //     alert('提交回调函数不能为空');
            //     return false;
            // }

            $('#' + recent_id).empty();

            var i = 0;
            var length = tr.length;
            var new_tds = [];
            while (i < length) {
                if (i == tdindex - 1) {
                    var v1 = tr[i];
                    var v2 = tr[tdindex];

                    if (0 == v1.status) {
                        if (0 == new_status) {
                            //three tds
                            if (tdindex + 1 < length) {
                                var v3 = tr[tdindex + 1];
                                //td0 td0 td0
                                if (0 == v3.status) {
                                    var num = countDate(v1.begin, v3.end);
                                    new_tds.push({
                                        'id': 0,
                                        'col': num,
                                        'status': 0,
                                        'begin': v1.begin,
                                        'end': v3.end,
                                        'text': '',
                                        fatherid: new_value.fatherid,
                                        fathername: new_value.fathername
                                    });
                                } else {
                                    //td0 td0 td!0
                                    var num = countDate(v1.begin, v2.end);
                                    new_tds.push({
                                        'id': 0,
                                        'col': num,
                                        'status': 0,
                                        'begin': v1.begin,
                                        'end': v2.end,
                                        'text': '',
                                        fatherid: new_value.fatherid,
                                        fathername: new_value.fathername
                                    });

                                    //draw tr[tdindex+1]
                                    new_tds.push(v3);
                                }
                            } else {
                                //td0 td0
                                var num = countDate(v1.begin, v2.end);
                                new_tds.push({
                                    'id': 0,
                                    'col': num,
                                    'status': 0,
                                    'begin': v1.begin,
                                    'end': v2.end,
                                    'text': '',
                                    fatherid: new_value.fatherid,
                                    fathername: new_value.fathername
                                });
                            }
                        } else {
                            //first td is still existed,td1
                            if (v1.begin < new_begin) {
                                var preDate = getPreDate(new_begin);
                                var num = countDate(v1.begin, preDate);
                                new_tds.push({
                                    'id': 0,
                                    'col': num,
                                    'status': 0,
                                    'begin': v1.begin,
                                    'end': preDate,
                                    'text': '',
                                    fatherid: new_value.fatherid,
                                    fathername: new_value.fathername
                                });
                            }

                            //draw td[tdindex],td!1
                            if (new_begin < defaultOptions.begin) {
                                var recent_begin = defaultOptions.begin;
                            } else {
                                var recent_begin = new_begin;
                            }

                            if (new_end > defaultOptions.end) {
                                var recent_end = defaultOptions.end;
                            } else {
                                var recent_end = new_end;
                            }
                            var num = countDate(recent_begin, recent_end);
                            new_tds.push({
                                'id': new_id,
                                'col': num,
                                'status': new_status,
                                'begin': new_begin,
                                'end': new_end,
                                'text': new_title,
                                fatherid: new_value.fatherid,
                                fathername: new_value.fathername
                            });

                            //three tds
                            if (tdindex + 1 < length) {
                                var v3 = tr[tdindex + 1];
                                //status=0
                                if (0 == v3.status) {
                                    //last td is still existed,td1
                                    if (new_end < v3.end) {
                                        var nextDate = getNextDate(new_end);
                                        var num = countDate(nextDate, v3.end);
                                        new_tds.push({
                                            'id': 0,
                                            'col': num,
                                            'status': 0,
                                            'begin': nextDate,
                                            'end': v3.end,
                                            'text': '',
                                            fatherid: new_value.fatherid,
                                            fathername: new_value.fathername
                                        });
                                    }
                                } else {
                                    //td1, tr[tdindex] => td!1 td1
                                    if (new_end < v2.end) {
                                        var nextDate = getNextDate(new_end);
                                        var num = countDate(nextDate, v2.end);
                                        new_tds.push({
                                            'id': 0,
                                            'col': num,
                                            'status': 0,
                                            'begin': nextDate,
                                            'end': v2.end,
                                            'text': '',
                                            fatherid: new_value.fatherid,
                                            fathername: new_value.fathername
                                        });
                                    }

                                    //td!1
                                    new_tds.push(v3);
                                }
                            } else if (new_end < v2.end) {
                                //two tds and tr[tdindex]=>td!1 td1 
                                var nextDate = getNextDate(new_end);
                                if (v2.end > defaultOptions.end) {
                                    var recent_end = defaultOptions.end;
                                } else {
                                    var recent_end = v2.end;
                                }
                                var num = countDate(nextDate, recent_end);
                                new_tds.push({
                                    'id': 0,
                                    'col': num,
                                    'status': 0,
                                    'begin': nextDate,
                                    'end': v2.end,
                                    'text': '',
                                    fatherid: new_value.fatherid,
                                    fathername: new_value.fathername
                                });
                            }
                        }
                    } else {
                        //first td, td!0
                        new_tds.push(v1);

                        if (0 == new_status) {
                            //three tds
                            if (tdindex + 1 < length) {
                                var v3 = tr[tdindex + 1];
                                if (0 == v3.status) {
                                    //merge and draw td0
                                    var num = countDate(new_begin, v3.end);
                                    new_tds.push({
                                        'id': 0,
                                        'col': num,
                                        'status': 0,
                                        'begin': new_begin,
                                        'end': v3.end,
                                        'text': '',
                                        fatherid: new_value.fatherid,
                                        fathername: new_value.fathername
                                    });
                                } else {
                                    //td0 td!0
                                    var num = countDate(new_begin, new_end);
                                    new_tds.push({
                                        'id': 0,
                                        'col': num,
                                        'status': 0,
                                        'begin': new_begin,
                                        'end': new_end,
                                        'text': '',
                                        fatherid: new_value.fatherid,
                                        fathername: new_value.fathername
                                    });

                                    new_tds.push(v3);
                                }
                            } else {
                                //td0 new_begin==old_begin & new_end==old_end
                                if (new_end > defaultOptions.end) {
                                    var recent_end = defaultOptions.end;
                                } else {
                                    var recent_end = new_end;
                                }
                                var num = countDate(new_begin, recent_end);
                                new_tds.push({
                                    'id': 0,
                                    'col': num,
                                    'status': 0,
                                    'begin': new_begin,
                                    'end': new_end,
                                    'text': '',
                                    fatherid: new_value.fatherid,
                                    fathername: new_value.fathername
                                });
                            }
                        } else {
                            //tr[tdindex].status!=1
                            //tr[tdindex]=>td1 td!1, this is td1
                            if (v2.begin < new_begin) {
                                var preDate = getPreDate(new_begin);
                                var num = countDate(v2.begin, preDate);
                                new_tds.push({
                                    'id': 0,
                                    'col': num,
                                    'status': 0,
                                    'begin': v2.begin,
                                    'end': preDate,
                                    'text': '',
                                    fatherid: new_value.fatherid,
                                    fathername: new_value.fathername
                                });
                            }

                            //new td!1
                            if (new_end > defaultOptions.end) {
                                var recent_end = defaultOptions.end;
                            } else {
                                var recent_end = new_end;
                            }
                            var num = countDate(new_begin, recent_end);
                            new_tds.push({
                                'id': new_id,
                                'col': num,
                                'status': new_status,
                                'begin': new_begin,
                                'end': new_end,
                                'text': new_title,
                                fatherid: new_value.fatherid,
                                fathername: new_value.fathername
                            });

                            //three tds
                            if (tdindex + 1 < length) {
                                var v3 = tr[tdindex + 1];
                                if (0 == v3.status) {
                                    //last td is still existed then merge, td1
                                    if (new_end < v3.end) {
                                        var nextDate = getNextDate(new_end);
                                        var num = countDate(nextDate, v3.end);
                                        new_tds.push({
                                            'id': 0,
                                            'col': num,
                                            'status': 0,
                                            'begin': nextDate,
                                            'end': v3.end,
                                            'text': '',
                                            fatherid: new_value.fatherid,
                                            fathername: new_value.fathername
                                        });
                                    }
                                } else {
                                    //td1 td!1
                                    if (new_end < v2.end) {
                                        var nextDate = getNextDate(new_end);
                                        var num = countDate(nextDate, v2.end);
                                        new_tds.push({
                                            'id': 0,
                                            'col': num,
                                            'status': 0,
                                            'begin': nextDate,
                                            'end': v2.end,
                                            'text': '',
                                            fatherid: new_value.fatherid,
                                            fathername: new_value.fathername
                                        });
                                    }

                                    new_tds.push(v3);
                                }
                            } else if (new_end < v2.end && new_end < defaultOptions.end) {
                                //two tds and tr[tdindex]=>td!1 td1
                                var nextDate = getNextDate(new_end);
                                if (v2.end > defaultOptions.end) {
                                    var recent_end = defaultOptions.end;
                                } else {
                                    var recent_end = v2.end;
                                }
                                var num = countDate(nextDate, recent_end);
                                new_tds.push({
                                    'id': 0,
                                    'col': num,
                                    'status': 0,
                                    'begin': nextDate,
                                    'end': v2.end,
                                    'text': '',
                                    fatherid: new_value.fatherid,
                                    fathername: new_value.fathername
                                });
                            }
                        }
                    }

                    i = tdindex + 2;
                } else if (i == tdindex) { //tdindex==0
                    //tr[tdindex]=>td1 tdX
                    if (defaultOptions.begin < new_begin) {
                        var preDate = getPreDate(new_begin);
                        var num = countDate(defaultOptions.begin, preDate);
                        new_tds.push({
                            'id': 0,
                            'col': num,
                            'status': 0,
                            'begin': defaultOptions.begin,
                            'end': preDate,
                            'text': '',
                            fatherid: new_value.fatherid,
                            fathername: new_value.fathername
                        });
                    }

                    //two tds
                    if (tdindex + 1 < length) {
                        var v1 = tr[tdindex];
                        var v2 = tr[tdindex + 1];
                        var nextDate = getNextDate(new_end);

                        //new_end is earlier
                        if (new_end <= v1.end) {
                            if (0 == v2.status) {
                                //merge tr[tdindex] td1 => td1
                                if (0 == new_status) {
                                    if (new_begin < defaultOptions.begin) {
                                        var recent_begin = defaultOptions.begin;
                                    } else {
                                        var recent_begin = new_begin;
                                    }
                                    var num = countDate(recent_begin, v2.end);
                                    new_tds.push({
                                        'id': 0,
                                        'col': num,
                                        'status': 0,
                                        'begin': new_begin,
                                        'end': v2.end,
                                        'text': '',
                                        fatherid: new_value.fatherid,
                                        fathername: new_value.fathername
                                    });
                                } else {
                                    //tr[tdindex] td1 => td!1 td1
                                    if (new_begin < defaultOptions.begin) {
                                        var recent_begin = defaultOptions.begin;
                                    } else {
                                        var recent_begin = new_begin;
                                    }

                                    var num = countDate(recent_begin, new_end);
                                    new_tds.push({
                                        'id': new_id,
                                        'col': num,
                                        'status': new_status,
                                        'begin': new_begin,
                                        'end': new_end,
                                        'text': new_title,
                                        fatherid: new_value.fatherid,
                                        fathername: new_value.fathername
                                    });

                                    var num = countDate(nextDate, v2.end);
                                    new_tds.push({
                                        'id': 0,
                                        'col': num,
                                        'status': 0,
                                        'begin': nextDate,
                                        'end': v2.end,
                                        'text': '',
                                        fatherid: new_value.fatherid,
                                        fathername: new_value.fathername
                                    });
                                }
                            } else {
                                //td[tdindex] td!1 => td!1 td1 td!1
                                if (new_begin < defaultOptions.begin) {
                                    var recent_begin = defaultOptions.begin;
                                } else {
                                    var recent_begin = new_begin;
                                }

                                var num = countDate(recent_begin, new_end);
                                new_tds.push({
                                    'id': new_id,
                                    'col': num,
                                    'status': new_status,
                                    'begin': new_begin,
                                    'end': new_end,
                                    'text': new_title,
                                    fatherid: new_value.fatherid,
                                    fathername: new_value.fathername
                                });

                                if (new_end < v1.end) {
                                    var num = countDate(nextDate, v1.end);
                                    new_tds.push({
                                        'id': 0,
                                        'col': num,
                                        'status': 0,
                                        'begin': nextDate,
                                        'end': v1.end,
                                        'text': '',
                                        fatherid: new_value.fatherid,
                                        fathername: new_value.fathername
                                    });
                                }

                                new_tds.push(v2);
                            }
                        } else {
                            //new_end>v1.end
                            if (new_begin < defaultOptions.begin) {
                                var recent_begin = defaultOptions.begin;
                            } else {
                                var recent_begin = new_begin;
                            }

                            if (new_end > defaultOptions.end) {
                                var recent_end = defaultOptions.end;
                            } else {
                                var recent_end = new_end;
                            }
                            var num = countDate(recent_begin, recent_end);
                            new_tds.push({
                                'id': new_id,
                                'col': num,
                                'status': new_status,
                                'begin': new_begin,
                                'end': new_end,
                                'text': new_title,
                                fatherid: new_value.fatherid,
                                fathername: new_value.fathername
                            });

                            if (new_end < v2.end) {
                                var num = countDate(nextDate, v2.end);
                                new_tds.push({
                                    'id': 0,
                                    'col': num,
                                    'status': 0,
                                    'begin': nextDate,
                                    'end': v2.end,
                                    'text': '',
                                    fatherid: new_value.fatherid,
                                    fathername: new_value.fathername
                                });
                            }
                        }
                    } else {
                        //only one td
                        if (new_begin < defaultOptions.begin) {
                            var recent_begin = defaultOptions.begin;
                        } else {
                            var recent_begin = new_begin;
                        }

                        if (new_end > defaultOptions.end) {
                            var recent_end = defaultOptions.end;
                        } else {
                            var recent_end = new_end;
                        }
                        var num = countDate(recent_begin, recent_end);
                        new_tds.push({
                            'id': new_id,
                            'col': num,
                            'status': new_status,
                            'begin': new_begin,
                            'end': new_end,
                            'text': new_title,
                            fatherid: new_value.fatherid,
                            fathername: new_value.fathername
                        });

                        //only itself
                        if (new_end < defaultOptions.end) {
                            var nextDate = getNextDate(new_end);
                            var num = countDate(nextDate, defaultOptions.end);
                            new_tds.push({
                                'id': 0,
                                'col': num,
                                'status': 0,
                                'begin': nextDate,
                                'end': defaultOptions.end,
                                'text': '',
                                fatherid: new_value.fatherid,
                                fathername: new_value.fathername
                            });
                        }
                    }

                    i = tdindex + 2;
                } else {
                    new_tds.push(tr[i++])
                }
            }

            $.each(new_tds, function(i, v) {
                addTd(recent_id, i, v);
            });
        };

        //add new line
        this.addNewLine = function(id, city) {
            var tmp_id = id.replace(/\,/g, '');
            $('#jtlTd' + recent_td.index).append('<div class="jtimeline-name-td" _titleid="' + recent_td.titleid + '" _title="' + recent_td.title + '" id="' + tmp_id + '" _value="' + id + '"><img _index="" class="delete-line-button" src="../images/delete-icon.png"><span class="help-point" _tips="' + city + '">' + city + '</span></div>');
            var tl_html = '<div id="jtlRow' + tmp_id + '" class="multi-jtimeline-each-row"><div class="jtimeline-bg">\
                                    <table><tbody><tr><td class="jtimeline-unselect"></td></tr></tbody></table>\
                                    </div><div class="jtimeline-content-skeleton">\
                                    <table><tbody><tr>';
            var col = countDate(defaultOptions.begin, defaultOptions.end);
            tl_html += '<td id="0" colspan="' + col + '" _status="0" _begin="' + defaultOptions.begin + '" _bigid="' + recent_td.titleid + '" _bigname="' + recent_td.title + '" _smallid="' + id + '" _smallname="' + city + '" _end="' + defaultOptions.end + '" _index="0" _fatherid="' + recent_td.index + '" _fathername="' + id + '"></td>';

            $('#jtlMulRow' + recent_td.index).append(tl_html);
        };

        this.deleteLine = function(id, object) {
            $('#jtlMulRow' + id.titleid + ' #jtlRow' + object.attr('id')).remove();
            object.remove();
        };

        //get checked line
        this.getCheckedLine = function() {
            var values = [];
            $('input[name="jtimeline-title-id"]:checked').each(function() {
                values.push(this.value);
            });
            return {
                values: values,
                begin: defaultOptions.begin,
                end: defaultOptions.end
            };
        };
        return this;
    };

})(jQuery);