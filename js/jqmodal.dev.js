/**
* author : ahuing
* date   : 2015-04-10
* name   : jqModal v1.0
* modify : 2015-7-9 09:37:09
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
        , opacity    : 1
        , attachment : ''
    }

    Drag.prototype.init = function () {
        var o = this.o;
        var $self = this.$self.css('animation-fill-mode','backwards');
        var $handle = this.$handle;

        $handle.css({
            cursor : 'move'
            // , userSelect : 'none'
        }).on('selectstart', function() {
            return false;
        })
        .on('mousedown', function(e) {
            $self.css({
                opacity  : o.opacity
                , zIndex : parseInt(new Date().getTime()/1000)
            }).trigger('dragEnd', [R])

            var R = showRange($self, o.attachment, o.fixed)
            , p = $self.position()
            , pl = p.left - e.pageX
            , pt = p.top - e.pageY
            , dT = null;
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
                $self.css('opacity',1).trigger('dragEnd', [R])
            });

            return false;
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
        this.init()
    }

    Modal.prototype = {
        init : function () {            
            var o = this.o;

            var html= '<div class="jqModal animated">'
                    + '    <div class="m-content m-' + o.mclass + '">'
                    + '        <div class="m-head">' + o.head + '</div>'
                    + '        <div class="m-body"></div>'
                    + '        <div class="m-foot">' + o.foot + '</div>'
                    + '        <a class="m-close" data-close="1" title="关闭" href="#"></a>'
                    + '    </div>'
                    + '</div>';

            this.$box = $(html).appendTo('body')
                        .css($.extend({}, o.css, {
                            zIndex : this.Z
                            , position : o.fixed && !isIE6 && 'fixed' || 'absolute'
                        }));
            // this.$content = this.$box.find('.m-content');
            this.$hd  = this.$box.find('.m-head')
                        .css($.extend({}, o.headcss, !o.head && {display : 'none'}));

            this.$bd  = this.$box.find('.m-body').css(o.bodycss);

            this.$ft  = this.$box.find('.m-foot')
                        .css($.extend({}, o.footcss, !o.foot && {display : 'none'}));

            this.$box.on('click', '[data-close]', $.proxy(this.hide, this));

            //加载遮罩层
            if(o.overlay) {
                this.$overlay = $('<div class="m-overlay"></div>').insertBefore(this.$box)
                .css({
                    opacity : o.overlay
                    , zIndex : this.Z
                })
                .on('click',!o.lock && $.proxy(this.hide, this) || $.noop);
            }

            //ie6隐藏select
            isIE6 && $('select').css('visibility','hidden');
            // loading
            this.$loading = $('.modal-loading') || $('<div class="modal-loading"></div>').appendTo('body');

            var str = o.target;

            if (this.$self.is('iframe')) {
                this.$self.attr({
                    scrolling           : 'no'
                    , allowtransparency : true
                    , frameborder       : 0
                    , src               : o.remote
                })
                .appendTo(this.$bd)
                .load($.proxy(function () {
                    this.$self.add(this.$bd).height(this.$self.css('background','none').contents().find('body').height());
                    this.setPos();
                }, this))
            }
            else if (this.$self.is('img')) {
                this.loading('show')

                var $img = $('<img>')
                , _img = new Image();

                _img.onerror = function () {
                    this.loading('error')
                }

                _img.onload = function () {
                    var imgSize = this.getImgSize(_img, parseInt($w.width()*.8), parseInt($w.height()*.8));

                    this.$bd.html($img.css({
                        width : imgSize[0]
                        , height : imgSize[1]
                    }));
                    this.setPos();
                }
                _img.src = str;
                $img.attr('src', str);

            }
            else {
                this.$bd.append(this.$self.css('display', 'block'));
            }

            this.setPos();
            // this.show();
            $(document).on('keydown.modal', $.proxy(function(e){
                e.which == 27 && this.hide();
                return true;
            }, this));

            o.fixed && $(window).on('resize', $.proxy(this.setPos, this));

            o.callBack && o.callBack.call(this);
            
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

            this.o.drag && PluginDrag.call(this.$box, {
                handle  : this.$hd
                , fixed : this.o.fixed
            })

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
                // $w.off('scroll');
            }
            this.isShown = false;
            return false;
        }
        , toggle : function (time) {
            return this.isShown ? this.hide(time) : this.show()
        }
        , loading : function(state) {
            this.$loading[state]();
        }
        // 设置位置
        , setPos : function (){
            var o = this.o
            , R = showRange(this.$box, null, o.fixed);
            this.$box.css({
                left: o.css.right >= 0 ? 'auto' : (o.css.left || R.maxL / 2)
                , top: o.css.bottom >= 0 ? 'auto' : (o.css.top || ($(window).height() - R.h) / 2 + ((isIE6 || !o.fixed) && R.st))
            });

            // this.$self.is('iframe') && this.$bd.height(s.h - this.$hd.outerHeight());
        }
    }

    Modal.defaults = {
        mclass          : 'modal' //[ modal | tip | lay ]
        , head         : ''//标题
        , foot         : '' // 内容
        , remote       : ''
        , fixed        : 1 //fixed效果
        , overlay      : .3 //显示遮罩层, 0为不显示
        , drag         : 1 //拖拽 1
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
