/**
* author : ahuing
* date   : 2015-04-10
* name   : jqModal v1.0
* modify : 2015-7-9 16:37:20
 */

!function ($) {
    // transition.js
    function transitionEnd(){var el=document.createElement('div')
    var transEndEventNames={WebkitTransition:'webkitTransitionEnd',MozTransition:'transitionend',OTransition:'oTransitionEnd otransitionend',transition:'transitionend'}
    for(var name in transEndEventNames){if(el.style[name]!==undefined){return{end:transEndEventNames[name]}}}
    return false}
    $.fn.emulateTransitionEnd=function(duration){var called=false
    var $el=this
    $(this).one('bsTransitionEnd',function(){called=true})
    var callback=function(){if(!called)$($el).trigger($.support.transition.end)}
    setTimeout(callback,duration)
    return this}
    $(function(){$.support.transition=transitionEnd()
    if(!$.support.transition)return
    $.event.special.bsTransitionEnd={bindType:$.support.transition.end,delegateType:$.support.transition.end,handle:function(e){if($(e.target).is(this))return e.handleObj.handler.apply(this,arguments)}}})
    // 公用
    var isIE6 = !-[1,] && !window.XMLHttpRequest;

    // 获取显示拖拽范围
    var showRange = function(o, p, f) {
        var $p = $(!f ? 'body' : (p || window))
        , st = $(window).scrollTop()
        , w = o.outerWidth()
        , h = o.outerHeight()
        , pw = $p.width()
        , ph = $p.height()
        
        return {
            minL   : pw < w ? pw - w : 0
            , minT : ph < h ? ph - h : 0
            , maxL : pw < w ? 0 : $p.width() - w
            , maxT : ph < h ? 0 : $p.height() - h
            , st   : st
            , h    : h
        };
    }/*
    var showRange = function(o, p, f) {
        var $p = $(!f ? 'body' : (p || window))
        , st = $(window).scrollTop()
        , w = o.outerWidth()
        , h = o.outerHeight()
        , pw = $p.width()
        , ph = $p.height()

        return {
            minL   : 0
            , minT : 0
            , maxL : $p.width() - w
            , maxT : $p.height() - h
            , st   : st
            , h    : h
        };
    }*/

    // drag
    var Drag = function (self, opt) {
        this.o = $.extend({}, Drag.defaults, opt);
        this.$self = $(self);
        this.$handle = this.o.handle && this.$self.find(this.o.handle) || this.$self
    }

    Drag.defaults = {
        handle       : ''
        , fixed      : 1
        // , opacity    : 1
        , attachment : ''
    }

    Drag.prototype.init = function () {
        var o = this.o;
        var $self = this.$self.css('animation-fill-mode','backwards');
        var $handle = this.$handle;

        $handle
        .css({
            cursor : 'move'
            // , userSelect : 'none'
        })
        .on('selectstart', function() {
            return false;
        })
        .on('mousedown', function(e) {
            $self
            .css({
                opacity  : o.opacity
                , zIndex : parseInt(new Date().getTime()/1000)
            })
            .trigger('_mousemove', [e.pageX, e.pageY])
            return false;
        })
        .on('_mousemove', function (e, x, y) {
            var R = showRange($self, o.attachment, o.fixed)
            , p = $self.position()
            , pl = p.left - x
            , pt = p.top - y
            , dT = null;

            $self.trigger('dragStart', [R])
            $(document).on('mousemove', function(de) {
                // 阻止对象的默认行为,防止在img,a上拖拽时出错
                de.preventDefault();
                var nL = pl + de.pageX
                , nT   = pt + de.pageY
                , t    = nT < R.minT ? R.minT : (nT > R.maxT ? R.maxT : nT);

                if (isIE6 && o.fixed) {
                    t = nT < R.st ? R.st : ( nT - R.st > s.maxT ? R.maxT + R.st : nT);
                    // $.modal.top = t - R.st;
                };

                $self.css({
                    left : nL < R.minL ? R.minL : (nL > R.maxL ? R.maxL : nL)
                    , top : t
                }).trigger('drag', [R])

            }).on('mouseup',function() {
                $(this).off('mousemove')
                $self.trigger('dragEnd', [R])
            });
        })
    }

    function PluginDrag(option) {
        return this.each(function () {
            var $this   = $(this)
            var data    = $this.data('jqDrag')
            var options = $.extend({}, Drag.defaults, $this.data(), typeof option == 'object' && option)

            if (!data) { 
                $this.data('jqDrag', (data = new Drag(this, options)))
                data.init();
                // data.show()
            }
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.jqDrag = PluginDrag;

    // modal
    var Modal = function (self, opt) {
        this.o       = opt;
        this.Z       = parseInt(new Date().getTime()/1000);
        this.$self   = $(self)
        this.isShown = false
    }

    Modal.prototype = {
        init : function () {            
            var _this = this
            , o       = _this.o
            , _target = o.target
            , html    = '<div class="jqModal animated">'
                        + '    <div class="m-content m-' + o.mclass + '">'
                        + '        <div class="m-head">' + o.head + '</div>'
                        + '        <div class="m-body"></div>'
                        + '        <div class="m-foot">' + o.foot + '</div>'
                        + '        <a class="m-close" data-close="1" title="关闭" href="#"></a>'
                        + '    </div>'
                        + '</div>';

            //加载遮罩层
            if (o.overlay) {
                _this.$overlay = $('<div class="m-overlay"></div>').appendTo('body')
                                .css({
                                    opacity : o.overlay
                                    , zIndex : _this.Z
                                })
                                .on('click', !o.lock && $.proxy(_this.hide, _this) || $.noop);
            }
            // 装载弹出层
            _this.$box = $(html).appendTo('body')
                        .css($.extend({}, o.css, {
                            zIndex : _this.Z
                            , position : o.fixed && !isIE6 && 'fixed' || 'absolute'
                        }))
                        // close
                        .on('click', '[data-close]', $.proxy(_this.hide, _this));

            _this.$hd  = _this.$box.find('.m-head')
                        .css($.extend({}, o.headcss, !o.head && {display : 'none'}));

            _this.$bd  = _this.$box.find('.m-body').css(o.bodycss);

            _this.$ft  = _this.$box.find('.m-foot')
                        .css($.extend({}, o.footcss, !o.foot && {display : 'none'}));

            // draglay
            if (o.drag) {
                _this.$drag = $('<div class="drag-lay"></div>').appendTo(_this.$box);
            }
            //ie6隐藏select
            isIE6 && $('select').css('visibility','hidden');

            if (_this.$self.is('iframe')) {
                _this.$self.attr({
                    scrolling           : 'no'
                    , allowtransparency : true
                    , frameborder       : 0
                    , src               : o.remote
                })
                .appendTo(this.$bd)
                .load(function () {
                    _this.setPos(1);
                })
            }
            else {
                _this.$bd.append(_this.$self.css('display', 'block'));
            }

            this.setPos();
            $(document).on('keydown.modal', function(e){
                e.which == 27 && _this.hide();
                return true;
            });

            o.fixed && $(window).on('resize', $.proxy(_this.setPos, _this));

        }
        , show : function () {
            if (this.isShown) return
            this.$self.trigger('showFun');
            this.$overlay && this.$overlay.css('display', 'block')
            this.$box.css('display','block')
            $.support.transition && this.$box.addClass(this.o.animate)
            this.$self.trigger('shownFun');
            this.isShown = true

            if (isIE6 && o.fixed && !o.drag) {
                var _top = s.maxT / 2;
                var $w = $(window);
                $w.on('scroll',function(){
                    this.$box.css({'top' : _top + $w.scrollTop()})
                });
            };

            if (this.o.drag) {
                this.$hd.add(this.$drag).on('mousedown', $.proxy(function (e) {
                    this.$drag.trigger('_mousemove', [e.pageX, e.pageY]);
                    if (this.o.drag > 1) this.$drag.addClass('drag-lay-drag');
                }, this))

                $('body').on('mouseup', $.proxy(function () {
                    this.$drag.removeClass('drag-lay-drag');
                }, this));

                if (this.o.drag > 1) {
                    PluginDrag.call(this.$drag, {
                        fixed : this.o.fixed
                    })
                    var _this = this;
                    this.$drag.on('dragEnd', function () {
                        _this.$box.css({
                            left: function (i, v) {
                                return v + _this.$drag.position().left;
                            }
                            , top:  function (i, v) {
                                return v + _this.$drag.position().top;
                            }
                        });
                    })
                }
                else {
                    PluginDrag.call(this.$box, {
                        handle  : this.$drag
                        , fixed : this.o.fixed
                    })
                };
            } 

            if(this.o.timeout) {
                clearTimeout(this.t);
                this.t = setTimeout($.proxy(this.hide, this), this.o.timeout);
            }
        }
        , hideModal : function () {
            this.$box.removeClass(this.o.animate + 'H').hide()
            this.$overlay && this.$overlay.hide();
            this.$self.trigger('hidenFun');
        }
        , hide : function (speed) {
            this.$self.trigger('hideFun');

            setTimeout($.proxy(function() {
                this.$box.removeClass(this.o.animate).addClass(this.o.animate + 'H');
                $.support.transition && 
                this.$box.one('bsTransitionEnd', $.proxy(this.hideModal, this))
                .emulateTransitionEnd(500) ||
                this.hideModal()
            }, this), speed || 0)

            if(isIE6){
                $('select').css('visibility','visible');
            }
            this.isShown = false;
            return false;
        }
        , toggle : function (time) {
            return this.isShown ? this.hide(time) : this.show()
        }
        , setSize : function () {
            if (this.$self.is('iframe')) {
                this.$self.add(this.$bd).height(this.$self.css('background','none').contents().find('body').height());
            } 
        }
        // 设置位置
        , setPos : function (isComplete){
            isComplete && this.setSize();
            var o = this.o
            , R = showRange(this.$box, null, o.fixed);
            this.$box.css({
                left: o.css.right >= 0 ? 'auto' : (o.css.left || R.maxL / 2)
                , top: o.css.bottom >= 0 ? 'auto' : (o.css.top || ($(window).height() - R.h) / 2 + ((isIE6 || !o.fixed) && R.st))
            });
        }
    }

    Modal.defaults = {
        mclass          : 'modal' //[ modal | tip | lay ]
        , head         : ''//标题
        , foot         : '' // 内容
        , remote       : ''
        , fixed        : 1 //fixed效果
        , overlay      : .3 //显示遮罩层, 0为不显示
        , drag         : 2 //拖拽 1
        , lock         : 0 //锁定遮罩层
        , timeout      : 0
        , css          : {}
        , headcss      : {}
        , bodycss      : {}
        , footcss      : {}
        , animate     : 'bounceInDown' // shake | flipInY | bounceInDown | zoomIn
    }

    function Plugin(option, time) {
        return this.each(function () {
            var $this   = $(this)
            var data    = $this.data('jqModal')
            var options = $.extend({}, Modal.defaults, $this.data(), typeof option == 'object' && option)
            if (!data) { 
                $this.data('jqModal', (data = new Modal(this, options)))
                data.init()
                data.show()
            }
            else {
                if (typeof option == 'string') data[option](time)
                else data['toggle']()
            }
        })
    }

    var old = $.fn.jqModal;

    $.fn.jqModal             = Plugin
    $.fn.jqModal.Constructor = Modal;

    $.fn.jqModal.noConflict = function () {
        $.fn.jqModal = old
        return this
    }

    $('<link rel="stylesheet">').appendTo('head').attr('href', (typeof(tplurl) != 'undefined' ? tplurl : '') + 'css/jqmodal.css');

    $(document).on('click', '.btn-jqModal', function(e) {
        var $this   = $(this)
        var target = $this.data('target') || $this.attr('href')

        if (typeof target == 'string') {
            var isUrl = target.indexOf('http') == 0
            var $target = $(isUrl && '<iframe class="jqiframe"/>' || target.replace(/.*(?=#[^\s]+$)/, ''))
            $this.data('target', $target);
            var option = $.extend({ remote : isUrl && target }, $target.data(), $this.data())
        }
        else {
            var $target = target;
            var option = 'toggle';
        }

        if ($this.is('a')) e.preventDefault();
        Plugin.call($target, option)
    });


    $.jqModal = {
        tip : function () {
            var $target = $('.jqtip')
            , option = $target[0] && 'show' || {
                mclass: 'tip'
                , animate: 'shake'
                , css: {top: 100}
                , drag: 0
                , lock: 1
                , timeout: arguments[2] || 1500
            };

            if (!$target[0]) $target = $('<div class="jqtip"></div>')//.appendTo('body');

            Plugin.call($target.html('<i class="ico ico-'+ arguments[1] +'"></i>'+ arguments[0]), option, arguments[2] || 1500);
        }
        , alert : function (option) {
            var $target =  $('.jqalert')
            , option = $target[0] && 'show' || {
                    head : '提示信息'
                    , css : {width : 300}
                    , foot : '<button data-close="1" class="ok">确定</button>'
                };

            if (!$target[0]) $target = $('<div class="jqalert"></div>');

            Plugin.call($target.html('<i class="ico ico-info"></i>'+ option), option)
        }
        , lay : function (txt) {
            var html = txt;
            if ($('.jqlay').length) {
                if (txt != 'hide') {
                    $('.jqlay').html(html);
                }
                $('.jqlay').jqModal(txt);
            }
            else {
                $('<div class="jqlay">'+ html +'</div>').appendTo('body').jqModal()
            }
        }
        , confirm : function (tit, txt) {
            if ($('.jqAlert').length) {
                if (tit == 'show' || tit == 'hide' || tit == 'toggle') {
                    $('.jqAlert').jqModal(tit);
                }
                else {
                    $('.jqAlert').data('jqModal').$content.html(txt);
                    $('.jqAlert').data('jqModal').show();
                }
            }
            else {
                Plugin.call($('<div class="jqAlert">' + txt + '</div>').appendTo('body'), {title:tit,overlay:0})
            }
        }
    }
    
}(jQuery);
