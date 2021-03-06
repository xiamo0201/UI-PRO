(function(){
    ui.Suggest=ui.Class.create({
        init:function(op){
            var op=this.op=$.extend({
                id:null,
                tpl:['<li>{0}</li>'].join(''),
                data:null,
                url:'',
                params:{},
                split:'',
                active:'active',
                max:10,
                interval:300,
                selected:null,
                name:'ui-menu-list'
            },op||{});
            this.id=_.isElement(op.id)?op.id:$(op.id);
            if(!this.id.length){
                return;
            }
            this.index=0;
            this._initElem();
            this._handleKeyAction();
        },
        _initElem:function(){
            var node=this._createHTML();
            this.listEL=node[0];
            this.ul=node[1];
        },
        _createHTML:function(){
            var b=$('<div style="display:none;"></div>'),c=$('<div class="'+this.op.name+'"></div>'),d=$('<ul></ul>');
            c.append(d);
            b.append(c);
            setTimeout(function(){document.getElementsByTagName('body')[0].appendChild(b[0])},0);//fix ie
            return [b,d];
        },
        _hide:function(){
            this.listEL[0]&&(this.listEL[0].style.display = 'none');
        },
        _filter:function(a){
            var b=new RegExp('^'+a+''),c=this.op.data,d=[];
            for(var i in c){
                i=c[i];             
                if(a==='' || !!b.exec(i))d.push(i)
            }
            if(d.length==1 && _.indexOf(d,a)) d=[];
            return d;
        },
        selectTxt:function (a,f,j){
            try{
                a.focus();
                if (document.createRange) a.setSelectionRange(f, j);
                else {
                    a = a.createTextRange();
                    a.collapse(1);
                    a.moveStart("character", f);
                    a.moveEnd("character", j - f);
                    a.select()
                }
            } catch (b) {}
        },
        _show:function(){
            var a=this.op,b=this.id;
            if(a.split){
                if(b.val().indexOf(a.split)>-1){
                    this._getData();
                }else{
                    this._hide();
                }
            }else{
                if(b.val().trim()||(a.realtime&&b.val().trim()==='')){
                    this._getData();
                }else if(a.data.length) {
                    this._getData();
                }else{
                    this._hide();
                }
            }
        },
        _render:function(a){
            var b=[],
                c=this.op,
                f,
                g=function(k,d){
                    if(!k)return d;
                    var con=[];
                    k=k.split('|');
                    _.each(k,function(t){
                        if(d.hasOwnProperty(t)){
                            con.push(d[t])
                        }else{
                            con.push(t)
                        }
                    });
                    return con.join('');
                };
            this.cov=[];
            this.temp=[];
            if(_.isArray(a)){
                var d=this.id.val().trim();
                if(!a || !a.length){
                    this._hide();
                    return;
                }
                if(c.match){
                    if(c.fixedData && c.fixedData[c.key]===d){
                        d='';
                    }
                    a= _.filter(a,function(it){
                        if(c.key){
                            return it[c.key].indexOf(d)>=0
                        }
                        return it.indexOf(d)>=0
                    });
                }
                var len=Math.min(c.max,a.length);//列表数据 最大显示条数
                if(c.fixedData){
                    a.unshift(c.fixedData);
                    ++len;
                }
                for(var i=0;i<len;i++){
                    this.cov.push(g(c.key,a[i]));
                    b.push(ui.format(c.tpl,this.cov[i]));
                    this.temp.push(a[i]);
                    if(d===this.cov[i]){
                        f=i;
                    }
                }
            }
            this.ul[0].innerHTML=b.join('');
            this.list=this.ul.find('li');
            this._handleListAction();
            this._offset();
            this._setOn(f);
        },
        _getData:function(){
            var a=this.op,b=this,c={},d=this.id,f=d.val().trim();
            if(this.interval){
                if(b.ajax)b.ajax.abort();
                clearTimeout(this.interval)
            }
            this.interval=setTimeout(function(){
                if(!a.url){
                    b._render(a.data);
                    return;
                }
                if(a.data&&d[0].val===f && !a.realtime){//避免重复值出发请求
                    b._render(a.data);
                }else{
                    c[b.id[0].name]=b.id[0].value;
                    if(a.objParam){
                        var _c={};
                        c=$.extend(c,a.params);
                        _c[a.objParam]=ui.json2str(c);
                        c=_c;
                    }else{
                        c=$.extend(c,a.params);
                    }
                    b.ajax=$.get(a.url,c, _.bind(b._ajaxCallback,b));
                }
            },a.interval);
        },
        _ajaxCallback:function(q){
            if(this.op.ajaxCallback){
                this.op.ajaxCallback(q);
            }
        },
        _setOn:function(index){
            this.list.removeClass(this.op.active);
            if(!_.isUndefined(index)){
                this.index=index;//重新指定索引
            }
            this.list[index||this.index].className=this.op.active;
        },
        _insertAdd:function(item){
            var val=this.cov[this.index];
            this.id.val(val);
            this._hide();
            if(_.isFunction(this.op.selected))this.op.selected(item,this);
            this.id.blur();
        },
        _offset:function(){
            var a=this.id,b=a.offset(),c=['position:absolute','z-index:2000','display:block',
                'width:'+(a.outerWidth()-1)+'px','left:'+(b.left)+'px','top:'+(b.top+a.outerHeight()+1)+'px'];
            this.listEL[0].style.cssText=c.join(';');
        },
        _handleListAction:function(){
            var self=this,len=this.list.length;
            for(var i=0;i<len;i++){
                this.list[i].onmouseover=function(i){
                    return function(){
                        self.list.removeClass('cur');
                        self.list[i].className='cur';
                        self.index=i;
                    }
                }(i);
                this.list[i].onclick=function(e){
                    self._insertAdd(self.temp[self.index]);
                    ui.evt(e).stop();
                }
            }
            //每次输入重新定位到第0个
            $(self.list[0]).addClass('cur');
            this.index=0;
        },
        _handleKeyAction:function(){
            var self=this,key,target;
            this.id.bind('focus',ui.bind(this._show,this))
                   .bind('click',function(e){
                        self.selectTxt(self.id[0],0,self.id.val().length);
                        ui.evt(e).stop();
                    })
                   .bind('blur',function(){
                        setTimeout(function(){
                            self._hide();
                            self.op.onblur(self);
                        },100);
                    })
                   .bind('keyup',function(e){
                        key=ui.evt(e).key;
                        if(key==32||key==8 || (key>47 && key<112)){
                            self._show();
                        }
                    })
                   .bind('keydown',function(e){
                        e=ui.evt(e);
                        if(self.listEL[0].style.display!='block')return;
                        if(e.key==38){
                            self.index==0?self.index=self.list.length-1:self.index--;
                            self._setOn();
                            return !1;
                        }else if(e.key==40){
                            self.index==self.list.length-1 ? self.index=0:self.index++;
                            self._setOn();
                            return !1;
                        }
                        if(e.key==13){
                            self._insertAdd(self.temp[self.index]);
                            e.prevent();
                        }
                    });
            $(document).bind('click',ui.bind(this._hide,this));
        },
        _destroy:function(){
            this.id.unbind('focus click blur keyup keydown');
            this.id=null;
        }
    });
    angular.module('ui.suggest',[])
        .directive('uiSuggest',['$timeout','$http',function($timeout,$http){
            return {
                restrict: 'A',
                require:'?ngModel',
                scope:{
                    onSelect:'&',
                    onBlur:'&',
                    ctrl:'=',
                    ngModel:'=',
                    params:'=',
                    fixedData:'=?',
                    callback:'&?',
                    data:'='
                },
                link:function(scope, element, attrs,ngModel) {
                    var asValue=attrs.asValue;
                    var key=attrs.key;
                    if(!scope.suggest){
                        scope.suggest=new ui.Suggest({
                            id:element,
                            params:scope.params,
                            url:attrs.url,
                            objParam:attrs.objParam,
                            realtime:+attrs.realtime,
                            data:scope.data||[],
                            active:attrs.active,
                            match:attrs.match,//静态数据 实时匹配
                            max:10,
                            http:$http,
                            onblur:function(self){
                                scope.$apply(function(){
                                    scope.onBlur({self: self});
                                });
                            },
                            ajaxCallback:function(q){
                                var res=scope.callback({res:q})||[];
                                scope.suggest.data=res;
                                scope.suggest._render(res);
                            },
                            key:key,
                            selected:function(item,self){
                                scope.item=item;
                                if(scope.onSelect){
                                    $timeout(function(){//fix ie8 9  ngModel
                                        if(asValue){
                                            ngModel.$setViewValue(item[asValue]);
                                        }else{
                                            ngModel.$setViewValue(item);
                                        }
                                        scope.onSelect({self:self});
                                    },10);
                                }
                            }
                        });
                        scope._ngModel=ngModel;
                        if(angular.isDefined(attrs.ctrl))scope.ctrl=scope;
                    }
                    scope.$watch('fixedData',function(a){
                        if(a){
                            scope.suggest.op.fixedData=a;
                        }
                    });
                    scope.$watchCollection('data',function(a){
                        if(a&&a.length){
                            scope.suggest.op.data=a;
                            render(scope.ngModel);
                        }
                    });
                    var render=function(a){
                        var obj=_.filter(scope.data,function(it){
                            if(asValue && it[asValue]==a){
                                return it
                            }else if(!asValue && it[key]==a){
                                return it
                            }
                            return it[key]==a;
                        });
                        if(scope.fixedData && asValue && scope.fixedData[asValue]==a){
                            obj=[scope.fixedData];
                        }
                        if(obj.length){
                            element.val(obj[0][key]);
                        }
                        // 默认ng-model为 对象数据
                        if(_.isObject(a)){
                            key && element.val(a[key]);
                            asValue && ngModel.$setViewValue(a[asValue]);
                        }
                    };

                    var wa=scope.$watch('ngModel',function(a){
                        if(_.isUndefined(a) || a==='' || _.isNull(a)){
                            element.val('');
                            return
                        }
                        render(a);
                    });
                    scope.$on('$destroy',function (){
                        wa();
                    });
                }
            }
        }])
})();