!function(e) {
    !function(e, t) {
        "use strict";
        "object" == typeof module && "object" == typeof module.exports ? module.exports = e.document ? t(e, !0) : function(e) {
            if (!e.document)
                throw new Error("pQuery requires a window with a document");
            return t(e)
        }
        : t(e)
    }("undefined" != typeof window ? window : this, function(e, t) {
        "use strict";
        function n(e, t) {
            var n = (t = t || Y).createElement("script");
            n.text = e,
            t.head.appendChild(n).parentNode.removeChild(n)
        }
        function r(e) {
            var t = !!e && "length"in e && e.length
              , n = ae.type(e);
            return "function" !== n && !ae.isWindow(e) && ("array" === n || 0 === t || "number" == typeof t && t > 0 && t - 1 in e)
        }
        function o(e, t) {
            return e.nodeName && e.nodeName.toLowerCase() === t.toLowerCase()
        }
        function i(e, t, n) {
            return ae.isFunction(t) ? ae.grep(e, function(e, r) {
                return !!t.call(e, r, e) !== n
            }) : t.nodeType ? ae.grep(e, function(e) {
                return e === t !== n
            }) : "string" != typeof t ? ae.grep(e, function(e) {
                return ee.call(t, e) > -1 !== n
            }) : ye.test(t) ? ae.filter(t, e, n) : (t = ae.filter(t, e),
            ae.grep(e, function(e) {
                return ee.call(t, e) > -1 !== n && 1 === e.nodeType
            }))
        }
        function s(e, t) {
            for (; (e = e[t]) && 1 !== e.nodeType; )
                ;
            return e
        }
        function a(e) {
            return e
        }
        function u(e) {
            throw e
        }
        function c(e, t, n, r) {
            var o;
            try {
                e && ae.isFunction(o = e.promise) ? o.call(e).done(t).fail(n) : e && ae.isFunction(o = e.then) ? o.call(e, t, n) : t.apply(void 0, [e].slice(r))
            } catch (e) {
                n.apply(void 0, [e])
            }
        }
        function l() {
            Y.removeEventListener("DOMContentLoaded", l),
            e.removeEventListener("load", l),
            ae.ready()
        }
        function d() {
            this.expando = ae.expando + d.uid++
        }
        function f(e, t, n) {
            var r;
            if (void 0 === n && 1 === e.nodeType)
                if (r = "data-" + t.replace(_e, "-$&").toLowerCase(),
                "string" == typeof (n = e.getAttribute(r))) {
                    try {
                        n = function(e) {
                            return "true" === e || "false" !== e && ("null" === e ? null : e === +e + "" ? +e : je.test(e) ? JSON.parse(e) : e)
                        }(n)
                    } catch (e) {}
                    Ae.set(e, t, n)
                } else
                    n = void 0;
            return n
        }
        function p(e, t, n, r) {
            var o, i = 1, s = 20, a = r ? function() {
                return r.cur()
            }
            : function() {
                return ae.css(e, t, "")
            }
            , u = a(), c = n && n[3] || (ae.cssNumber[t] ? "" : "px"), l = (ae.cssNumber[t] || "px" !== c && +u) && Pe.exec(ae.css(e, t));
            if (l && l[3] !== c) {
                c = c || l[3],
                n = n || [],
                l = +u || 1;
                do {
                    l /= i = i || ".5",
                    ae.style(e, t, l + c)
                } while (i !== (i = a() / u) && 1 !== i && --s)
            }
            return n && (l = +l || +u || 0,
            o = n[1] ? l + (n[1] + 1) * n[2] : +n[2],
            r && (r.unit = c,
            r.start = l,
            r.end = o)),
            o
        }
        function h(e) {
            var t, n = e.ownerDocument, r = e.nodeName, o = Re[r];
            return o || (t = n.body.appendChild(n.createElement(r)),
            o = ae.css(t, "display"),
            t.parentNode.removeChild(t),
            "none" === o && (o = "block"),
            Re[r] = o,
            o)
        }
        function v(e, t) {
            for (var n, r, o = [], i = 0, s = e.length; i < s; i++)
                (r = e[i]).style && (n = r.style.display,
                t ? ("none" === n && (o[i] = Se.get(r, "display") || null,
                o[i] || (r.style.display = "")),
                "" === r.style.display && qe(r) && (o[i] = h(r))) : "none" !== n && (o[i] = "none",
                Se.set(r, "display", n)));
            for (i = 0; i < s; i++)
                null != o[i] && (e[i].style.display = o[i]);
            return e
        }
        function m(e, t) {
            var n;
            return n = void 0 !== e.getElementsByTagName ? e.getElementsByTagName(t || "*") : void 0 !== e.querySelectorAll ? e.querySelectorAll(t || "*") : [],
            void 0 === t || t && o(e, t) ? ae.merge([e], n) : n
        }
        function y(e, t) {
            for (var n = 0, r = e.length; n < r; n++)
                Se.set(e[n], "globalEval", !t || Se.get(t[n], "globalEval"))
        }
        function g(e, t, n, r, o) {
            for (var i, s, a, u, c, l, d = t.createDocumentFragment(), f = [], p = 0, h = e.length; p < h; p++)
                if ((i = e[p]) || 0 === i)
                    if ("object" === ae.type(i))
                        ae.merge(f, i.nodeType ? [i] : i);
                    else if (Me.test(i)) {
                        for (s = s || d.appendChild(t.createElement("div")),
                        a = (He.exec(i) || ["", ""])[1].toLowerCase(),
                        u = Be[a] || Be._default,
                        s.innerHTML = u[1] + ae.htmlPrefilter(i) + u[2],
                        l = u[0]; l--; )
                            s = s.lastChild;
                        ae.merge(f, s.childNodes),
                        (s = d.firstChild).textContent = ""
                    } else
                        f.push(t.createTextNode(i));
            for (d.textContent = "",
            p = 0; i = f[p++]; )
                if (r && ae.inArray(i, r) > -1)
                    o && o.push(i);
                else if (c = ae.contains(i.ownerDocument, i),
                s = m(d.appendChild(i), "script"),
                c && y(s),
                n)
                    for (l = 0; i = s[l++]; )
                        Ie.test(i.type || "") && n.push(i);
            return d
        }
        function b() {
            return !0
        }
        function x() {
            return !1
        }
        function w() {
            try {
                return Y.activeElement
            } catch (e) {}
        }
        function T(e, t, n, r, o, i) {
            var s, a;
            if ("object" == typeof t) {
                for (a in "string" != typeof n && (r = r || n,
                n = void 0),
                t)
                    T(e, a, n, r, t[a], i);
                return e
            }
            if (null == r && null == o ? (o = n,
            r = n = void 0) : null == o && ("string" == typeof n ? (o = r,
            r = void 0) : (o = r,
            r = n,
            n = void 0)),
            !1 === o)
                o = x;
            else if (!o)
                return e;
            return 1 === i && (s = o,
            (o = function(e) {
                return ae().off(e),
                s.apply(this, arguments)
            }
            ).guid = s.guid || (s.guid = ae.guid++)),
            e.each(function() {
                ae.event.add(this, t, o, r, n)
            })
        }
        function k(e, t) {
            return o(e, "table") && o(11 !== t.nodeType ? t : t.firstChild, "tr") && ae(">tbody", e)[0] || e
        }
        function E(e) {
            return e.type = (null !== e.getAttribute("type")) + "/" + e.type,
            e
        }
        function C(e) {
            var t = Ye.exec(e.type);
            return t ? e.type = t[1] : e.removeAttribute("type"),
            e
        }
        function N(e, t) {
            var n, r, o, i, s, a, u, c;
            if (1 === t.nodeType) {
                if (Se.hasData(e) && (i = Se.access(e),
                s = Se.set(t, i),
                c = i.events))
                    for (o in delete s.handle,
                    s.events = {},
                    c)
                        for (n = 0,
                        r = c[o].length; n < r; n++)
                            ae.event.add(t, o, c[o][n]);
                Ae.hasData(e) && (a = Ae.access(e),
                u = ae.extend({}, a),
                Ae.set(t, u))
            }
        }
        function S(e, t) {
            var n = t.nodeName.toLowerCase();
            "input" === n && Fe.test(e.type) ? t.checked = e.checked : "input" !== n && "textarea" !== n || (t.defaultValue = e.defaultValue)
        }
        function A(e, t, r, o) {
            t = J.apply([], t);
            var i, s, a, u, c, l, d = 0, f = e.length, p = f - 1, h = t[0], v = ae.isFunction(h);
            if (v || f > 1 && "string" == typeof h && !se.checkClone && Ve.test(h))
                return e.each(function(n) {
                    var i = e.eq(n);
                    v && (t[0] = h.call(this, n, i.html())),
                    A(i, t, r, o)
                });
            if (f && (s = (i = g(t, e[0].ownerDocument, !1, e, o)).firstChild,
            1 === i.childNodes.length && (i = s),
            s || o)) {
                for (u = (a = ae.map(m(i, "script"), E)).length; d < f; d++)
                    c = i,
                    d !== p && (c = ae.clone(c, !0, !0),
                    u && ae.merge(a, m(c, "script"))),
                    r.call(e[d], c, d);
                if (u)
                    for (l = a[a.length - 1].ownerDocument,
                    ae.map(a, C),
                    d = 0; d < u; d++)
                        c = a[d],
                        Ie.test(c.type || "") && !Se.access(c, "globalEval") && ae.contains(l, c) && (c.src ? ae._evalUrl && ae._evalUrl(c.src) : n(c.textContent.replace(Qe, ""), l))
            }
            return e
        }
        function j(e, t, n) {
            for (var r, o = t ? ae.filter(t, e) : e, i = 0; null != (r = o[i]); i++)
                n || 1 !== r.nodeType || ae.cleanData(m(r)),
                r.parentNode && (n && ae.contains(r.ownerDocument, r) && y(m(r, "script")),
                r.parentNode.removeChild(r));
            return e
        }
        function _(e, t, n) {
            var r, o, i, s, a = e.style;
            return (n = n || Ze(e)) && ("" !== (s = n.getPropertyValue(t) || n[t]) || ae.contains(e.ownerDocument, e) || (s = ae.style(e, t)),
            !se.pixelMarginRight() && Je.test(s) && Ke.test(t) && (r = a.width,
            o = a.minWidth,
            i = a.maxWidth,
            a.minWidth = a.maxWidth = a.width = s,
            s = n.width,
            a.width = r,
            a.minWidth = o,
            a.maxWidth = i)),
            void 0 !== s ? s + "" : s
        }
        function D(e, t) {
            return {
                get: function() {
                    return e() ? void delete this.get : (this.get = t).apply(this, arguments)
                }
            }
        }
        function P(e) {
            var t = ae.cssProps[e];
            return t || (t = ae.cssProps[e] = function(e) {
                if (e in it)
                    return e;
                for (var t = e[0].toUpperCase() + e.slice(1), n = ot.length; n--; )
                    if ((e = ot[n] + t)in it)
                        return e
            }(e) || e),
            t
        }
        function O(e, t, n) {
            var r = Pe.exec(t);
            return r ? Math.max(0, r[2] - (n || 0)) + (r[3] || "px") : t
        }
        function q(e, t, n, r, o) {
            var i, s = 0;
            for (i = n === (r ? "border" : "content") ? 4 : "width" === t ? 1 : 0; i < 4; i += 2)
                "margin" === n && (s += ae.css(e, n + Oe[i], !0, o)),
                r ? ("content" === n && (s -= ae.css(e, "padding" + Oe[i], !0, o)),
                "margin" !== n && (s -= ae.css(e, "border" + Oe[i] + "Width", !0, o))) : (s += ae.css(e, "padding" + Oe[i], !0, o),
                "padding" !== n && (s += ae.css(e, "border" + Oe[i] + "Width", !0, o)));
            return s
        }
        function L(e, t, n) {
            var r, o = Ze(e), i = _(e, t, o), s = "border-box" === ae.css(e, "boxSizing", !1, o);
            return Je.test(i) ? i : (r = s && (se.boxSizingReliable() || i === e.style[t]),
            "auto" === i && (i = e["offset" + t[0].toUpperCase() + t.slice(1)]),
            (i = parseFloat(i) || 0) + q(e, t, n || (s ? "border" : "content"), r, o) + "px")
        }
        function R(e, t, n, r, o) {
            return new R.prototype.init(e,t,n,r,o)
        }
        function F() {
            at && (!1 === Y.hidden && e.requestAnimationFrame ? e.requestAnimationFrame(F) : e.setTimeout(F, ae.fx.interval),
            ae.fx.tick())
        }
        function H() {
            return e.setTimeout(function() {
                st = void 0
            }),
            st = ae.now()
        }
        function I(e, t) {
            var n, r = 0, o = {
                height: e
            };
            for (t = t ? 1 : 0; r < 4; r += 2 - t)
                o["margin" + (n = Oe[r])] = o["padding" + n] = e;
            return t && (o.opacity = o.width = e),
            o
        }
        function B(e, t, n) {
            for (var r, o = (M.tweeners[t] || []).concat(M.tweeners["*"]), i = 0, s = o.length; i < s; i++)
                if (r = o[i].call(n, t, e))
                    return r
        }
        function M(e, t, n) {
            var r, o, i = 0, s = M.prefilters.length, a = ae.Deferred().always(function() {
                delete u.elem
            }), u = function() {
                if (o)
                    return !1;
                for (var t = st || H(), n = Math.max(0, c.startTime + c.duration - t), r = 1 - (n / c.duration || 0), i = 0, s = c.tweens.length; i < s; i++)
                    c.tweens[i].run(r);
                return a.notifyWith(e, [c, r, n]),
                r < 1 && s ? n : (s || a.notifyWith(e, [c, 1, 0]),
                a.resolveWith(e, [c]),
                !1)
            }, c = a.promise({
                elem: e,
                props: ae.extend({}, t),
                opts: ae.extend(!0, {
                    specialEasing: {},
                    easing: ae.easing._default
                }, n),
                originalProperties: t,
                originalOptions: n,
                startTime: st || H(),
                duration: n.duration,
                tweens: [],
                createTween: function(t, n) {
                    var r = ae.Tween(e, c.opts, t, n, c.opts.specialEasing[t] || c.opts.easing);
                    return c.tweens.push(r),
                    r
                },
                stop: function(t) {
                    var n = 0
                      , r = t ? c.tweens.length : 0;
                    if (o)
                        return this;
                    for (o = !0; n < r; n++)
                        c.tweens[n].run(1);
                    return t ? (a.notifyWith(e, [c, 1, 0]),
                    a.resolveWith(e, [c, t])) : a.rejectWith(e, [c, t]),
                    this
                }
            }), l = c.props;
            for (function(e, t) {
                var n, r, o, i, s;
                for (n in e)
                    if (o = t[r = ae.camelCase(n)],
                    i = e[n],
                    Array.isArray(i) && (o = i[1],
                    i = e[n] = i[0]),
                    n !== r && (e[r] = i,
                    delete e[n]),
                    (s = ae.cssHooks[r]) && "expand"in s)
                        for (n in i = s.expand(i),
                        delete e[r],
                        i)
                            n in e || (e[n] = i[n],
                            t[n] = o);
                    else
                        t[r] = o
            }(l, c.opts.specialEasing); i < s; i++)
                if (r = M.prefilters[i].call(c, e, l, c.opts))
                    return ae.isFunction(r.stop) && (ae._queueHooks(c.elem, c.opts.queue).stop = ae.proxy(r.stop, r)),
                    r;
            return ae.map(l, B, c),
            ae.isFunction(c.opts.start) && c.opts.start.call(e, c),
            c.progress(c.opts.progress).done(c.opts.done, c.opts.complete).fail(c.opts.fail).always(c.opts.always),
            ae.fx.timer(ae.extend(u, {
                elem: e,
                anim: c,
                queue: c.opts.queue
            })),
            c
        }
        function U(e) {
            return (e.match(Te) || []).join(" ")
        }
        function W(e) {
            return e.getAttribute && e.getAttribute("class") || ""
        }
        function $(e, t, n, r) {
            var o;
            if (Array.isArray(t))
                ae.each(t, function(t, o) {
                    n || bt.test(e) ? r(e, o) : $(e + "[" + ("object" == typeof o && null != o ? t : "") + "]", o, n, r)
                });
            else if (n || "object" !== ae.type(t))
                r(e, t);
            else
                for (o in t)
                    $(e + "[" + o + "]", t[o], n, r)
        }
        function z(e) {
            return function(t, n) {
                "string" != typeof t && (n = t,
                t = "*");
                var r, o = 0, i = t.toLowerCase().match(Te) || [];
                if (ae.isFunction(n))
                    for (; r = i[o++]; )
                        "+" === r[0] ? (r = r.slice(1) || "*",
                        (e[r] = e[r] || []).unshift(n)) : (e[r] = e[r] || []).push(n)
            }
        }
        function G(e, t, n, r) {
            function o(a) {
                var u;
                return i[a] = !0,
                ae.each(e[a] || [], function(e, a) {
                    var c = a(t, n, r);
                    return "string" != typeof c || s || i[c] ? s ? !(u = c) : void 0 : (t.dataTypes.unshift(c),
                    o(c),
                    !1)
                }),
                u
            }
            var i = {}
              , s = e === _t;
            return o(t.dataTypes[0]) || !i["*"] && o("*")
        }
        function X(e, t) {
            var n, r, o = ae.ajaxSettings.flatOptions || {};
            for (n in t)
                void 0 !== t[n] && ((o[n] ? e : r || (r = {}))[n] = t[n]);
            return r && ae.extend(!0, e, r),
            e
        }
        var V = []
          , Y = e.document
          , Q = Object.getPrototypeOf
          , K = V.slice
          , J = V.concat
          , Z = V.push
          , ee = V.indexOf
          , te = {}
          , ne = te.toString
          , re = te.hasOwnProperty
          , oe = re.toString
          , ie = oe.call(Object)
          , se = {}
          , ae = function(e, t) {
            return new ae.fn.init(e,t)
        }
          , ue = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
          , ce = /^-ms-/
          , le = /-([a-z])/g
          , de = function(e, t) {
            return t.toUpperCase()
        };
        ae.fn = ae.prototype = {
            jquery: "3.2.1",
            constructor: ae,
            length: 0,
            toArray: function() {
                return K.call(this)
            },
            get: function(e) {
                return null == e ? K.call(this) : e < 0 ? this[e + this.length] : this[e]
            },
            pushStack: function(e) {
                var t = ae.merge(this.constructor(), e);
                return t.prevObject = this,
                t
            },
            each: function(e) {
                return ae.each(this, e)
            },
            map: function(e) {
                return this.pushStack(ae.map(this, function(t, n) {
                    return e.call(t, n, t)
                }))
            },
            slice: function() {
                return this.pushStack(K.apply(this, arguments))
            },
            first: function() {
                return this.eq(0)
            },
            last: function() {
                return this.eq(-1)
            },
            eq: function(e) {
                var t = this.length
                  , n = +e + (e < 0 ? t : 0);
                return this.pushStack(n >= 0 && n < t ? [this[n]] : [])
            },
            end: function() {
                return this.prevObject || this.constructor()
            },
            push: Z,
            sort: V.sort,
            splice: V.splice
        },
        ae.extend = ae.fn.extend = function() {
            var e, t, n, r, o, i, s = arguments[0] || {}, a = 1, u = arguments.length, c = !1;
            for ("boolean" == typeof s && (c = s,
            s = arguments[a] || {},
            a++),
            "object" == typeof s || ae.isFunction(s) || (s = {}),
            a === u && (s = this,
            a--); a < u; a++)
                if (null != (e = arguments[a]))
                    for (t in e)
                        n = s[t],
                        s !== (r = e[t]) && (c && r && (ae.isPlainObject(r) || (o = Array.isArray(r))) ? (o ? (o = !1,
                        i = n && Array.isArray(n) ? n : []) : i = n && ae.isPlainObject(n) ? n : {},
                        s[t] = ae.extend(c, i, r)) : void 0 !== r && (s[t] = r));
            return s
        }
        ,
        ae.extend({
            expando: "pQuery" + ("3.2.1" + Math.random()).replace(/\D/g, ""),
            isReady: !0,
            error: function(e) {
                throw new Error(e)
            },
            noop: function() {},
            isFunction: function(e) {
                return "function" === ae.type(e)
            },
            isWindow: function(e) {
                return null != e && e === e.window
            },
            isNumeric: function(e) {
                var t = ae.type(e);
                return ("number" === t || "string" === t) && !isNaN(e - parseFloat(e))
            },
            isPlainObject: function(e) {
                var t, n;
                return !(!e || "[object Object]" !== ne.call(e) || (t = Q(e)) && ("function" != typeof (n = re.call(t, "constructor") && t.constructor) || oe.call(n) !== ie))
            },
            isEmptyObject: function(e) {
                var t;
                for (t in e)
                    return !1;
                return !0
            },
            type: function(e) {
                return null == e ? e + "" : "object" == typeof e || "function" == typeof e ? te[ne.call(e)] || "object" : typeof e
            },
            globalEval: function(e) {
                n(e)
            },
            camelCase: function(e) {
                return e.replace(ce, "ms-").replace(le, de)
            },
            each: function(e, t) {
                var n, o = 0;
                if (r(e))
                    for (n = e.length; o < n && !1 !== t.call(e[o], o, e[o]); o++)
                        ;
                else
                    for (o in e)
                        if (!1 === t.call(e[o], o, e[o]))
                            break;
                return e
            },
            trim: function(e) {
                return null == e ? "" : (e + "").replace(ue, "")
            },
            makeArray: function(e, t) {
                var n = t || [];
                return null != e && (r(Object(e)) ? ae.merge(n, "string" == typeof e ? [e] : e) : Z.call(n, e)),
                n
            },
            inArray: function(e, t, n) {
                return null == t ? -1 : ee.call(t, e, n)
            },
            merge: function(e, t) {
                for (var n = +t.length, r = 0, o = e.length; r < n; r++)
                    e[o++] = t[r];
                return e.length = o,
                e
            },
            grep: function(e, t, n) {
                for (var r = [], o = 0, i = e.length, s = !n; o < i; o++)
                    !t(e[o], o) !== s && r.push(e[o]);
                return r
            },
            map: function(e, t, n) {
                var o, i, s = 0, a = [];
                if (r(e))
                    for (o = e.length; s < o; s++)
                        null != (i = t(e[s], s, n)) && a.push(i);
                else
                    for (s in e)
                        null != (i = t(e[s], s, n)) && a.push(i);
                return J.apply([], a)
            },
            guid: 1,
            proxy: function(e, t) {
                var n, r, o;
                if ("string" == typeof t && (n = e[t],
                t = e,
                e = n),
                ae.isFunction(e))
                    return r = K.call(arguments, 2),
                    (o = function() {
                        return e.apply(t || this, r.concat(K.call(arguments)))
                    }
                    ).guid = e.guid = e.guid || ae.guid++,
                    o
            },
            now: Date.now,
            support: se
        }),
        "function" == typeof Symbol && (ae.fn[Symbol.iterator] = V[Symbol.iterator]),
        ae.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function(e, t) {
            te["[object " + t + "]"] = t.toLowerCase()
        });
        var fe = function(e) {
            function t(e, t, n, r) {
                var o, i, s, a, u, l, f, p = t && t.ownerDocument, h = t ? t.nodeType : 9;
                if (n = n || [],
                "string" != typeof e || !e || 1 !== h && 9 !== h && 11 !== h)
                    return n;
                if (!r && ((t ? t.ownerDocument || t : I) !== D && _(t),
                t = t || D,
                O)) {
                    if (11 !== h && (u = ve.exec(e)))
                        if (o = u[1]) {
                            if (9 === h) {
                                if (!(s = t.getElementById(o)))
                                    return n;
                                if (s.id === o)
                                    return n.push(s),
                                    n
                            } else if (p && (s = p.getElementById(o)) && F(t, s) && s.id === o)
                                return n.push(s),
                                n
                        } else {
                            if (u[2])
                                return Q.apply(n, t.getElementsByTagName(e)),
                                n;
                            if ((o = u[3]) && x.getElementsByClassName && t.getElementsByClassName)
                                return Q.apply(n, t.getElementsByClassName(o)),
                                n
                        }
                    if (x.qsa && !$[e + " "] && (!q || !q.test(e))) {
                        if (1 !== h)
                            p = t,
                            f = e;
                        else if ("object" !== t.nodeName.toLowerCase()) {
                            for ((a = t.getAttribute("id")) ? a = a.replace(be, xe) : t.setAttribute("id", a = H),
                            i = (l = E(e)).length; i--; )
                                l[i] = "#" + a + " " + d(l[i]);
                            f = l.join(","),
                            p = me.test(e) && c(t.parentNode) || t
                        }
                        if (f)
                            try {
                                return Q.apply(n, p.querySelectorAll(f)),
                                n
                            } catch (e) {} finally {
                                a === H && t.removeAttribute("id")
                            }
                    }
                }
                return N(e.replace(ie, "$1"), t, n, r)
            }
            function n() {
                var e = [];
                return function t(n, r) {
                    return e.push(n + " ") > w.cacheLength && delete t[e.shift()],
                    t[n + " "] = r
                }
            }
            function r(e) {
                return e[H] = !0,
                e
            }
            function o(e) {
                var t = D.createElement("fieldset");
                try {
                    return !!e(t)
                } catch (e) {
                    return !1
                } finally {
                    t.parentNode && t.parentNode.removeChild(t),
                    t = null
                }
            }
            function i(e, t) {
                for (var n = e.split("|"), r = n.length; r--; )
                    w.attrHandle[n[r]] = t
            }
            function s(e, t) {
                var n = t && e
                  , r = n && 1 === e.nodeType && 1 === t.nodeType && e.sourceIndex - t.sourceIndex;
                if (r)
                    return r;
                if (n)
                    for (; n = n.nextSibling; )
                        if (n === t)
                            return -1;
                return e ? 1 : -1
            }
            function a(e) {
                return function(t) {
                    return "form"in t ? t.parentNode && !1 === t.disabled ? "label"in t ? "label"in t.parentNode ? t.parentNode.disabled === e : t.disabled === e : t.isDisabled === e || t.isDisabled !== !e && Te(t) === e : t.disabled === e : "label"in t && t.disabled === e
                }
            }
            function u(e) {
                return r(function(t) {
                    return t = +t,
                    r(function(n, r) {
                        for (var o, i = e([], n.length, t), s = i.length; s--; )
                            n[o = i[s]] && (n[o] = !(r[o] = n[o]))
                    })
                })
            }
            function c(e) {
                return e && void 0 !== e.getElementsByTagName && e
            }
            function l() {}
            function d(e) {
                for (var t = 0, n = e.length, r = ""; t < n; t++)
                    r += e[t].value;
                return r
            }
            function f(e, t, n) {
                var r = t.dir
                  , o = t.next
                  , i = o || r
                  , s = n && "parentNode" === i
                  , a = M++;
                return t.first ? function(t, n, o) {
                    for (; t = t[r]; )
                        if (1 === t.nodeType || s)
                            return e(t, n, o);
                    return !1
                }
                : function(t, n, u) {
                    var c, l, d, f = [B, a];
                    if (u) {
                        for (; t = t[r]; )
                            if ((1 === t.nodeType || s) && e(t, n, u))
                                return !0
                    } else
                        for (; t = t[r]; )
                            if (1 === t.nodeType || s)
                                if (l = (d = t[H] || (t[H] = {}))[t.uniqueID] || (d[t.uniqueID] = {}),
                                o && o === t.nodeName.toLowerCase())
                                    t = t[r] || t;
                                else {
                                    if ((c = l[i]) && c[0] === B && c[1] === a)
                                        return f[2] = c[2];
                                    if (l[i] = f,
                                    f[2] = e(t, n, u))
                                        return !0
                                }
                    return !1
                }
            }
            function p(e) {
                return e.length > 1 ? function(t, n, r) {
                    for (var o = e.length; o--; )
                        if (!e[o](t, n, r))
                            return !1;
                    return !0
                }
                : e[0]
            }
            function h(e, n, r) {
                for (var o = 0, i = n.length; o < i; o++)
                    t(e, n[o], r);
                return r
            }
            function v(e, t, n, r, o) {
                for (var i, s = [], a = 0, u = e.length, c = null != t; a < u; a++)
                    (i = e[a]) && (n && !n(i, r, o) || (s.push(i),
                    c && t.push(a)));
                return s
            }
            function m(e, t, n, o, i, s) {
                return o && !o[H] && (o = m(o)),
                i && !i[H] && (i = m(i, s)),
                r(function(r, s, a, u) {
                    var c, l, d, f = [], p = [], m = s.length, y = r || h(t || "*", a.nodeType ? [a] : a, []), g = !e || !r && t ? y : v(y, f, e, a, u), b = n ? i || (r ? e : m || o) ? [] : s : g;
                    if (n && n(g, b, a, u),
                    o)
                        for (c = v(b, p),
                        o(c, [], a, u),
                        l = c.length; l--; )
                            (d = c[l]) && (b[p[l]] = !(g[p[l]] = d));
                    if (r) {
                        if (i || e) {
                            if (i) {
                                for (c = [],
                                l = b.length; l--; )
                                    (d = b[l]) && c.push(g[l] = d);
                                i(null, b = [], c, u)
                            }
                            for (l = b.length; l--; )
                                (d = b[l]) && (c = i ? J(r, d) : f[l]) > -1 && (r[c] = !(s[c] = d))
                        }
                    } else
                        b = v(b === s ? b.splice(m, b.length) : b),
                        i ? i(null, s, b, u) : Q.apply(s, b)
                })
            }
            function y(e) {
                for (var t, n, r, o = e.length, i = w.relative[e[0].type], s = i || w.relative[" "], a = i ? 1 : 0, u = f(function(e) {
                    return e === t
                }, s, !0), c = f(function(e) {
                    return J(t, e) > -1
                }, s, !0), l = [function(e, n, r) {
                    var o = !i && (r || n !== S) || ((t = n).nodeType ? u(e, n, r) : c(e, n, r));
                    return t = null,
                    o
                }
                ]; a < o; a++)
                    if (n = w.relative[e[a].type])
                        l = [f(p(l), n)];
                    else {
                        if ((n = w.filter[e[a].type].apply(null, e[a].matches))[H]) {
                            for (r = ++a; r < o && !w.relative[e[r].type]; r++)
                                ;
                            return m(a > 1 && p(l), a > 1 && d(e.slice(0, a - 1).concat({
                                value: " " === e[a - 2].type ? "*" : ""
                            })).replace(ie, "$1"), n, a < r && y(e.slice(a, r)), r < o && y(e = e.slice(r)), r < o && d(e))
                        }
                        l.push(n)
                    }
                return p(l)
            }
            function g(e, n) {
                var o = n.length > 0
                  , i = e.length > 0
                  , s = function(r, s, a, u, c) {
                    var l, d, f, p = 0, h = "0", m = r && [], y = [], g = S, b = r || i && w.find.TAG("*", c), x = B += null == g ? 1 : Math.random() || .1, T = b.length;
                    for (c && (S = s === D || s || c); h !== T && null != (l = b[h]); h++) {
                        if (i && l) {
                            for (d = 0,
                            s || l.ownerDocument === D || (_(l),
                            a = !O); f = e[d++]; )
                                if (f(l, s || D, a)) {
                                    u.push(l);
                                    break
                                }
                            c && (B = x)
                        }
                        o && ((l = !f && l) && p--,
                        r && m.push(l))
                    }
                    if (p += h,
                    o && h !== p) {
                        for (d = 0; f = n[d++]; )
                            f(m, y, s, a);
                        if (r) {
                            if (p > 0)
                                for (; h--; )
                                    m[h] || y[h] || (y[h] = V.call(u));
                            y = v(y)
                        }
                        Q.apply(u, y),
                        c && !r && y.length > 0 && p + n.length > 1 && t.uniqueSort(u)
                    }
                    return c && (B = x,
                    S = g),
                    m
                };
                return o ? r(s) : s
            }
            var b, x, w, T, k, E, C, N, S, A, j, _, D, P, O, q, L, R, F, H = "sizzle" + 1 * new Date, I = e.document, B = 0, M = 0, U = n(), W = n(), $ = n(), z = function(e, t) {
                return e === t && (j = !0),
                0
            }, G = {}.hasOwnProperty, X = [], V = X.pop, Y = X.push, Q = X.push, K = X.slice, J = function(e, t) {
                for (var n = 0, r = e.length; n < r; n++)
                    if (e[n] === t)
                        return n;
                return -1
            }, Z = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", ee = "[\\x20\\t\\r\\n\\f]", te = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+", ne = "\\[" + ee + "*(" + te + ")(?:" + ee + "*([*^$|!~]?=)" + ee + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + te + "))|)" + ee + "*\\]", re = ":(" + te + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + ne + ")*)|.*)\\)|)", oe = new RegExp(ee + "+","g"), ie = new RegExp("^" + ee + "+|((?:^|[^\\\\])(?:\\\\.)*)" + ee + "+$","g"), se = new RegExp("^" + ee + "*," + ee + "*"), ae = new RegExp("^" + ee + "*([>+~]|" + ee + ")" + ee + "*"), ue = new RegExp("=" + ee + "*([^\\]'\"]*?)" + ee + "*\\]","g"), ce = new RegExp(re), le = new RegExp("^" + te + "$"), de = {
                ID: new RegExp("^#(" + te + ")"),
                CLASS: new RegExp("^\\.(" + te + ")"),
                TAG: new RegExp("^(" + te + "|[*])"),
                ATTR: new RegExp("^" + ne),
                PSEUDO: new RegExp("^" + re),
                CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + ee + "*(even|odd|(([+-]|)(\\d*)n|)" + ee + "*(?:([+-]|)" + ee + "*(\\d+)|))" + ee + "*\\)|)","i"),
                bool: new RegExp("^(?:" + Z + ")$","i"),
                needsContext: new RegExp("^" + ee + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + ee + "*((?:-\\d)?\\d*)" + ee + "*\\)|)(?=[^-]|$)","i")
            }, fe = /^(?:input|select|textarea|button)$/i, pe = /^h\d$/i, he = /^[^{]+\{\s*\[native \w/, ve = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, me = /[+~]/, ye = new RegExp("\\\\([\\da-f]{1,6}" + ee + "?|(" + ee + ")|.)","ig"), ge = function(e, t, n) {
                var r = "0x" + t - 65536;
                return r != r || n ? t : r < 0 ? String.fromCharCode(r + 65536) : String.fromCharCode(r >> 10 | 55296, 1023 & r | 56320)
            }, be = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g, xe = function(e, t) {
                return t ? "\0" === e ? "�" : e.slice(0, -1) + "\\" + e.charCodeAt(e.length - 1).toString(16) + " " : "\\" + e
            }, we = function() {
                _()
            }, Te = f(function(e) {
                return !0 === e.disabled && ("form"in e || "label"in e)
            }, {
                dir: "parentNode",
                next: "legend"
            });
            try {
                Q.apply(X = K.call(I.childNodes), I.childNodes),
                X[I.childNodes.length].nodeType
            } catch (e) {
                Q = {
                    apply: X.length ? function(e, t) {
                        Y.apply(e, K.call(t))
                    }
                    : function(e, t) {
                        for (var n = e.length, r = 0; e[n++] = t[r++]; )
                            ;
                        e.length = n - 1
                    }
                }
            }
            for (b in x = t.support = {},
            k = t.isXML = function(e) {
                var t = e && (e.ownerDocument || e).documentElement;
                return !!t && "HTML" !== t.nodeName
            }
            ,
            _ = t.setDocument = function(e) {
                var t, n, r = e ? e.ownerDocument || e : I;
                return r !== D && 9 === r.nodeType && r.documentElement ? (P = (D = r).documentElement,
                O = !k(D),
                I !== D && (n = D.defaultView) && n.top !== n && (n.addEventListener ? n.addEventListener("unload", we, !1) : n.attachEvent && n.attachEvent("onunload", we)),
                x.attributes = o(function(e) {
                    return e.className = "i",
                    !e.getAttribute("className")
                }),
                x.getElementsByTagName = o(function(e) {
                    return e.appendChild(D.createComment("")),
                    !e.getElementsByTagName("*").length
                }),
                x.getElementsByClassName = he.test(D.getElementsByClassName),
                x.getById = o(function(e) {
                    return P.appendChild(e).id = H,
                    !D.getElementsByName || !D.getElementsByName(H).length
                }),
                x.getById ? (w.filter.ID = function(e) {
                    var t = e.replace(ye, ge);
                    return function(e) {
                        return e.getAttribute("id") === t
                    }
                }
                ,
                w.find.ID = function(e, t) {
                    if (void 0 !== t.getElementById && O) {
                        var n = t.getElementById(e);
                        return n ? [n] : []
                    }
                }
                ) : (w.filter.ID = function(e) {
                    var t = e.replace(ye, ge);
                    return function(e) {
                        var n = void 0 !== e.getAttributeNode && e.getAttributeNode("id");
                        return n && n.value === t
                    }
                }
                ,
                w.find.ID = function(e, t) {
                    if (void 0 !== t.getElementById && O) {
                        var n, r, o, i = t.getElementById(e);
                        if (i) {
                            if ((n = i.getAttributeNode("id")) && n.value === e)
                                return [i];
                            for (o = t.getElementsByName(e),
                            r = 0; i = o[r++]; )
                                if ((n = i.getAttributeNode("id")) && n.value === e)
                                    return [i]
                        }
                        return []
                    }
                }
                ),
                w.find.TAG = x.getElementsByTagName ? function(e, t) {
                    return void 0 !== t.getElementsByTagName ? t.getElementsByTagName(e) : x.qsa ? t.querySelectorAll(e) : void 0
                }
                : function(e, t) {
                    var n, r = [], o = 0, i = t.getElementsByTagName(e);
                    if ("*" === e) {
                        for (; n = i[o++]; )
                            1 === n.nodeType && r.push(n);
                        return r
                    }
                    return i
                }
                ,
                w.find.CLASS = x.getElementsByClassName && function(e, t) {
                    if (void 0 !== t.getElementsByClassName && O)
                        return t.getElementsByClassName(e)
                }
                ,
                L = [],
                q = [],
                (x.qsa = he.test(D.querySelectorAll)) && (o(function(e) {
                    P.appendChild(e).innerHTML = "<a id='" + H + "'></a><select id='" + H + "-\r\\' msallowcapture=''><option selected=''></option></select>",
                    e.querySelectorAll("[msallowcapture^='']").length && q.push("[*^$]=" + ee + "*(?:''|\"\")"),
                    e.querySelectorAll("[selected]").length || q.push("\\[" + ee + "*(?:value|" + Z + ")"),
                    e.querySelectorAll("[id~=" + H + "-]").length || q.push("~="),
                    e.querySelectorAll(":checked").length || q.push(":checked"),
                    e.querySelectorAll("a#" + H + "+*").length || q.push(".#.+[+~]")
                }),
                o(function(e) {
                    e.innerHTML = "<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";
                    var t = D.createElement("input");
                    t.setAttribute("type", "hidden"),
                    e.appendChild(t).setAttribute("name", "D"),
                    e.querySelectorAll("[name=d]").length && q.push("name" + ee + "*[*^$|!~]?="),
                    2 !== e.querySelectorAll(":enabled").length && q.push(":enabled", ":disabled"),
                    P.appendChild(e).disabled = !0,
                    2 !== e.querySelectorAll(":disabled").length && q.push(":enabled", ":disabled"),
                    e.querySelectorAll("*,:x"),
                    q.push(",.*:")
                })),
                (x.matchesSelector = he.test(R = P.matches || P.webkitMatchesSelector || P.mozMatchesSelector || P.oMatchesSelector || P.msMatchesSelector)) && o(function(e) {
                    x.disconnectedMatch = R.call(e, "*"),
                    R.call(e, "[s!='']:x"),
                    L.push("!=", re)
                }),
                q = q.length && new RegExp(q.join("|")),
                L = L.length && new RegExp(L.join("|")),
                t = he.test(P.compareDocumentPosition),
                F = t || he.test(P.contains) ? function(e, t) {
                    var n = 9 === e.nodeType ? e.documentElement : e
                      , r = t && t.parentNode;
                    return e === r || !(!r || 1 !== r.nodeType || !(n.contains ? n.contains(r) : e.compareDocumentPosition && 16 & e.compareDocumentPosition(r)))
                }
                : function(e, t) {
                    if (t)
                        for (; t = t.parentNode; )
                            if (t === e)
                                return !0;
                    return !1
                }
                ,
                z = t ? function(e, t) {
                    if (e === t)
                        return j = !0,
                        0;
                    var n = !e.compareDocumentPosition - !t.compareDocumentPosition;
                    return n || (1 & (n = (e.ownerDocument || e) === (t.ownerDocument || t) ? e.compareDocumentPosition(t) : 1) || !x.sortDetached && t.compareDocumentPosition(e) === n ? e === D || e.ownerDocument === I && F(I, e) ? -1 : t === D || t.ownerDocument === I && F(I, t) ? 1 : A ? J(A, e) - J(A, t) : 0 : 4 & n ? -1 : 1)
                }
                : function(e, t) {
                    if (e === t)
                        return j = !0,
                        0;
                    var n, r = 0, o = e.parentNode, i = t.parentNode, a = [e], u = [t];
                    if (!o || !i)
                        return e === D ? -1 : t === D ? 1 : o ? -1 : i ? 1 : A ? J(A, e) - J(A, t) : 0;
                    if (o === i)
                        return s(e, t);
                    for (n = e; n = n.parentNode; )
                        a.unshift(n);
                    for (n = t; n = n.parentNode; )
                        u.unshift(n);
                    for (; a[r] === u[r]; )
                        r++;
                    return r ? s(a[r], u[r]) : a[r] === I ? -1 : u[r] === I ? 1 : 0
                }
                ,
                D) : D
            }
            ,
            t.matches = function(e, n) {
                return t(e, null, null, n)
            }
            ,
            t.matchesSelector = function(e, n) {
                if ((e.ownerDocument || e) !== D && _(e),
                n = n.replace(ue, "='$1']"),
                x.matchesSelector && O && !$[n + " "] && (!L || !L.test(n)) && (!q || !q.test(n)))
                    try {
                        var r = R.call(e, n);
                        if (r || x.disconnectedMatch || e.document && 11 !== e.document.nodeType)
                            return r
                    } catch (e) {}
                return t(n, D, null, [e]).length > 0
            }
            ,
            t.contains = function(e, t) {
                return (e.ownerDocument || e) !== D && _(e),
                F(e, t)
            }
            ,
            t.attr = function(e, t) {
                (e.ownerDocument || e) !== D && _(e);
                var n = w.attrHandle[t.toLowerCase()]
                  , r = n && G.call(w.attrHandle, t.toLowerCase()) ? n(e, t, !O) : void 0;
                return void 0 !== r ? r : x.attributes || !O ? e.getAttribute(t) : (r = e.getAttributeNode(t)) && r.specified ? r.value : null
            }
            ,
            t.escape = function(e) {
                return (e + "").replace(be, xe)
            }
            ,
            t.error = function(e) {
                throw new Error("Syntax error, unrecognized expression: " + e)
            }
            ,
            t.uniqueSort = function(e) {
                var t, n = [], r = 0, o = 0;
                if (j = !x.detectDuplicates,
                A = !x.sortStable && e.slice(0),
                e.sort(z),
                j) {
                    for (; t = e[o++]; )
                        t === e[o] && (r = n.push(o));
                    for (; r--; )
                        e.splice(n[r], 1)
                }
                return A = null,
                e
            }
            ,
            T = t.getText = function(e) {
                var t, n = "", r = 0, o = e.nodeType;
                if (o) {
                    if (1 === o || 9 === o || 11 === o) {
                        if ("string" == typeof e.textContent)
                            return e.textContent;
                        for (e = e.firstChild; e; e = e.nextSibling)
                            n += T(e)
                    } else if (3 === o || 4 === o)
                        return e.nodeValue
                } else
                    for (; t = e[r++]; )
                        n += T(t);
                return n
            }
            ,
            (w = t.selectors = {
                cacheLength: 50,
                createPseudo: r,
                match: de,
                attrHandle: {},
                find: {},
                relative: {
                    ">": {
                        dir: "parentNode",
                        first: !0
                    },
                    " ": {
                        dir: "parentNode"
                    },
                    "+": {
                        dir: "previousSibling",
                        first: !0
                    },
                    "~": {
                        dir: "previousSibling"
                    }
                },
                preFilter: {
                    ATTR: function(e) {
                        return e[1] = e[1].replace(ye, ge),
                        e[3] = (e[3] || e[4] || e[5] || "").replace(ye, ge),
                        "~=" === e[2] && (e[3] = " " + e[3] + " "),
                        e.slice(0, 4)
                    },
                    CHILD: function(e) {
                        return e[1] = e[1].toLowerCase(),
                        "nth" === e[1].slice(0, 3) ? (e[3] || t.error(e[0]),
                        e[4] = +(e[4] ? e[5] + (e[6] || 1) : 2 * ("even" === e[3] || "odd" === e[3])),
                        e[5] = +(e[7] + e[8] || "odd" === e[3])) : e[3] && t.error(e[0]),
                        e
                    },
                    PSEUDO: function(e) {
                        var t, n = !e[6] && e[2];
                        return de.CHILD.test(e[0]) ? null : (e[3] ? e[2] = e[4] || e[5] || "" : n && ce.test(n) && (t = E(n, !0)) && (t = n.indexOf(")", n.length - t) - n.length) && (e[0] = e[0].slice(0, t),
                        e[2] = n.slice(0, t)),
                        e.slice(0, 3))
                    }
                },
                filter: {
                    TAG: function(e) {
                        var t = e.replace(ye, ge).toLowerCase();
                        return "*" === e ? function() {
                            return !0
                        }
                        : function(e) {
                            return e.nodeName && e.nodeName.toLowerCase() === t
                        }
                    },
                    CLASS: function(e) {
                        var t = U[e + " "];
                        return t || (t = new RegExp("(^|" + ee + ")" + e + "(" + ee + "|$)")) && U(e, function(e) {
                            return t.test("string" == typeof e.className && e.className || void 0 !== e.getAttribute && e.getAttribute("class") || "")
                        })
                    },
                    ATTR: function(e, n, r) {
                        return function(o) {
                            var i = t.attr(o, e);
                            return null == i ? "!=" === n : !n || (i += "",
                            "=" === n ? i === r : "!=" === n ? i !== r : "^=" === n ? r && 0 === i.indexOf(r) : "*=" === n ? r && i.indexOf(r) > -1 : "$=" === n ? r && i.slice(-r.length) === r : "~=" === n ? (" " + i.replace(oe, " ") + " ").indexOf(r) > -1 : "|=" === n && (i === r || i.slice(0, r.length + 1) === r + "-"))
                        }
                    },
                    CHILD: function(e, t, n, r, o) {
                        var i = "nth" !== e.slice(0, 3)
                          , s = "last" !== e.slice(-4)
                          , a = "of-type" === t;
                        return 1 === r && 0 === o ? function(e) {
                            return !!e.parentNode
                        }
                        : function(t, n, u) {
                            var c, l, d, f, p, h, v = i !== s ? "nextSibling" : "previousSibling", m = t.parentNode, y = a && t.nodeName.toLowerCase(), g = !u && !a, b = !1;
                            if (m) {
                                if (i) {
                                    for (; v; ) {
                                        for (f = t; f = f[v]; )
                                            if (a ? f.nodeName.toLowerCase() === y : 1 === f.nodeType)
                                                return !1;
                                        h = v = "only" === e && !h && "nextSibling"
                                    }
                                    return !0
                                }
                                if (h = [s ? m.firstChild : m.lastChild],
                                s && g) {
                                    for (b = (p = (c = (l = (d = (f = m)[H] || (f[H] = {}))[f.uniqueID] || (d[f.uniqueID] = {}))[e] || [])[0] === B && c[1]) && c[2],
                                    f = p && m.childNodes[p]; f = ++p && f && f[v] || (b = p = 0) || h.pop(); )
                                        if (1 === f.nodeType && ++b && f === t) {
                                            l[e] = [B, p, b];
                                            break
                                        }
                                } else if (g && (b = p = (c = (l = (d = (f = t)[H] || (f[H] = {}))[f.uniqueID] || (d[f.uniqueID] = {}))[e] || [])[0] === B && c[1]),
                                !1 === b)
                                    for (; (f = ++p && f && f[v] || (b = p = 0) || h.pop()) && ((a ? f.nodeName.toLowerCase() !== y : 1 !== f.nodeType) || !++b || (g && ((l = (d = f[H] || (f[H] = {}))[f.uniqueID] || (d[f.uniqueID] = {}))[e] = [B, b]),
                                    f !== t)); )
                                        ;
                                return (b -= o) === r || b % r == 0 && b / r >= 0
                            }
                        }
                    },
                    PSEUDO: function(e, n) {
                        var o, i = w.pseudos[e] || w.setFilters[e.toLowerCase()] || t.error("unsupported pseudo: " + e);
                        return i[H] ? i(n) : i.length > 1 ? (o = [e, e, "", n],
                        w.setFilters.hasOwnProperty(e.toLowerCase()) ? r(function(e, t) {
                            for (var r, o = i(e, n), s = o.length; s--; )
                                e[r = J(e, o[s])] = !(t[r] = o[s])
                        }) : function(e) {
                            return i(e, 0, o)
                        }
                        ) : i
                    }
                },
                pseudos: {
                    not: r(function(e) {
                        var t = []
                          , n = []
                          , o = C(e.replace(ie, "$1"));
                        return o[H] ? r(function(e, t, n, r) {
                            for (var i, s = o(e, null, r, []), a = e.length; a--; )
                                (i = s[a]) && (e[a] = !(t[a] = i))
                        }) : function(e, r, i) {
                            return t[0] = e,
                            o(t, null, i, n),
                            t[0] = null,
                            !n.pop()
                        }
                    }),
                    has: r(function(e) {
                        return function(n) {
                            return t(e, n).length > 0
                        }
                    }),
                    contains: r(function(e) {
                        return e = e.replace(ye, ge),
                        function(t) {
                            return (t.textContent || t.innerText || T(t)).indexOf(e) > -1
                        }
                    }),
                    lang: r(function(e) {
                        return le.test(e || "") || t.error("unsupported lang: " + e),
                        e = e.replace(ye, ge).toLowerCase(),
                        function(t) {
                            var n;
                            do {
                                if (n = O ? t.lang : t.getAttribute("xml:lang") || t.getAttribute("lang"))
                                    return (n = n.toLowerCase()) === e || 0 === n.indexOf(e + "-")
                            } while ((t = t.parentNode) && 1 === t.nodeType);
                            return !1
                        }
                    }),
                    target: function(t) {
                        var n = e.location && e.location.hash;
                        return n && n.slice(1) === t.id
                    },
                    root: function(e) {
                        return e === P
                    },
                    focus: function(e) {
                        return e === D.activeElement && (!D.hasFocus || D.hasFocus()) && !!(e.type || e.href || ~e.tabIndex)
                    },
                    enabled: a(!1),
                    disabled: a(!0),
                    checked: function(e) {
                        var t = e.nodeName.toLowerCase();
                        return "input" === t && !!e.checked || "option" === t && !!e.selected
                    },
                    selected: function(e) {
                        return e.parentNode && e.parentNode.selectedIndex,
                        !0 === e.selected
                    },
                    empty: function(e) {
                        for (e = e.firstChild; e; e = e.nextSibling)
                            if (e.nodeType < 6)
                                return !1;
                        return !0
                    },
                    parent: function(e) {
                        return !w.pseudos.empty(e)
                    },
                    header: function(e) {
                        return pe.test(e.nodeName)
                    },
                    input: function(e) {
                        return fe.test(e.nodeName)
                    },
                    button: function(e) {
                        var t = e.nodeName.toLowerCase();
                        return "input" === t && "button" === e.type || "button" === t
                    },
                    text: function(e) {
                        var t;
                        return "input" === e.nodeName.toLowerCase() && "text" === e.type && (null == (t = e.getAttribute("type")) || "text" === t.toLowerCase())
                    },
                    first: u(function() {
                        return [0]
                    }),
                    last: u(function(e, t) {
                        return [t - 1]
                    }),
                    eq: u(function(e, t, n) {
                        return [n < 0 ? n + t : n]
                    }),
                    even: u(function(e, t) {
                        for (var n = 0; n < t; n += 2)
                            e.push(n);
                        return e
                    }),
                    odd: u(function(e, t) {
                        for (var n = 1; n < t; n += 2)
                            e.push(n);
                        return e
                    }),
                    lt: u(function(e, t, n) {
                        for (var r = n < 0 ? n + t : n; --r >= 0; )
                            e.push(r);
                        return e
                    }),
                    gt: u(function(e, t, n) {
                        for (var r = n < 0 ? n + t : n; ++r < t; )
                            e.push(r);
                        return e
                    })
                }
            }).pseudos.nth = w.pseudos.eq,
            {
                radio: !0,
                checkbox: !0,
                file: !0,
                password: !0,
                image: !0
            })
                w.pseudos[b] = function(e) {
                    return function(t) {
                        return "input" === t.nodeName.toLowerCase() && t.type === e
                    }
                }(b);
            for (b in {
                submit: !0,
                reset: !0
            })
                w.pseudos[b] = function(e) {
                    return function(t) {
                        var n = t.nodeName.toLowerCase();
                        return ("input" === n || "button" === n) && t.type === e
                    }
                }(b);
            return l.prototype = w.filters = w.pseudos,
            w.setFilters = new l,
            E = t.tokenize = function(e, n) {
                var r, o, i, s, a, u, c, l = W[e + " "];
                if (l)
                    return n ? 0 : l.slice(0);
                for (a = e,
                u = [],
                c = w.preFilter; a; ) {
                    for (s in r && !(o = se.exec(a)) || (o && (a = a.slice(o[0].length) || a),
                    u.push(i = [])),
                    r = !1,
                    (o = ae.exec(a)) && (r = o.shift(),
                    i.push({
                        value: r,
                        type: o[0].replace(ie, " ")
                    }),
                    a = a.slice(r.length)),
                    w.filter)
                        !(o = de[s].exec(a)) || c[s] && !(o = c[s](o)) || (r = o.shift(),
                        i.push({
                            value: r,
                            type: s,
                            matches: o
                        }),
                        a = a.slice(r.length));
                    if (!r)
                        break
                }
                return n ? a.length : a ? t.error(e) : W(e, u).slice(0)
            }
            ,
            C = t.compile = function(e, t) {
                var n, r = [], o = [], i = $[e + " "];
                if (!i) {
                    for (t || (t = E(e)),
                    n = t.length; n--; )
                        (i = y(t[n]))[H] ? r.push(i) : o.push(i);
                    (i = $(e, g(o, r))).selector = e
                }
                return i
            }
            ,
            N = t.select = function(e, t, n, r) {
                var o, i, s, a, u, l = "function" == typeof e && e, f = !r && E(e = l.selector || e);
                if (n = n || [],
                1 === f.length) {
                    if ((i = f[0] = f[0].slice(0)).length > 2 && "ID" === (s = i[0]).type && 9 === t.nodeType && O && w.relative[i[1].type]) {
                        if (!(t = (w.find.ID(s.matches[0].replace(ye, ge), t) || [])[0]))
                            return n;
                        l && (t = t.parentNode),
                        e = e.slice(i.shift().value.length)
                    }
                    for (o = de.needsContext.test(e) ? 0 : i.length; o-- && (s = i[o],
                    !w.relative[a = s.type]); )
                        if ((u = w.find[a]) && (r = u(s.matches[0].replace(ye, ge), me.test(i[0].type) && c(t.parentNode) || t))) {
                            if (i.splice(o, 1),
                            !(e = r.length && d(i)))
                                return Q.apply(n, r),
                                n;
                            break
                        }
                }
                return (l || C(e, f))(r, t, !O, n, !t || me.test(e) && c(t.parentNode) || t),
                n
            }
            ,
            x.sortStable = H.split("").sort(z).join("") === H,
            x.detectDuplicates = !!j,
            _(),
            x.sortDetached = o(function(e) {
                return 1 & e.compareDocumentPosition(D.createElement("fieldset"))
            }),
            o(function(e) {
                return e.innerHTML = "<a href='#'></a>",
                "#" === e.firstChild.getAttribute("href")
            }) || i("type|href|height|width", function(e, t, n) {
                if (!n)
                    return e.getAttribute(t, "type" === t.toLowerCase() ? 1 : 2)
            }),
            x.attributes && o(function(e) {
                return e.innerHTML = "<input/>",
                e.firstChild.setAttribute("value", ""),
                "" === e.firstChild.getAttribute("value")
            }) || i("value", function(e, t, n) {
                if (!n && "input" === e.nodeName.toLowerCase())
                    return e.defaultValue
            }),
            o(function(e) {
                return null == e.getAttribute("disabled")
            }) || i(Z, function(e, t, n) {
                var r;
                if (!n)
                    return !0 === e[t] ? t.toLowerCase() : (r = e.getAttributeNode(t)) && r.specified ? r.value : null
            }),
            t
        }(e);
        ae.find = fe,
        ae.expr = fe.selectors,
        ae.expr[":"] = ae.expr.pseudos,
        ae.uniqueSort = ae.unique = fe.uniqueSort,
        ae.text = fe.getText,
        ae.isXMLDoc = fe.isXML,
        ae.contains = fe.contains,
        ae.escapeSelector = fe.escape;
        var pe = function(e, t, n) {
            for (var r = [], o = void 0 !== n; (e = e[t]) && 9 !== e.nodeType; )
                if (1 === e.nodeType) {
                    if (o && ae(e).is(n))
                        break;
                    r.push(e)
                }
            return r
        }
          , he = function(e, t) {
            for (var n = []; e; e = e.nextSibling)
                1 === e.nodeType && e !== t && n.push(e);
            return n
        }
          , ve = ae.expr.match.needsContext
          , me = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i
          , ye = /^.[^:#\[\.,]*$/;
        ae.filter = function(e, t, n) {
            var r = t[0];
            return n && (e = ":not(" + e + ")"),
            1 === t.length && 1 === r.nodeType ? ae.find.matchesSelector(r, e) ? [r] : [] : ae.find.matches(e, ae.grep(t, function(e) {
                return 1 === e.nodeType
            }))
        }
        ,
        ae.fn.extend({
            find: function(e) {
                var t, n, r = this.length, o = this;
                if ("string" != typeof e)
                    return this.pushStack(ae(e).filter(function() {
                        for (t = 0; t < r; t++)
                            if (ae.contains(o[t], this))
                                return !0
                    }));
                for (n = this.pushStack([]),
                t = 0; t < r; t++)
                    ae.find(e, o[t], n);
                return r > 1 ? ae.uniqueSort(n) : n
            },
            filter: function(e) {
                return this.pushStack(i(this, e || [], !1))
            },
            not: function(e) {
                return this.pushStack(i(this, e || [], !0))
            },
            is: function(e) {
                return !!i(this, "string" == typeof e && ve.test(e) ? ae(e) : e || [], !1).length
            }
        });
        var ge, be = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;
        (ae.fn.init = function(e, t, n) {
            var r, o;
            if (!e)
                return this;
            if (n = n || ge,
            "string" == typeof e) {
                if (!(r = "<" === e[0] && ">" === e[e.length - 1] && e.length >= 3 ? [null, e, null] : be.exec(e)) || !r[1] && t)
                    return !t || t.jquery ? (t || n).find(e) : this.constructor(t).find(e);
                if (r[1]) {
                    if (t = t instanceof ae ? t[0] : t,
                    ae.merge(this, ae.parseHTML(r[1], t && t.nodeType ? t.ownerDocument || t : Y, !0)),
                    me.test(r[1]) && ae.isPlainObject(t))
                        for (r in t)
                            ae.isFunction(this[r]) ? this[r](t[r]) : this.attr(r, t[r]);
                    return this
                }
                return (o = Y.getElementById(r[2])) && (this[0] = o,
                this.length = 1),
                this
            }
            return e.nodeType ? (this[0] = e,
            this.length = 1,
            this) : ae.isFunction(e) ? void 0 !== n.ready ? n.ready(e) : e(ae) : ae.makeArray(e, this)
        }
        ).prototype = ae.fn,
        ge = ae(Y);
        var xe = /^(?:parents|prev(?:Until|All))/
          , we = {
            children: !0,
            contents: !0,
            next: !0,
            prev: !0
        };
        ae.fn.extend({
            has: function(e) {
                var t = ae(e, this)
                  , n = t.length;
                return this.filter(function() {
                    for (var e = 0; e < n; e++)
                        if (ae.contains(this, t[e]))
                            return !0
                })
            },
            closest: function(e, t) {
                var n, r = 0, o = this.length, i = [], s = "string" != typeof e && ae(e);
                if (!ve.test(e))
                    for (; r < o; r++)
                        for (n = this[r]; n && n !== t; n = n.parentNode)
                            if (n.nodeType < 11 && (s ? s.index(n) > -1 : 1 === n.nodeType && ae.find.matchesSelector(n, e))) {
                                i.push(n);
                                break
                            }
                return this.pushStack(i.length > 1 ? ae.uniqueSort(i) : i)
            },
            index: function(e) {
                return e ? "string" == typeof e ? ee.call(ae(e), this[0]) : ee.call(this, e.jquery ? e[0] : e) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1
            },
            add: function(e, t) {
                return this.pushStack(ae.uniqueSort(ae.merge(this.get(), ae(e, t))))
            },
            addBack: function(e) {
                return this.add(null == e ? this.prevObject : this.prevObject.filter(e))
            }
        }),
        ae.each({
            parent: function(e) {
                var t = e.parentNode;
                return t && 11 !== t.nodeType ? t : null
            },
            parents: function(e) {
                return pe(e, "parentNode")
            },
            parentsUntil: function(e, t, n) {
                return pe(e, "parentNode", n)
            },
            next: function(e) {
                return s(e, "nextSibling")
            },
            prev: function(e) {
                return s(e, "previousSibling")
            },
            nextAll: function(e) {
                return pe(e, "nextSibling")
            },
            prevAll: function(e) {
                return pe(e, "previousSibling")
            },
            nextUntil: function(e, t, n) {
                return pe(e, "nextSibling", n)
            },
            prevUntil: function(e, t, n) {
                return pe(e, "previousSibling", n)
            },
            siblings: function(e) {
                return he((e.parentNode || {}).firstChild, e)
            },
            children: function(e) {
                return he(e.firstChild)
            },
            contents: function(e) {
                return o(e, "iframe") ? e.contentDocument : (o(e, "template") && (e = e.content || e),
                ae.merge([], e.childNodes))
            }
        }, function(e, t) {
            ae.fn[e] = function(n, r) {
                var o = ae.map(this, t, n);
                return "Until" !== e.slice(-5) && (r = n),
                r && "string" == typeof r && (o = ae.filter(r, o)),
                this.length > 1 && (we[e] || ae.uniqueSort(o),
                xe.test(e) && o.reverse()),
                this.pushStack(o)
            }
        });
        var Te = /[^\x20\t\r\n\f]+/g;
        ae.Callbacks = function(e) {
            e = "string" == typeof e ? function(e) {
                var t = {};
                return ae.each(e.match(Te) || [], function(e, n) {
                    t[n] = !0
                }),
                t
            }(e) : ae.extend({}, e);
            var t, n, r, o, i = [], s = [], a = -1, u = function() {
                for (o = o || e.once,
                r = t = !0; s.length; a = -1)
                    for (n = s.shift(); ++a < i.length; )
                        !1 === i[a].apply(n[0], n[1]) && e.stopOnFalse && (a = i.length,
                        n = !1);
                e.memory || (n = !1),
                t = !1,
                o && (i = n ? [] : "")
            }, c = {
                add: function() {
                    return i && (n && !t && (a = i.length - 1,
                    s.push(n)),
                    function t(n) {
                        ae.each(n, function(n, r) {
                            ae.isFunction(r) ? e.unique && c.has(r) || i.push(r) : r && r.length && "string" !== ae.type(r) && t(r)
                        })
                    }(arguments),
                    n && !t && u()),
                    this
                },
                remove: function() {
                    return ae.each(arguments, function(e, t) {
                        for (var n; (n = ae.inArray(t, i, n)) > -1; )
                            i.splice(n, 1),
                            n <= a && a--
                    }),
                    this
                },
                has: function(e) {
                    return e ? ae.inArray(e, i) > -1 : i.length > 0
                },
                empty: function() {
                    return i && (i = []),
                    this
                },
                disable: function() {
                    return o = s = [],
                    i = n = "",
                    this
                },
                disabled: function() {
                    return !i
                },
                lock: function() {
                    return o = s = [],
                    n || t || (i = n = ""),
                    this
                },
                locked: function() {
                    return !!o
                },
                fireWith: function(e, n) {
                    return o || (n = [e, (n = n || []).slice ? n.slice() : n],
                    s.push(n),
                    t || u()),
                    this
                },
                fire: function() {
                    return c.fireWith(this, arguments),
                    this
                },
                fired: function() {
                    return !!r
                }
            };
            return c
        }
        ,
        ae.extend({
            Deferred: function(t) {
                var n = [["notify", "progress", ae.Callbacks("memory"), ae.Callbacks("memory"), 2], ["resolve", "done", ae.Callbacks("once memory"), ae.Callbacks("once memory"), 0, "resolved"], ["reject", "fail", ae.Callbacks("once memory"), ae.Callbacks("once memory"), 1, "rejected"]]
                  , r = "pending"
                  , o = {
                    state: function() {
                        return r
                    },
                    always: function() {
                        return i.done(arguments).fail(arguments),
                        this
                    },
                    catch: function(e) {
                        return o.then(null, e)
                    },
                    pipe: function() {
                        var e = arguments;
                        return ae.Deferred(function(t) {
                            ae.each(n, function(n, r) {
                                var o = ae.isFunction(e[r[4]]) && e[r[4]];
                                i[r[1]](function() {
                                    var e = o && o.apply(this, arguments);
                                    e && ae.isFunction(e.promise) ? e.promise().progress(t.notify).done(t.resolve).fail(t.reject) : t[r[0] + "With"](this, o ? [e] : arguments)
                                })
                            }),
                            e = null
                        }).promise()
                    },
                    then: function(t, r, o) {
                        function i(t, n, r, o) {
                            return function() {
                                var c = this
                                  , l = arguments
                                  , d = function() {
                                    var e, d;
                                    if (!(t < s)) {
                                        if ((e = r.apply(c, l)) === n.promise())
                                            throw new TypeError("Thenable self-resolution");
                                        d = e && ("object" == typeof e || "function" == typeof e) && e.then,
                                        ae.isFunction(d) ? o ? d.call(e, i(s, n, a, o), i(s, n, u, o)) : (s++,
                                        d.call(e, i(s, n, a, o), i(s, n, u, o), i(s, n, a, n.notifyWith))) : (r !== a && (c = void 0,
                                        l = [e]),
                                        (o || n.resolveWith)(c, l))
                                    }
                                }
                                  , f = o ? d : function() {
                                    try {
                                        d()
                                    } catch (e) {
                                        ae.Deferred.exceptionHook && ae.Deferred.exceptionHook(e, f.stackTrace),
                                        t + 1 >= s && (r !== u && (c = void 0,
                                        l = [e]),
                                        n.rejectWith(c, l))
                                    }
                                }
                                ;
                                t ? f() : (ae.Deferred.getStackHook && (f.stackTrace = ae.Deferred.getStackHook()),
                                e.setTimeout(f))
                            }
                        }
                        var s = 0;
                        return ae.Deferred(function(e) {
                            n[0][3].add(i(0, e, ae.isFunction(o) ? o : a, e.notifyWith)),
                            n[1][3].add(i(0, e, ae.isFunction(t) ? t : a)),
                            n[2][3].add(i(0, e, ae.isFunction(r) ? r : u))
                        }).promise()
                    },
                    promise: function(e) {
                        return null != e ? ae.extend(e, o) : o
                    }
                }
                  , i = {};
                return ae.each(n, function(e, t) {
                    var s = t[2]
                      , a = t[5];
                    o[t[1]] = s.add,
                    a && s.add(function() {
                        r = a
                    }, n[3 - e][2].disable, n[0][2].lock),
                    s.add(t[3].fire),
                    i[t[0]] = function() {
                        return i[t[0] + "With"](this === i ? void 0 : this, arguments),
                        this
                    }
                    ,
                    i[t[0] + "With"] = s.fireWith
                }),
                o.promise(i),
                t && t.call(i, i),
                i
            },
            when: function(e) {
                var t = arguments.length
                  , n = t
                  , r = Array(n)
                  , o = K.call(arguments)
                  , i = ae.Deferred()
                  , s = function(e) {
                    return function(n) {
                        r[e] = this,
                        o[e] = arguments.length > 1 ? K.call(arguments) : n,
                        --t || i.resolveWith(r, o)
                    }
                };
                if (t <= 1 && (c(e, i.done(s(n)).resolve, i.reject, !t),
                "pending" === i.state() || ae.isFunction(o[n] && o[n].then)))
                    return i.then();
                for (; n--; )
                    c(o[n], s(n), i.reject);
                return i.promise()
            }
        });
        var ke = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
        ae.Deferred.exceptionHook = function(t, n) {
            e.console && e.console.warn && t && ke.test(t.name) && e.console.warn("pQuery.Deferred exception: " + t.message, t.stack, n)
        }
        ,
        ae.readyException = function(t) {
            e.setTimeout(function() {
                throw t
            })
        }
        ;
        var Ee = ae.Deferred();
        ae.fn.ready = function(e) {
            return Ee.then(e).catch(function(e) {
                ae.readyException(e)
            }),
            this
        }
        ,
        ae.extend({
            isReady: !1,
            readyWait: 1,
            ready: function(e) {
                (!0 === e ? --ae.readyWait : ae.isReady) || (ae.isReady = !0,
                !0 !== e && --ae.readyWait > 0 || Ee.resolveWith(Y, [ae]))
            }
        }),
        ae.ready.then = Ee.then,
        "complete" === Y.readyState || "loading" !== Y.readyState && !Y.documentElement.doScroll ? e.setTimeout(ae.ready) : (Y.addEventListener("DOMContentLoaded", l),
        e.addEventListener("load", l));
        var Ce = function(e, t, n, r, o, i, s) {
            var a = 0
              , u = e.length
              , c = null == n;
            if ("object" === ae.type(n))
                for (a in o = !0,
                n)
                    Ce(e, t, a, n[a], !0, i, s);
            else if (void 0 !== r && (o = !0,
            ae.isFunction(r) || (s = !0),
            c && (s ? (t.call(e, r),
            t = null) : (c = t,
            t = function(e, t, n) {
                return c.call(ae(e), n)
            }
            )),
            t))
                for (; a < u; a++)
                    t(e[a], n, s ? r : r.call(e[a], a, t(e[a], n)));
            return o ? e : c ? t.call(e) : u ? t(e[0], n) : i
        }
          , Ne = function(e) {
            return 1 === e.nodeType || 9 === e.nodeType || !+e.nodeType
        };
        d.uid = 1,
        d.prototype = {
            cache: function(e) {
                var t = e[this.expando];
                return t || (t = {},
                Ne(e) && (e.nodeType ? e[this.expando] = t : Object.defineProperty(e, this.expando, {
                    value: t,
                    configurable: !0
                }))),
                t
            },
            set: function(e, t, n) {
                var r, o = this.cache(e);
                if ("string" == typeof t)
                    o[ae.camelCase(t)] = n;
                else
                    for (r in t)
                        o[ae.camelCase(r)] = t[r];
                return o
            },
            get: function(e, t) {
                return void 0 === t ? this.cache(e) : e[this.expando] && e[this.expando][ae.camelCase(t)]
            },
            access: function(e, t, n) {
                return void 0 === t || t && "string" == typeof t && void 0 === n ? this.get(e, t) : (this.set(e, t, n),
                void 0 !== n ? n : t)
            },
            remove: function(e, t) {
                var n, r = e[this.expando];
                if (void 0 !== r) {
                    if (void 0 !== t) {
                        Array.isArray(t) ? t = t.map(ae.camelCase) : t = (t = ae.camelCase(t))in r ? [t] : t.match(Te) || [],
                        n = t.length;
                        for (; n--; )
                            delete r[t[n]]
                    }
                    (void 0 === t || ae.isEmptyObject(r)) && (e.nodeType ? e[this.expando] = void 0 : delete e[this.expando])
                }
            },
            hasData: function(e) {
                var t = e[this.expando];
                return void 0 !== t && !ae.isEmptyObject(t)
            }
        };
        var Se = new d
          , Ae = new d
          , je = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/
          , _e = /[A-Z]/g;
        ae.extend({
            hasData: function(e) {
                return Ae.hasData(e) || Se.hasData(e)
            },
            data: function(e, t, n) {
                return Ae.access(e, t, n)
            },
            removeData: function(e, t) {
                Ae.remove(e, t)
            },
            _data: function(e, t, n) {
                return Se.access(e, t, n)
            },
            _removeData: function(e, t) {
                Se.remove(e, t)
            }
        }),
        ae.fn.extend({
            data: function(e, t) {
                var n, r, o, i = this[0], s = i && i.attributes;
                if (void 0 === e) {
                    if (this.length && (o = Ae.get(i),
                    1 === i.nodeType && !Se.get(i, "hasDataAttrs"))) {
                        for (n = s.length; n--; )
                            s[n] && (0 === (r = s[n].name).indexOf("data-") && (r = ae.camelCase(r.slice(5)),
                            f(i, r, o[r])));
                        Se.set(i, "hasDataAttrs", !0)
                    }
                    return o
                }
                return "object" == typeof e ? this.each(function() {
                    Ae.set(this, e)
                }) : Ce(this, function(t) {
                    var n;
                    if (i && void 0 === t) {
                        if (void 0 !== (n = Ae.get(i, e)))
                            return n;
                        if (void 0 !== (n = f(i, e)))
                            return n
                    } else
                        this.each(function() {
                            Ae.set(this, e, t)
                        })
                }, null, t, arguments.length > 1, null, !0)
            },
            removeData: function(e) {
                return this.each(function() {
                    Ae.remove(this, e)
                })
            }
        }),
        ae.extend({
            queue: function(e, t, n) {
                var r;
                if (e)
                    return t = (t || "fx") + "queue",
                    r = Se.get(e, t),
                    n && (!r || Array.isArray(n) ? r = Se.access(e, t, ae.makeArray(n)) : r.push(n)),
                    r || []
            },
            dequeue: function(e, t) {
                t = t || "fx";
                var n = ae.queue(e, t)
                  , r = n.length
                  , o = n.shift()
                  , i = ae._queueHooks(e, t);
                "inprogress" === o && (o = n.shift(),
                r--),
                o && ("fx" === t && n.unshift("inprogress"),
                delete i.stop,
                o.call(e, function() {
                    ae.dequeue(e, t)
                }, i)),
                !r && i && i.empty.fire()
            },
            _queueHooks: function(e, t) {
                var n = t + "queueHooks";
                return Se.get(e, n) || Se.access(e, n, {
                    empty: ae.Callbacks("once memory").add(function() {
                        Se.remove(e, [t + "queue", n])
                    })
                })
            }
        }),
        ae.fn.extend({
            queue: function(e, t) {
                var n = 2;
                return "string" != typeof e && (t = e,
                e = "fx",
                n--),
                arguments.length < n ? ae.queue(this[0], e) : void 0 === t ? this : this.each(function() {
                    var n = ae.queue(this, e, t);
                    ae._queueHooks(this, e),
                    "fx" === e && "inprogress" !== n[0] && ae.dequeue(this, e)
                })
            },
            dequeue: function(e) {
                return this.each(function() {
                    ae.dequeue(this, e)
                })
            },
            clearQueue: function(e) {
                return this.queue(e || "fx", [])
            },
            promise: function(e, t) {
                var n, r = 1, o = ae.Deferred(), i = this, s = this.length, a = function() {
                    --r || o.resolveWith(i, [i])
                };
                for ("string" != typeof e && (t = e,
                e = void 0),
                e = e || "fx"; s--; )
                    (n = Se.get(i[s], e + "queueHooks")) && n.empty && (r++,
                    n.empty.add(a));
                return a(),
                o.promise(t)
            }
        });
        var De = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source
          , Pe = new RegExp("^(?:([+-])=|)(" + De + ")([a-z%]*)$","i")
          , Oe = ["Top", "Right", "Bottom", "Left"]
          , qe = function(e, t) {
            return "none" === (e = t || e).style.display || "" === e.style.display && ae.contains(e.ownerDocument, e) && "none" === ae.css(e, "display")
        }
          , Le = function(e, t, n, r) {
            var o, i, s = {};
            for (i in t)
                s[i] = e.style[i],
                e.style[i] = t[i];
            for (i in o = n.apply(e, r || []),
            t)
                e.style[i] = s[i];
            return o
        }
          , Re = {};
        ae.fn.extend({
            show: function() {
                return v(this, !0)
            },
            hide: function() {
                return v(this)
            },
            toggle: function(e) {
                return "boolean" == typeof e ? e ? this.show() : this.hide() : this.each(function() {
                    qe(this) ? ae(this).show() : ae(this).hide()
                })
            }
        });
        var Fe = /^(?:checkbox|radio)$/i
          , He = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i
          , Ie = /^$|\/(?:java|ecma)script/i
          , Be = {
            option: [1, "<select multiple='multiple'>", "</select>"],
            thead: [1, "<table>", "</table>"],
            col: [2, "<table><colgroup>", "</colgroup></table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            _default: [0, "", ""]
        };
        Be.optgroup = Be.option,
        Be.tbody = Be.tfoot = Be.colgroup = Be.caption = Be.thead,
        Be.th = Be.td;
        var Me = /<|&#?\w+;/;
        !function() {
            var e = Y.createDocumentFragment().appendChild(Y.createElement("div"))
              , t = Y.createElement("input");
            t.setAttribute("type", "radio"),
            t.setAttribute("checked", "checked"),
            t.setAttribute("name", "t"),
            e.appendChild(t),
            se.checkClone = e.cloneNode(!0).cloneNode(!0).lastChild.checked,
            e.innerHTML = "<textarea>x</textarea>",
            se.noCloneChecked = !!e.cloneNode(!0).lastChild.defaultValue
        }();
        var Ue = Y.documentElement
          , We = /^key/
          , $e = /^(?:mouse|pointer|contextmenu|drag|drop)|click/
          , ze = /^([^.]*)(?:\.(.+)|)/;
        ae.event = {
            global: {},
            add: function(e, t, n, r, o) {
                var i, s, a, u, c, l, d, f, p, h, v, m = Se.get(e);
                if (m)
                    for (n.handler && (n = (i = n).handler,
                    o = i.selector),
                    o && ae.find.matchesSelector(Ue, o),
                    n.guid || (n.guid = ae.guid++),
                    (u = m.events) || (u = m.events = {}),
                    (s = m.handle) || (s = m.handle = function(t) {
                        return void 0 !== ae && ae.event.triggered !== t.type ? ae.event.dispatch.apply(e, arguments) : void 0
                    }
                    ),
                    c = (t = (t || "").match(Te) || [""]).length; c--; )
                        p = v = (a = ze.exec(t[c]) || [])[1],
                        h = (a[2] || "").split(".").sort(),
                        p && (d = ae.event.special[p] || {},
                        p = (o ? d.delegateType : d.bindType) || p,
                        d = ae.event.special[p] || {},
                        l = ae.extend({
                            type: p,
                            origType: v,
                            data: r,
                            handler: n,
                            guid: n.guid,
                            selector: o,
                            needsContext: o && ae.expr.match.needsContext.test(o),
                            namespace: h.join(".")
                        }, i),
                        (f = u[p]) || ((f = u[p] = []).delegateCount = 0,
                        d.setup && !1 !== d.setup.call(e, r, h, s) || e.addEventListener && e.addEventListener(p, s)),
                        d.add && (d.add.call(e, l),
                        l.handler.guid || (l.handler.guid = n.guid)),
                        o ? f.splice(f.delegateCount++, 0, l) : f.push(l),
                        ae.event.global[p] = !0)
            },
            remove: function(e, t, n, r, o) {
                var i, s, a, u, c, l, d, f, p, h, v, m = Se.hasData(e) && Se.get(e);
                if (m && (u = m.events)) {
                    for (c = (t = (t || "").match(Te) || [""]).length; c--; )
                        if (p = v = (a = ze.exec(t[c]) || [])[1],
                        h = (a[2] || "").split(".").sort(),
                        p) {
                            for (d = ae.event.special[p] || {},
                            f = u[p = (r ? d.delegateType : d.bindType) || p] || [],
                            a = a[2] && new RegExp("(^|\\.)" + h.join("\\.(?:.*\\.|)") + "(\\.|$)"),
                            s = i = f.length; i--; )
                                l = f[i],
                                !o && v !== l.origType || n && n.guid !== l.guid || a && !a.test(l.namespace) || r && r !== l.selector && ("**" !== r || !l.selector) || (f.splice(i, 1),
                                l.selector && f.delegateCount--,
                                d.remove && d.remove.call(e, l));
                            s && !f.length && (d.teardown && !1 !== d.teardown.call(e, h, m.handle) || ae.removeEvent(e, p, m.handle),
                            delete u[p])
                        } else
                            for (p in u)
                                ae.event.remove(e, p + t[c], n, r, !0);
                    ae.isEmptyObject(u) && Se.remove(e, "handle events")
                }
            },
            dispatch: function(e) {
                var t, n, r, o, i, s, a = ae.event.fix(e), u = new Array(arguments.length), c = (Se.get(this, "events") || {})[a.type] || [], l = ae.event.special[a.type] || {};
                for (u[0] = a,
                t = 1; t < arguments.length; t++)
                    u[t] = arguments[t];
                if (a.delegateTarget = this,
                !l.preDispatch || !1 !== l.preDispatch.call(this, a)) {
                    for (s = ae.event.handlers.call(this, a, c),
                    t = 0; (o = s[t++]) && !a.isPropagationStopped(); )
                        for (a.currentTarget = o.elem,
                        n = 0; (i = o.handlers[n++]) && !a.isImmediatePropagationStopped(); )
                            a.rnamespace && !a.rnamespace.test(i.namespace) || (a.handleObj = i,
                            a.data = i.data,
                            void 0 !== (r = ((ae.event.special[i.origType] || {}).handle || i.handler).apply(o.elem, u)) && !1 === (a.result = r) && (a.preventDefault(),
                            a.stopPropagation()));
                    return l.postDispatch && l.postDispatch.call(this, a),
                    a.result
                }
            },
            handlers: function(e, t) {
                var n, r, o, i, s, a = [], u = t.delegateCount, c = e.target;
                if (u && c.nodeType && !("click" === e.type && e.button >= 1))
                    for (; c !== this; c = c.parentNode || this)
                        if (1 === c.nodeType && ("click" !== e.type || !0 !== c.disabled)) {
                            for (i = [],
                            s = {},
                            n = 0; n < u; n++)
                                void 0 === s[o = (r = t[n]).selector + " "] && (s[o] = r.needsContext ? ae(o, this).index(c) > -1 : ae.find(o, this, null, [c]).length),
                                s[o] && i.push(r);
                            i.length && a.push({
                                elem: c,
                                handlers: i
                            })
                        }
                return c = this,
                u < t.length && a.push({
                    elem: c,
                    handlers: t.slice(u)
                }),
                a
            },
            addProp: function(e, t) {
                Object.defineProperty(ae.Event.prototype, e, {
                    enumerable: !0,
                    configurable: !0,
                    get: ae.isFunction(t) ? function() {
                        if (this.originalEvent)
                            return t(this.originalEvent)
                    }
                    : function() {
                        if (this.originalEvent)
                            return this.originalEvent[e]
                    }
                    ,
                    set: function(t) {
                        Object.defineProperty(this, e, {
                            enumerable: !0,
                            configurable: !0,
                            writable: !0,
                            value: t
                        })
                    }
                })
            },
            fix: function(e) {
                return e[ae.expando] ? e : new ae.Event(e)
            },
            special: {
                load: {
                    noBubble: !0
                },
                focus: {
                    trigger: function() {
                        if (this !== w() && this.focus)
                            return this.focus(),
                            !1
                    },
                    delegateType: "focusin"
                },
                blur: {
                    trigger: function() {
                        if (this === w() && this.blur)
                            return this.blur(),
                            !1
                    },
                    delegateType: "focusout"
                },
                click: {
                    trigger: function() {
                        if ("checkbox" === this.type && this.click && o(this, "input"))
                            return this.click(),
                            !1
                    },
                    _default: function(e) {
                        return o(e.target, "a")
                    }
                },
                beforeunload: {
                    postDispatch: function(e) {
                        void 0 !== e.result && e.originalEvent && (e.originalEvent.returnValue = e.result)
                    }
                }
            }
        },
        ae.removeEvent = function(e, t, n) {
            e.removeEventListener && e.removeEventListener(t, n)
        }
        ,
        ae.Event = function(e, t) {
            if (!(this instanceof ae.Event))
                return new ae.Event(e,t);
            e && e.type ? (this.originalEvent = e,
            this.type = e.type,
            this.isDefaultPrevented = e.defaultPrevented || void 0 === e.defaultPrevented && !1 === e.returnValue ? b : x,
            this.target = e.target && 3 === e.target.nodeType ? e.target.parentNode : e.target,
            this.currentTarget = e.currentTarget,
            this.relatedTarget = e.relatedTarget) : this.type = e,
            t && ae.extend(this, t),
            this.timeStamp = e && e.timeStamp || ae.now(),
            this[ae.expando] = !0
        }
        ,
        ae.Event.prototype = {
            constructor: ae.Event,
            isDefaultPrevented: x,
            isPropagationStopped: x,
            isImmediatePropagationStopped: x,
            isSimulated: !1,
            preventDefault: function() {
                var e = this.originalEvent;
                this.isDefaultPrevented = b,
                e && !this.isSimulated && e.preventDefault()
            },
            stopPropagation: function() {
                var e = this.originalEvent;
                this.isPropagationStopped = b,
                e && !this.isSimulated && e.stopPropagation()
            },
            stopImmediatePropagation: function() {
                var e = this.originalEvent;
                this.isImmediatePropagationStopped = b,
                e && !this.isSimulated && e.stopImmediatePropagation(),
                this.stopPropagation()
            }
        },
        ae.each({
            altKey: !0,
            bubbles: !0,
            cancelable: !0,
            changedTouches: !0,
            ctrlKey: !0,
            detail: !0,
            eventPhase: !0,
            metaKey: !0,
            pageX: !0,
            pageY: !0,
            shiftKey: !0,
            view: !0,
            char: !0,
            charCode: !0,
            key: !0,
            keyCode: !0,
            button: !0,
            buttons: !0,
            clientX: !0,
            clientY: !0,
            offsetX: !0,
            offsetY: !0,
            pointerId: !0,
            pointerType: !0,
            screenX: !0,
            screenY: !0,
            targetTouches: !0,
            toElement: !0,
            touches: !0,
            which: function(e) {
                var t = e.button;
                return null == e.which && We.test(e.type) ? null != e.charCode ? e.charCode : e.keyCode : !e.which && void 0 !== t && $e.test(e.type) ? 1 & t ? 1 : 2 & t ? 3 : 4 & t ? 2 : 0 : e.which
            }
        }, ae.event.addProp),
        ae.each({
            mouseenter: "mouseover",
            mouseleave: "mouseout",
            pointerenter: "pointerover",
            pointerleave: "pointerout"
        }, function(e, t) {
            ae.event.special[e] = {
                delegateType: t,
                bindType: t,
                handle: function(e) {
                    var n, r = e.relatedTarget, o = e.handleObj;
                    return r && (r === this || ae.contains(this, r)) || (e.type = o.origType,
                    n = o.handler.apply(this, arguments),
                    e.type = t),
                    n
                }
            }
        }),
        ae.fn.extend({
            on: function(e, t, n, r) {
                return T(this, e, t, n, r)
            },
            one: function(e, t, n, r) {
                return T(this, e, t, n, r, 1)
            },
            off: function(e, t, n) {
                var r, o;
                if (e && e.preventDefault && e.handleObj)
                    return r = e.handleObj,
                    ae(e.delegateTarget).off(r.namespace ? r.origType + "." + r.namespace : r.origType, r.selector, r.handler),
                    this;
                if ("object" == typeof e) {
                    for (o in e)
                        this.off(o, t, e[o]);
                    return this
                }
                return !1 !== t && "function" != typeof t || (n = t,
                t = void 0),
                !1 === n && (n = x),
                this.each(function() {
                    ae.event.remove(this, e, n, t)
                })
            }
        });
        var Ge = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi
          , Xe = /<script|<style|<link/i
          , Ve = /checked\s*(?:[^=]|=\s*.checked.)/i
          , Ye = /^true\/(.*)/
          , Qe = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
        ae.extend({
            htmlPrefilter: function(e) {
                return e.replace(Ge, "<$1></$2>")
            },
            clone: function(e, t, n) {
                var r, o, i, s, a = e.cloneNode(!0), u = ae.contains(e.ownerDocument, e);
                if (!(se.noCloneChecked || 1 !== e.nodeType && 11 !== e.nodeType || ae.isXMLDoc(e)))
                    for (s = m(a),
                    r = 0,
                    o = (i = m(e)).length; r < o; r++)
                        S(i[r], s[r]);
                if (t)
                    if (n)
                        for (i = i || m(e),
                        s = s || m(a),
                        r = 0,
                        o = i.length; r < o; r++)
                            N(i[r], s[r]);
                    else
                        N(e, a);
                return (s = m(a, "script")).length > 0 && y(s, !u && m(e, "script")),
                a
            },
            cleanData: function(e) {
                for (var t, n, r, o = ae.event.special, i = 0; void 0 !== (n = e[i]); i++)
                    if (Ne(n)) {
                        if (t = n[Se.expando]) {
                            if (t.events)
                                for (r in t.events)
                                    o[r] ? ae.event.remove(n, r) : ae.removeEvent(n, r, t.handle);
                            n[Se.expando] = void 0
                        }
                        n[Ae.expando] && (n[Ae.expando] = void 0)
                    }
            }
        }),
        ae.fn.extend({
            detach: function(e) {
                return j(this, e, !0)
            },
            remove: function(e) {
                return j(this, e)
            },
            text: function(e) {
                return Ce(this, function(e) {
                    return void 0 === e ? ae.text(this) : this.empty().each(function() {
                        1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || (this.textContent = e)
                    })
                }, null, e, arguments.length)
            },
            append: function() {
                return A(this, arguments, function(e) {
                    1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || k(this, e).appendChild(e)
                })
            },
            prepend: function() {
                return A(this, arguments, function(e) {
                    if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                        var t = k(this, e);
                        t.insertBefore(e, t.firstChild)
                    }
                })
            },
            before: function() {
                return A(this, arguments, function(e) {
                    this.parentNode && this.parentNode.insertBefore(e, this)
                })
            },
            after: function() {
                return A(this, arguments, function(e) {
                    this.parentNode && this.parentNode.insertBefore(e, this.nextSibling)
                })
            },
            empty: function() {
                for (var e, t = 0; null != (e = this[t]); t++)
                    1 === e.nodeType && (ae.cleanData(m(e, !1)),
                    e.textContent = "");
                return this
            },
            clone: function(e, t) {
                return e = null != e && e,
                t = null == t ? e : t,
                this.map(function() {
                    return ae.clone(this, e, t)
                })
            },
            html: function(e) {
                return Ce(this, function(e) {
                    var t = this[0] || {}
                      , n = 0
                      , r = this.length;
                    if (void 0 === e && 1 === t.nodeType)
                        return t.innerHTML;
                    if ("string" == typeof e && !Xe.test(e) && !Be[(He.exec(e) || ["", ""])[1].toLowerCase()]) {
                        e = ae.htmlPrefilter(e);
                        try {
                            for (; n < r; n++)
                                1 === (t = this[n] || {}).nodeType && (ae.cleanData(m(t, !1)),
                                t.innerHTML = e);
                            t = 0
                        } catch (e) {}
                    }
                    t && this.empty().append(e)
                }, null, e, arguments.length)
            },
            replaceWith: function() {
                var e = [];
                return A(this, arguments, function(t) {
                    var n = this.parentNode;
                    ae.inArray(this, e) < 0 && (ae.cleanData(m(this)),
                    n && n.replaceChild(t, this))
                }, e)
            }
        }),
        ae.each({
            appendTo: "append",
            prependTo: "prepend",
            insertBefore: "before",
            insertAfter: "after",
            replaceAll: "replaceWith"
        }, function(e, t) {
            ae.fn[e] = function(e) {
                for (var n, r = [], o = ae(e), i = o.length - 1, s = 0; s <= i; s++)
                    n = s === i ? this : this.clone(!0),
                    ae(o[s])[t](n),
                    Z.apply(r, n.get());
                return this.pushStack(r)
            }
        });
        var Ke = /^margin/
          , Je = new RegExp("^(" + De + ")(?!px)[a-z%]+$","i")
          , Ze = function(t) {
            var n = t.ownerDocument.defaultView;
            return n && n.opener || (n = e),
            n.getComputedStyle(t)
        };
        !function() {
            function t() {
                if (a) {
                    a.style.cssText = "box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%",
                    a.innerHTML = "",
                    Ue.appendChild(s);
                    var t = e.getComputedStyle(a);
                    n = "1%" !== t.top,
                    i = "2px" === t.marginLeft,
                    r = "4px" === t.width,
                    a.style.marginRight = "50%",
                    o = "4px" === t.marginRight,
                    Ue.removeChild(s),
                    a = null
                }
            }
            var n, r, o, i, s = Y.createElement("div"), a = Y.createElement("div");
            a.style && (a.style.backgroundClip = "content-box",
            a.cloneNode(!0).style.backgroundClip = "",
            se.clearCloneStyle = "content-box" === a.style.backgroundClip,
            s.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute",
            s.appendChild(a),
            ae.extend(se, {
                pixelPosition: function() {
                    return t(),
                    n
                },
                boxSizingReliable: function() {
                    return t(),
                    r
                },
                pixelMarginRight: function() {
                    return t(),
                    o
                },
                reliableMarginLeft: function() {
                    return t(),
                    i
                }
            }))
        }();
        var et = /^(none|table(?!-c[ea]).+)/
          , tt = /^--/
          , nt = {
            position: "absolute",
            visibility: "hidden",
            display: "block"
        }
          , rt = {
            letterSpacing: "0",
            fontWeight: "400"
        }
          , ot = ["Webkit", "Moz", "ms"]
          , it = Y.createElement("div").style;
        ae.extend({
            cssHooks: {
                opacity: {
                    get: function(e, t) {
                        if (t) {
                            var n = _(e, "opacity");
                            return "" === n ? "1" : n
                        }
                    }
                }
            },
            cssNumber: {
                animationIterationCount: !0,
                columnCount: !0,
                fillOpacity: !0,
                flexGrow: !0,
                flexShrink: !0,
                fontWeight: !0,
                lineHeight: !0,
                opacity: !0,
                order: !0,
                orphans: !0,
                widows: !0,
                zIndex: !0,
                zoom: !0
            },
            cssProps: {
                float: "cssFloat"
            },
            style: function(e, t, n, r) {
                if (e && 3 !== e.nodeType && 8 !== e.nodeType && e.style) {
                    var o, i, s, a = ae.camelCase(t), u = tt.test(t), c = e.style;
                    if (u || (t = P(a)),
                    s = ae.cssHooks[t] || ae.cssHooks[a],
                    void 0 === n)
                        return s && "get"in s && void 0 !== (o = s.get(e, !1, r)) ? o : c[t];
                    "string" === (i = typeof n) && (o = Pe.exec(n)) && o[1] && (n = p(e, t, o),
                    i = "number"),
                    null != n && n == n && ("number" === i && (n += o && o[3] || (ae.cssNumber[a] ? "" : "px")),
                    se.clearCloneStyle || "" !== n || 0 !== t.indexOf("background") || (c[t] = "inherit"),
                    s && "set"in s && void 0 === (n = s.set(e, n, r)) || (u ? c.setProperty(t, n) : c[t] = n))
                }
            },
            css: function(e, t, n, r) {
                var o, i, s, a = ae.camelCase(t);
                return tt.test(t) || (t = P(a)),
                (s = ae.cssHooks[t] || ae.cssHooks[a]) && "get"in s && (o = s.get(e, !0, n)),
                void 0 === o && (o = _(e, t, r)),
                "normal" === o && t in rt && (o = rt[t]),
                "" === n || n ? (i = parseFloat(o),
                !0 === n || isFinite(i) ? i || 0 : o) : o
            }
        }),
        ae.each(["height", "width"], function(e, t) {
            ae.cssHooks[t] = {
                get: function(e, n, r) {
                    if (n)
                        return !et.test(ae.css(e, "display")) || e.getClientRects().length && e.getBoundingClientRect().width ? L(e, t, r) : Le(e, nt, function() {
                            return L(e, t, r)
                        })
                },
                set: function(e, n, r) {
                    var o, i = r && Ze(e), s = r && q(e, t, r, "border-box" === ae.css(e, "boxSizing", !1, i), i);
                    return s && (o = Pe.exec(n)) && "px" !== (o[3] || "px") && (e.style[t] = n,
                    n = ae.css(e, t)),
                    O(0, n, s)
                }
            }
        }),
        ae.cssHooks.marginLeft = D(se.reliableMarginLeft, function(e, t) {
            if (t)
                return (parseFloat(_(e, "marginLeft")) || e.getBoundingClientRect().left - Le(e, {
                    marginLeft: 0
                }, function() {
                    return e.getBoundingClientRect().left
                })) + "px"
        }),
        ae.each({
            margin: "",
            padding: "",
            border: "Width"
        }, function(e, t) {
            ae.cssHooks[e + t] = {
                expand: function(n) {
                    for (var r = 0, o = {}, i = "string" == typeof n ? n.split(" ") : [n]; r < 4; r++)
                        o[e + Oe[r] + t] = i[r] || i[r - 2] || i[0];
                    return o
                }
            },
            Ke.test(e) || (ae.cssHooks[e + t].set = O)
        }),
        ae.fn.extend({
            css: function(e, t) {
                return Ce(this, function(e, t, n) {
                    var r, o, i = {}, s = 0;
                    if (Array.isArray(t)) {
                        for (r = Ze(e),
                        o = t.length; s < o; s++)
                            i[t[s]] = ae.css(e, t[s], !1, r);
                        return i
                    }
                    return void 0 !== n ? ae.style(e, t, n) : ae.css(e, t)
                }, e, t, arguments.length > 1)
            }
        }),
        ae.Tween = R,
        R.prototype = {
            constructor: R,
            init: function(e, t, n, r, o, i) {
                this.elem = e,
                this.prop = n,
                this.easing = o || ae.easing._default,
                this.options = t,
                this.start = this.now = this.cur(),
                this.end = r,
                this.unit = i || (ae.cssNumber[n] ? "" : "px")
            },
            cur: function() {
                var e = R.propHooks[this.prop];
                return e && e.get ? e.get(this) : R.propHooks._default.get(this)
            },
            run: function(e) {
                var t, n = R.propHooks[this.prop];
                return this.options.duration ? this.pos = t = ae.easing[this.easing](e, this.options.duration * e, 0, 1, this.options.duration) : this.pos = t = e,
                this.now = (this.end - this.start) * t + this.start,
                this.options.step && this.options.step.call(this.elem, this.now, this),
                n && n.set ? n.set(this) : R.propHooks._default.set(this),
                this
            }
        },
        R.prototype.init.prototype = R.prototype,
        R.propHooks = {
            _default: {
                get: function(e) {
                    var t;
                    return 1 !== e.elem.nodeType || null != e.elem[e.prop] && null == e.elem.style[e.prop] ? e.elem[e.prop] : (t = ae.css(e.elem, e.prop, "")) && "auto" !== t ? t : 0
                },
                set: function(e) {
                    ae.fx.step[e.prop] ? ae.fx.step[e.prop](e) : 1 !== e.elem.nodeType || null == e.elem.style[ae.cssProps[e.prop]] && !ae.cssHooks[e.prop] ? e.elem[e.prop] = e.now : ae.style(e.elem, e.prop, e.now + e.unit)
                }
            }
        },
        R.propHooks.scrollTop = R.propHooks.scrollLeft = {
            set: function(e) {
                e.elem.nodeType && e.elem.parentNode && (e.elem[e.prop] = e.now)
            }
        },
        ae.easing = {
            linear: function(e) {
                return e
            },
            swing: function(e) {
                return .5 - Math.cos(e * Math.PI) / 2
            },
            _default: "swing"
        },
        ae.fx = R.prototype.init,
        ae.fx.step = {};
        var st, at, ut = /^(?:toggle|show|hide)$/, ct = /queueHooks$/;
        ae.Animation = ae.extend(M, {
            tweeners: {
                "*": [function(e, t) {
                    var n = this.createTween(e, t);
                    return p(n.elem, e, Pe.exec(t), n),
                    n
                }
                ]
            },
            tweener: function(e, t) {
                ae.isFunction(e) ? (t = e,
                e = ["*"]) : e = e.match(Te);
                for (var n, r = 0, o = e.length; r < o; r++)
                    n = e[r],
                    M.tweeners[n] = M.tweeners[n] || [],
                    M.tweeners[n].unshift(t)
            },
            prefilters: [function(e, t, n) {
                var r, o, i, s, a, u, c, l, d = "width"in t || "height"in t, f = this, p = {}, h = e.style, m = e.nodeType && qe(e), y = Se.get(e, "fxshow");
                for (r in n.queue || (null == (s = ae._queueHooks(e, "fx")).unqueued && (s.unqueued = 0,
                a = s.empty.fire,
                s.empty.fire = function() {
                    s.unqueued || a()
                }
                ),
                s.unqueued++,
                f.always(function() {
                    f.always(function() {
                        s.unqueued--,
                        ae.queue(e, "fx").length || s.empty.fire()
                    })
                })),
                t)
                    if (o = t[r],
                    ut.test(o)) {
                        if (delete t[r],
                        i = i || "toggle" === o,
                        o === (m ? "hide" : "show")) {
                            if ("show" !== o || !y || void 0 === y[r])
                                continue;
                            m = !0
                        }
                        p[r] = y && y[r] || ae.style(e, r)
                    }
                if ((u = !ae.isEmptyObject(t)) || !ae.isEmptyObject(p))
                    for (r in d && 1 === e.nodeType && (n.overflow = [h.overflow, h.overflowX, h.overflowY],
                    null == (c = y && y.display) && (c = Se.get(e, "display")),
                    "none" === (l = ae.css(e, "display")) && (c ? l = c : (v([e], !0),
                    c = e.style.display || c,
                    l = ae.css(e, "display"),
                    v([e]))),
                    ("inline" === l || "inline-block" === l && null != c) && "none" === ae.css(e, "float") && (u || (f.done(function() {
                        h.display = c
                    }),
                    null == c && (l = h.display,
                    c = "none" === l ? "" : l)),
                    h.display = "inline-block")),
                    n.overflow && (h.overflow = "hidden",
                    f.always(function() {
                        h.overflow = n.overflow[0],
                        h.overflowX = n.overflow[1],
                        h.overflowY = n.overflow[2]
                    })),
                    u = !1,
                    p)
                        u || (y ? "hidden"in y && (m = y.hidden) : y = Se.access(e, "fxshow", {
                            display: c
                        }),
                        i && (y.hidden = !m),
                        m && v([e], !0),
                        f.done(function() {
                            for (r in m || v([e]),
                            Se.remove(e, "fxshow"),
                            p)
                                ae.style(e, r, p[r])
                        })),
                        u = B(m ? y[r] : 0, r, f),
                        r in y || (y[r] = u.start,
                        m && (u.end = u.start,
                        u.start = 0))
            }
            ],
            prefilter: function(e, t) {
                t ? M.prefilters.unshift(e) : M.prefilters.push(e)
            }
        }),
        ae.speed = function(e, t, n) {
            var r = e && "object" == typeof e ? ae.extend({}, e) : {
                complete: n || !n && t || ae.isFunction(e) && e,
                duration: e,
                easing: n && t || t && !ae.isFunction(t) && t
            };
            return ae.fx.off ? r.duration = 0 : "number" != typeof r.duration && (r.duration in ae.fx.speeds ? r.duration = ae.fx.speeds[r.duration] : r.duration = ae.fx.speeds._default),
            null != r.queue && !0 !== r.queue || (r.queue = "fx"),
            r.old = r.complete,
            r.complete = function() {
                ae.isFunction(r.old) && r.old.call(this),
                r.queue && ae.dequeue(this, r.queue)
            }
            ,
            r
        }
        ,
        ae.fn.extend({
            fadeTo: function(e, t, n, r) {
                return this.filter(qe).css("opacity", 0).show().end().animate({
                    opacity: t
                }, e, n, r)
            },
            animate: function(e, t, n, r) {
                var o = ae.isEmptyObject(e)
                  , i = ae.speed(t, n, r)
                  , s = function() {
                    var t = M(this, ae.extend({}, e), i);
                    (o || Se.get(this, "finish")) && t.stop(!0)
                };
                return s.finish = s,
                o || !1 === i.queue ? this.each(s) : this.queue(i.queue, s)
            },
            stop: function(e, t, n) {
                var r = function(e) {
                    var t = e.stop;
                    delete e.stop,
                    t(n)
                };
                return "string" != typeof e && (n = t,
                t = e,
                e = void 0),
                t && !1 !== e && this.queue(e || "fx", []),
                this.each(function() {
                    var t = !0
                      , o = null != e && e + "queueHooks"
                      , i = ae.timers
                      , s = Se.get(this);
                    if (o)
                        s[o] && s[o].stop && r(s[o]);
                    else
                        for (o in s)
                            s[o] && s[o].stop && ct.test(o) && r(s[o]);
                    for (o = i.length; o--; )
                        i[o].elem !== this || null != e && i[o].queue !== e || (i[o].anim.stop(n),
                        t = !1,
                        i.splice(o, 1));
                    !t && n || ae.dequeue(this, e)
                })
            },
            finish: function(e) {
                return !1 !== e && (e = e || "fx"),
                this.each(function() {
                    var t, n = Se.get(this), r = n[e + "queue"], o = n[e + "queueHooks"], i = ae.timers, s = r ? r.length : 0;
                    for (n.finish = !0,
                    ae.queue(this, e, []),
                    o && o.stop && o.stop.call(this, !0),
                    t = i.length; t--; )
                        i[t].elem === this && i[t].queue === e && (i[t].anim.stop(!0),
                        i.splice(t, 1));
                    for (t = 0; t < s; t++)
                        r[t] && r[t].finish && r[t].finish.call(this);
                    delete n.finish
                })
            }
        }),
        ae.each(["toggle", "show", "hide"], function(e, t) {
            var n = ae.fn[t];
            ae.fn[t] = function(e, r, o) {
                return null == e || "boolean" == typeof e ? n.apply(this, arguments) : this.animate(I(t, !0), e, r, o)
            }
        }),
        ae.each({
            slideDown: I("show"),
            slideUp: I("hide"),
            slideToggle: I("toggle"),
            fadeIn: {
                opacity: "show"
            },
            fadeOut: {
                opacity: "hide"
            },
            fadeToggle: {
                opacity: "toggle"
            }
        }, function(e, t) {
            ae.fn[e] = function(e, n, r) {
                return this.animate(t, e, n, r)
            }
        }),
        ae.timers = [],
        ae.fx.tick = function() {
            var e, t = 0, n = ae.timers;
            for (st = ae.now(); t < n.length; t++)
                (e = n[t])() || n[t] !== e || n.splice(t--, 1);
            n.length || ae.fx.stop(),
            st = void 0
        }
        ,
        ae.fx.timer = function(e) {
            ae.timers.push(e),
            ae.fx.start()
        }
        ,
        ae.fx.interval = 13,
        ae.fx.start = function() {
            at || (at = !0,
            F())
        }
        ,
        ae.fx.stop = function() {
            at = null
        }
        ,
        ae.fx.speeds = {
            slow: 600,
            fast: 200,
            _default: 400
        },
        ae.fn.delay = function(t, n) {
            return t = ae.fx && ae.fx.speeds[t] || t,
            n = n || "fx",
            this.queue(n, function(n, r) {
                var o = e.setTimeout(n, t);
                r.stop = function() {
                    e.clearTimeout(o)
                }
            })
        }
        ,
        function() {
            var e = Y.createElement("input")
              , t = Y.createElement("select").appendChild(Y.createElement("option"));
            e.type = "checkbox",
            se.checkOn = "" !== e.value,
            se.optSelected = t.selected,
            (e = Y.createElement("input")).value = "t",
            e.type = "radio",
            se.radioValue = "t" === e.value
        }();
        var lt, dt = ae.expr.attrHandle;
        ae.fn.extend({
            attr: function(e, t) {
                return Ce(this, ae.attr, e, t, arguments.length > 1)
            },
            removeAttr: function(e) {
                return this.each(function() {
                    ae.removeAttr(this, e)
                })
            }
        }),
        ae.extend({
            attr: function(e, t, n) {
                var r, o, i = e.nodeType;
                if (3 !== i && 8 !== i && 2 !== i)
                    return void 0 === e.getAttribute ? ae.prop(e, t, n) : (1 === i && ae.isXMLDoc(e) || (o = ae.attrHooks[t.toLowerCase()] || (ae.expr.match.bool.test(t) ? lt : void 0)),
                    void 0 !== n ? null === n ? void ae.removeAttr(e, t) : o && "set"in o && void 0 !== (r = o.set(e, n, t)) ? r : (e.setAttribute(t, n + ""),
                    n) : o && "get"in o && null !== (r = o.get(e, t)) ? r : null == (r = ae.find.attr(e, t)) ? void 0 : r)
            },
            attrHooks: {
                type: {
                    set: function(e, t) {
                        if (!se.radioValue && "radio" === t && o(e, "input")) {
                            var n = e.value;
                            return e.setAttribute("type", t),
                            n && (e.value = n),
                            t
                        }
                    }
                }
            },
            removeAttr: function(e, t) {
                var n, r = 0, o = t && t.match(Te);
                if (o && 1 === e.nodeType)
                    for (; n = o[r++]; )
                        e.removeAttribute(n)
            }
        }),
        lt = {
            set: function(e, t, n) {
                return !1 === t ? ae.removeAttr(e, n) : e.setAttribute(n, n),
                n
            }
        },
        ae.each(ae.expr.match.bool.source.match(/\w+/g), function(e, t) {
            var n = dt[t] || ae.find.attr;
            dt[t] = function(e, t, r) {
                var o, i, s = t.toLowerCase();
                return r || (i = dt[s],
                dt[s] = o,
                o = null != n(e, t, r) ? s : null,
                dt[s] = i),
                o
            }
        });
        var ft = /^(?:input|select|textarea|button)$/i
          , pt = /^(?:a|area)$/i;
        ae.fn.extend({
            prop: function(e, t) {
                return Ce(this, ae.prop, e, t, arguments.length > 1)
            },
            removeProp: function(e) {
                return this.each(function() {
                    delete this[ae.propFix[e] || e]
                })
            }
        }),
        ae.extend({
            prop: function(e, t, n) {
                var r, o, i = e.nodeType;
                if (3 !== i && 8 !== i && 2 !== i)
                    return 1 === i && ae.isXMLDoc(e) || (t = ae.propFix[t] || t,
                    o = ae.propHooks[t]),
                    void 0 !== n ? o && "set"in o && void 0 !== (r = o.set(e, n, t)) ? r : e[t] = n : o && "get"in o && null !== (r = o.get(e, t)) ? r : e[t]
            },
            propHooks: {
                tabIndex: {
                    get: function(e) {
                        var t = ae.find.attr(e, "tabindex");
                        return t ? parseInt(t, 10) : ft.test(e.nodeName) || pt.test(e.nodeName) && e.href ? 0 : -1
                    }
                }
            },
            propFix: {
                for: "htmlFor",
                class: "className"
            }
        }),
        se.optSelected || (ae.propHooks.selected = {
            get: function(e) {
                var t = e.parentNode;
                return t && t.parentNode && t.parentNode.selectedIndex,
                null
            },
            set: function(e) {
                var t = e.parentNode;
                t && (t.selectedIndex,
                t.parentNode && t.parentNode.selectedIndex)
            }
        }),
        ae.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function() {
            ae.propFix[this.toLowerCase()] = this
        }),
        ae.fn.extend({
            addClass: function(e) {
                var t, n, r, o, i, s, a, u = 0;
                if (ae.isFunction(e))
                    return this.each(function(t) {
                        ae(this).addClass(e.call(this, t, W(this)))
                    });
                if ("string" == typeof e && e)
                    for (t = e.match(Te) || []; n = this[u++]; )
                        if (o = W(n),
                        r = 1 === n.nodeType && " " + U(o) + " ") {
                            for (s = 0; i = t[s++]; )
                                r.indexOf(" " + i + " ") < 0 && (r += i + " ");
                            o !== (a = U(r)) && n.setAttribute("class", a)
                        }
                return this
            },
            removeClass: function(e) {
                var t, n, r, o, i, s, a, u = 0;
                if (ae.isFunction(e))
                    return this.each(function(t) {
                        ae(this).removeClass(e.call(this, t, W(this)))
                    });
                if (!arguments.length)
                    return this.attr("class", "");
                if ("string" == typeof e && e)
                    for (t = e.match(Te) || []; n = this[u++]; )
                        if (o = W(n),
                        r = 1 === n.nodeType && " " + U(o) + " ") {
                            for (s = 0; i = t[s++]; )
                                for (; r.indexOf(" " + i + " ") > -1; )
                                    r = r.replace(" " + i + " ", " ");
                            o !== (a = U(r)) && n.setAttribute("class", a)
                        }
                return this
            },
            toggleClass: function(e, t) {
                var n = typeof e;
                return "boolean" == typeof t && "string" === n ? t ? this.addClass(e) : this.removeClass(e) : ae.isFunction(e) ? this.each(function(n) {
                    ae(this).toggleClass(e.call(this, n, W(this), t), t)
                }) : this.each(function() {
                    var t, r, o, i;
                    if ("string" === n)
                        for (r = 0,
                        o = ae(this),
                        i = e.match(Te) || []; t = i[r++]; )
                            o.hasClass(t) ? o.removeClass(t) : o.addClass(t);
                    else
                        void 0 !== e && "boolean" !== n || ((t = W(this)) && Se.set(this, "__className__", t),
                        this.setAttribute && this.setAttribute("class", t || !1 === e ? "" : Se.get(this, "__className__") || ""))
                })
            },
            hasClass: function(e) {
                var t, n, r = 0;
                for (t = " " + e + " "; n = this[r++]; )
                    if (1 === n.nodeType && (" " + U(W(n)) + " ").indexOf(t) > -1)
                        return !0;
                return !1
            }
        });
        var ht = /\r/g;
        ae.fn.extend({
            val: function(e) {
                var t, n, r, o = this[0];
                return arguments.length ? (r = ae.isFunction(e),
                this.each(function(n) {
                    var o;
                    1 === this.nodeType && (null == (o = r ? e.call(this, n, ae(this).val()) : e) ? o = "" : "number" == typeof o ? o += "" : Array.isArray(o) && (o = ae.map(o, function(e) {
                        return null == e ? "" : e + ""
                    })),
                    (t = ae.valHooks[this.type] || ae.valHooks[this.nodeName.toLowerCase()]) && "set"in t && void 0 !== t.set(this, o, "value") || (this.value = o))
                })) : o ? (t = ae.valHooks[o.type] || ae.valHooks[o.nodeName.toLowerCase()]) && "get"in t && void 0 !== (n = t.get(o, "value")) ? n : "string" == typeof (n = o.value) ? n.replace(ht, "") : null == n ? "" : n : void 0
            }
        }),
        ae.extend({
            valHooks: {
                option: {
                    get: function(e) {
                        var t = ae.find.attr(e, "value");
                        return null != t ? t : U(ae.text(e))
                    }
                },
                select: {
                    get: function(e) {
                        var t, n, r, i = e.options, s = e.selectedIndex, a = "select-one" === e.type, u = a ? null : [], c = a ? s + 1 : i.length;
                        for (r = s < 0 ? c : a ? s : 0; r < c; r++)
                            if (((n = i[r]).selected || r === s) && !n.disabled && (!n.parentNode.disabled || !o(n.parentNode, "optgroup"))) {
                                if (t = ae(n).val(),
                                a)
                                    return t;
                                u.push(t)
                            }
                        return u
                    },
                    set: function(e, t) {
                        for (var n, r, o = e.options, i = ae.makeArray(t), s = o.length; s--; )
                            ((r = o[s]).selected = ae.inArray(ae.valHooks.option.get(r), i) > -1) && (n = !0);
                        return n || (e.selectedIndex = -1),
                        i
                    }
                }
            }
        }),
        ae.each(["radio", "checkbox"], function() {
            ae.valHooks[this] = {
                set: function(e, t) {
                    if (Array.isArray(t))
                        return e.checked = ae.inArray(ae(e).val(), t) > -1
                }
            },
            se.checkOn || (ae.valHooks[this].get = function(e) {
                return null === e.getAttribute("value") ? "on" : e.value
            }
            )
        });
        var vt = /^(?:focusinfocus|focusoutblur)$/;
        ae.extend(ae.event, {
            trigger: function(t, n, r, o) {
                var i, s, a, u, c, l, d, f = [r || Y], p = re.call(t, "type") ? t.type : t, h = re.call(t, "namespace") ? t.namespace.split(".") : [];
                if (s = a = r = r || Y,
                3 !== r.nodeType && 8 !== r.nodeType && !vt.test(p + ae.event.triggered) && (p.indexOf(".") > -1 && (h = p.split("."),
                p = h.shift(),
                h.sort()),
                c = p.indexOf(":") < 0 && "on" + p,
                (t = t[ae.expando] ? t : new ae.Event(p,"object" == typeof t && t)).isTrigger = o ? 2 : 3,
                t.namespace = h.join("."),
                t.rnamespace = t.namespace ? new RegExp("(^|\\.)" + h.join("\\.(?:.*\\.|)") + "(\\.|$)") : null,
                t.result = void 0,
                t.target || (t.target = r),
                n = null == n ? [t] : ae.makeArray(n, [t]),
                d = ae.event.special[p] || {},
                o || !d.trigger || !1 !== d.trigger.apply(r, n))) {
                    if (!o && !d.noBubble && !ae.isWindow(r)) {
                        for (u = d.delegateType || p,
                        vt.test(u + p) || (s = s.parentNode); s; s = s.parentNode)
                            f.push(s),
                            a = s;
                        a === (r.ownerDocument || Y) && f.push(a.defaultView || a.parentWindow || e)
                    }
                    for (i = 0; (s = f[i++]) && !t.isPropagationStopped(); )
                        t.type = i > 1 ? u : d.bindType || p,
                        (l = (Se.get(s, "events") || {})[t.type] && Se.get(s, "handle")) && l.apply(s, n),
                        (l = c && s[c]) && l.apply && Ne(s) && (t.result = l.apply(s, n),
                        !1 === t.result && t.preventDefault());
                    return t.type = p,
                    o || t.isDefaultPrevented() || d._default && !1 !== d._default.apply(f.pop(), n) || !Ne(r) || c && ae.isFunction(r[p]) && !ae.isWindow(r) && ((a = r[c]) && (r[c] = null),
                    ae.event.triggered = p,
                    r[p](),
                    ae.event.triggered = void 0,
                    a && (r[c] = a)),
                    t.result
                }
            },
            simulate: function(e, t, n) {
                var r = ae.extend(new ae.Event, n, {
                    type: e,
                    isSimulated: !0
                });
                ae.event.trigger(r, null, t)
            }
        }),
        ae.fn.extend({
            trigger: function(e, t) {
                return this.each(function() {
                    ae.event.trigger(e, t, this)
                })
            },
            triggerHandler: function(e, t) {
                var n = this[0];
                if (n)
                    return ae.event.trigger(e, t, n, !0)
            }
        }),
        ae.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "), function(e, t) {
            ae.fn[t] = function(e, n) {
                return arguments.length > 0 ? this.on(t, null, e, n) : this.trigger(t)
            }
        }),
        ae.fn.extend({
            hover: function(e, t) {
                return this.mouseenter(e).mouseleave(t || e)
            }
        }),
        se.focusin = "onfocusin"in e,
        se.focusin || ae.each({
            focus: "focusin",
            blur: "focusout"
        }, function(e, t) {
            var n = function(e) {
                ae.event.simulate(t, e.target, ae.event.fix(e))
            };
            ae.event.special[t] = {
                setup: function() {
                    var r = this.ownerDocument || this
                      , o = Se.access(r, t);
                    o || r.addEventListener(e, n, !0),
                    Se.access(r, t, (o || 0) + 1)
                },
                teardown: function() {
                    var r = this.ownerDocument || this
                      , o = Se.access(r, t) - 1;
                    o ? Se.access(r, t, o) : (r.removeEventListener(e, n, !0),
                    Se.remove(r, t))
                }
            }
        });
        var mt = e.location
          , yt = ae.now()
          , gt = /\?/;
        ae.parseXML = function(t) {
            var n;
            if (!t || "string" != typeof t)
                return null;
            try {
                n = (new e.DOMParser).parseFromString(t, "text/xml")
            } catch (e) {
                n = void 0
            }
            return n && !n.getElementsByTagName("parsererror").length || ae.error("Invalid XML: " + t),
            n
        }
        ;
        var bt = /\[\]$/
          , xt = /\r?\n/g
          , wt = /^(?:submit|button|image|reset|file)$/i
          , Tt = /^(?:input|select|textarea|keygen)/i;
        ae.param = function(e, t) {
            var n, r = [], o = function(e, t) {
                var n = ae.isFunction(t) ? t() : t;
                r[r.length] = encodeURIComponent(e) + "=" + encodeURIComponent(null == n ? "" : n)
            };
            if (Array.isArray(e) || e.jquery && !ae.isPlainObject(e))
                ae.each(e, function() {
                    o(this.name, this.value)
                });
            else
                for (n in e)
                    $(n, e[n], t, o);
            return r.join("&")
        }
        ,
        ae.fn.extend({
            serialize: function() {
                return ae.param(this.serializeArray())
            },
            serializeArray: function() {
                return this.map(function() {
                    var e = ae.prop(this, "elements");
                    return e ? ae.makeArray(e) : this
                }).filter(function() {
                    var e = this.type;
                    return this.name && !ae(this).is(":disabled") && Tt.test(this.nodeName) && !wt.test(e) && (this.checked || !Fe.test(e))
                }).map(function(e, t) {
                    var n = ae(this).val();
                    return null == n ? null : Array.isArray(n) ? ae.map(n, function(e) {
                        return {
                            name: t.name,
                            value: e.replace(xt, "\r\n")
                        }
                    }) : {
                        name: t.name,
                        value: n.replace(xt, "\r\n")
                    }
                }).get()
            }
        });
        var kt = /%20/g
          , Et = /#.*$/
          , Ct = /([?&])_=[^&]*/
          , Nt = /^(.*?):[ \t]*([^\r\n]*)$/gm
          , St = /^(?:GET|HEAD)$/
          , At = /^\/\//
          , jt = {}
          , _t = {}
          , Dt = "*/".concat("*")
          , Pt = Y.createElement("a");
        Pt.href = mt.href,
        ae.extend({
            active: 0,
            lastModified: {},
            etag: {},
            ajaxSettings: {
                url: mt.href,
                type: "GET",
                isLocal: /^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(mt.protocol),
                global: !0,
                processData: !0,
                async: !0,
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                accepts: {
                    "*": Dt,
                    text: "text/plain",
                    html: "text/html",
                    xml: "application/xml, text/xml",
                    json: "application/json, text/javascript"
                },
                contents: {
                    xml: /\bxml\b/,
                    html: /\bhtml/,
                    json: /\bjson\b/
                },
                responseFields: {
                    xml: "responseXML",
                    text: "responseText",
                    json: "responseJSON"
                },
                converters: {
                    "* text": String,
                    "text html": !0,
                    "text json": JSON.parse,
                    "text xml": ae.parseXML
                },
                flatOptions: {
                    url: !0,
                    context: !0
                }
            },
            ajaxSetup: function(e, t) {
                return t ? X(X(e, ae.ajaxSettings), t) : X(ae.ajaxSettings, e)
            },
            ajaxPrefilter: z(jt),
            ajaxTransport: z(_t),
            ajax: function(t, n) {
                function r(t, n, r, a) {
                    var c, f, p, x, w, T = n;
                    l || (l = !0,
                    u && e.clearTimeout(u),
                    o = void 0,
                    s = a || "",
                    k.readyState = t > 0 ? 4 : 0,
                    c = t >= 200 && t < 300 || 304 === t,
                    r && (x = function(e, t, n) {
                        for (var r, o, i, s, a = e.contents, u = e.dataTypes; "*" === u[0]; )
                            u.shift(),
                            void 0 === r && (r = e.mimeType || t.getResponseHeader("Content-Type"));
                        if (r)
                            for (o in a)
                                if (a[o] && a[o].test(r)) {
                                    u.unshift(o);
                                    break
                                }
                        if (u[0]in n)
                            i = u[0];
                        else {
                            for (o in n) {
                                if (!u[0] || e.converters[o + " " + u[0]]) {
                                    i = o;
                                    break
                                }
                                s || (s = o)
                            }
                            i = i || s
                        }
                        if (i)
                            return i !== u[0] && u.unshift(i),
                            n[i]
                    }(h, k, r)),
                    x = function(e, t, n, r) {
                        var o, i, s, a, u, c = {}, l = e.dataTypes.slice();
                        if (l[1])
                            for (s in e.converters)
                                c[s.toLowerCase()] = e.converters[s];
                        for (i = l.shift(); i; )
                            if (e.responseFields[i] && (n[e.responseFields[i]] = t),
                            !u && r && e.dataFilter && (t = e.dataFilter(t, e.dataType)),
                            u = i,
                            i = l.shift())
                                if ("*" === i)
                                    i = u;
                                else if ("*" !== u && u !== i) {
                                    if (!(s = c[u + " " + i] || c["* " + i]))
                                        for (o in c)
                                            if ((a = o.split(" "))[1] === i && (s = c[u + " " + a[0]] || c["* " + a[0]])) {
                                                !0 === s ? s = c[o] : !0 !== c[o] && (i = a[0],
                                                l.unshift(a[1]));
                                                break
                                            }
                                    if (!0 !== s)
                                        if (s && e.throws)
                                            t = s(t);
                                        else
                                            try {
                                                t = s(t)
                                            } catch (e) {
                                                return {
                                                    state: "parsererror",
                                                    error: s ? e : "No conversion from " + u + " to " + i
                                                }
                                            }
                                }
                        return {
                            state: "success",
                            data: t
                        }
                    }(h, x, k, c),
                    c ? (h.ifModified && ((w = k.getResponseHeader("Last-Modified")) && (ae.lastModified[i] = w),
                    (w = k.getResponseHeader("etag")) && (ae.etag[i] = w)),
                    204 === t || "HEAD" === h.type ? T = "nocontent" : 304 === t ? T = "notmodified" : (T = x.state,
                    f = x.data,
                    c = !(p = x.error))) : (p = T,
                    !t && T || (T = "error",
                    t < 0 && (t = 0))),
                    k.status = t,
                    k.statusText = (n || T) + "",
                    c ? y.resolveWith(v, [f, T, k]) : y.rejectWith(v, [k, T, p]),
                    k.statusCode(b),
                    b = void 0,
                    d && m.trigger(c ? "ajaxSuccess" : "ajaxError", [k, h, c ? f : p]),
                    g.fireWith(v, [k, T]),
                    d && (m.trigger("ajaxComplete", [k, h]),
                    --ae.active || ae.event.trigger("ajaxStop")))
                }
                "object" == typeof t && (n = t,
                t = void 0),
                n = n || {};
                var o, i, s, a, u, c, l, d, f, p, h = ae.ajaxSetup({}, n), v = h.context || h, m = h.context && (v.nodeType || v.jquery) ? ae(v) : ae.event, y = ae.Deferred(), g = ae.Callbacks("once memory"), b = h.statusCode || {}, x = {}, w = {}, T = "canceled", k = {
                    readyState: 0,
                    getResponseHeader: function(e) {
                        var t;
                        if (l) {
                            if (!a)
                                for (a = {}; t = Nt.exec(s); )
                                    a[t[1].toLowerCase()] = t[2];
                            t = a[e.toLowerCase()]
                        }
                        return null == t ? null : t
                    },
                    getAllResponseHeaders: function() {
                        return l ? s : null
                    },
                    setRequestHeader: function(e, t) {
                        return null == l && (e = w[e.toLowerCase()] = w[e.toLowerCase()] || e,
                        x[e] = t),
                        this
                    },
                    overrideMimeType: function(e) {
                        return null == l && (h.mimeType = e),
                        this
                    },
                    statusCode: function(e) {
                        var t;
                        if (e)
                            if (l)
                                k.always(e[k.status]);
                            else
                                for (t in e)
                                    b[t] = [b[t], e[t]];
                        return this
                    },
                    abort: function(e) {
                        var t = e || T;
                        return o && o.abort(t),
                        r(0, t),
                        this
                    }
                };
                if (y.promise(k),
                h.url = ((t || h.url || mt.href) + "").replace(At, mt.protocol + "//"),
                h.type = n.method || n.type || h.method || h.type,
                h.dataTypes = (h.dataType || "*").toLowerCase().match(Te) || [""],
                null == h.crossDomain) {
                    c = Y.createElement("a");
                    try {
                        c.href = h.url,
                        c.href = c.href,
                        h.crossDomain = Pt.protocol + "//" + Pt.host != c.protocol + "//" + c.host
                    } catch (e) {
                        h.crossDomain = !0
                    }
                }
                if (h.data && h.processData && "string" != typeof h.data && (h.data = ae.param(h.data, h.traditional)),
                G(jt, h, n, k),
                l)
                    return k;
                for (f in (d = ae.event && h.global) && 0 == ae.active++ && ae.event.trigger("ajaxStart"),
                h.type = h.type.toUpperCase(),
                h.hasContent = !St.test(h.type),
                i = h.url.replace(Et, ""),
                h.hasContent ? h.data && h.processData && 0 === (h.contentType || "").indexOf("application/x-www-form-urlencoded") && (h.data = h.data.replace(kt, "+")) : (p = h.url.slice(i.length),
                h.data && (i += (gt.test(i) ? "&" : "?") + h.data,
                delete h.data),
                !1 === h.cache && (i = i.replace(Ct, "$1"),
                p = (gt.test(i) ? "&" : "?") + "_=" + yt++ + p),
                h.url = i + p),
                h.ifModified && (ae.lastModified[i] && k.setRequestHeader("If-Modified-Since", ae.lastModified[i]),
                ae.etag[i] && k.setRequestHeader("If-None-Match", ae.etag[i])),
                (h.data && h.hasContent && !1 !== h.contentType || n.contentType) && k.setRequestHeader("Content-Type", h.contentType),
                k.setRequestHeader("Accept", h.dataTypes[0] && h.accepts[h.dataTypes[0]] ? h.accepts[h.dataTypes[0]] + ("*" !== h.dataTypes[0] ? ", " + Dt + "; q=0.01" : "") : h.accepts["*"]),
                h.headers)
                    k.setRequestHeader(f, h.headers[f]);
                if (h.beforeSend && (!1 === h.beforeSend.call(v, k, h) || l))
                    return k.abort();
                if (T = "abort",
                g.add(h.complete),
                k.done(h.success),
                k.fail(h.error),
                o = G(_t, h, n, k)) {
                    if (k.readyState = 1,
                    d && m.trigger("ajaxSend", [k, h]),
                    l)
                        return k;
                    h.async && h.timeout > 0 && (u = e.setTimeout(function() {
                        k.abort("timeout")
                    }, h.timeout));
                    try {
                        l = !1,
                        o.send(x, r)
                    } catch (e) {
                        if (l)
                            throw e;
                        r(-1, e)
                    }
                } else
                    r(-1, "No Transport");
                return k
            },
            getJSON: function(e, t, n) {
                return ae.get(e, t, n, "json")
            },
            getScript: function(e, t) {
                return ae.get(e, void 0, t, "script")
            }
        }),
        ae.each(["get", "post"], function(e, t) {
            ae[t] = function(e, n, r, o) {
                return ae.isFunction(n) && (o = o || r,
                r = n,
                n = void 0),
                ae.ajax(ae.extend({
                    url: e,
                    type: t,
                    dataType: o,
                    data: n,
                    success: r
                }, ae.isPlainObject(e) && e))
            }
        }),
        ae._evalUrl = function(e) {
            return ae.ajax({
                url: e,
                type: "GET",
                dataType: "script",
                cache: !0,
                async: !1,
                global: !1,
                throws: !0
            })
        }
        ,
        ae.fn.extend({
            wrapAll: function(e) {
                var t;
                return this[0] && (ae.isFunction(e) && (e = e.call(this[0])),
                t = ae(e, this[0].ownerDocument).eq(0).clone(!0),
                this[0].parentNode && t.insertBefore(this[0]),
                t.map(function() {
                    for (var e = this; e.firstElementChild; )
                        e = e.firstElementChild;
                    return e
                }).append(this)),
                this
            },
            wrapInner: function(e) {
                return ae.isFunction(e) ? this.each(function(t) {
                    ae(this).wrapInner(e.call(this, t))
                }) : this.each(function() {
                    var t = ae(this)
                      , n = t.contents();
                    n.length ? n.wrapAll(e) : t.append(e)
                })
            },
            wrap: function(e) {
                var t = ae.isFunction(e);
                return this.each(function(n) {
                    ae(this).wrapAll(t ? e.call(this, n) : e)
                })
            },
            unwrap: function(e) {
                return this.parent(e).not("body").each(function() {
                    ae(this).replaceWith(this.childNodes)
                }),
                this
            }
        }),
        ae.expr.pseudos.hidden = function(e) {
            return !ae.expr.pseudos.visible(e)
        }
        ,
        ae.expr.pseudos.visible = function(e) {
            return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length)
        }
        ,
        ae.ajaxSettings.xhr = function() {
            try {
                return new e.XMLHttpRequest
            } catch (e) {}
        }
        ;
        var Ot = {
            0: 200,
            1223: 204
        }
          , qt = ae.ajaxSettings.xhr();
        se.cors = !!qt && "withCredentials"in qt,
        se.ajax = qt = !!qt,
        ae.ajaxTransport(function(t) {
            var n, r;
            if (se.cors || qt && !t.crossDomain)
                return {
                    send: function(o, i) {
                        var s, a = t.xhr();
                        if (a.open(t.type, t.url, t.async, t.username, t.password),
                        t.xhrFields)
                            for (s in t.xhrFields)
                                a[s] = t.xhrFields[s];
                        for (s in t.mimeType && a.overrideMimeType && a.overrideMimeType(t.mimeType),
                        t.crossDomain || o["X-Requested-With"] || (o["X-Requested-With"] = "XMLHttpRequest"),
                        o)
                            a.setRequestHeader(s, o[s]);
                        n = function(e) {
                            return function() {
                                n && (n = r = a.onload = a.onerror = a.onabort = a.onreadystatechange = null,
                                "abort" === e ? a.abort() : "error" === e ? "number" != typeof a.status ? i(0, "error") : i(a.status, a.statusText) : i(Ot[a.status] || a.status, a.statusText, "text" !== (a.responseType || "text") || "string" != typeof a.responseText ? {
                                    binary: a.response
                                } : {
                                    text: a.responseText
                                }, a.getAllResponseHeaders()))
                            }
                        }
                        ,
                        a.onload = n(),
                        r = a.onerror = n("error"),
                        void 0 !== a.onabort ? a.onabort = r : a.onreadystatechange = function() {
                            4 === a.readyState && e.setTimeout(function() {
                                n && r()
                            })
                        }
                        ,
                        n = n("abort");
                        try {
                            a.send(t.hasContent && t.data || null)
                        } catch (e) {
                            if (n)
                                throw e
                        }
                    },
                    abort: function() {
                        n && n()
                    }
                }
        }),
        ae.ajaxPrefilter(function(e) {
            e.crossDomain && (e.contents.script = !1)
        }),
        ae.ajaxSetup({
            accepts: {
                script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
            },
            contents: {
                script: /\b(?:java|ecma)script\b/
            },
            converters: {
                "text script": function(e) {
                    return ae.globalEval(e),
                    e
                }
            }
        }),
        ae.ajaxPrefilter("script", function(e) {
            void 0 === e.cache && (e.cache = !1),
            e.crossDomain && (e.type = "GET")
        }),
        ae.ajaxTransport("script", function(e) {
            var t, n;
            if (e.crossDomain)
                return {
                    send: function(r, o) {
                        t = ae("<script>").prop({
                            charset: e.scriptCharset,
                            src: e.url
                        }).on("load error", n = function(e) {
                            t.remove(),
                            n = null,
                            e && o("error" === e.type ? 404 : 200, e.type)
                        }
                        ),
                        Y.head.appendChild(t[0])
                    },
                    abort: function() {
                        n && n()
                    }
                }
        });
        var Lt = []
          , Rt = /(=)\?(?=&|$)|\?\?/;
        return ae.ajaxSetup({
            jsonp: "callback",
            jsonpCallback: function() {
                var e = Lt.pop() || ae.expando + "_" + yt++;
                return this[e] = !0,
                e
            }
        }),
        ae.ajaxPrefilter("json jsonp", function(t, n, r) {
            var o, i, s, a = !1 !== t.jsonp && (Rt.test(t.url) ? "url" : "string" == typeof t.data && 0 === (t.contentType || "").indexOf("application/x-www-form-urlencoded") && Rt.test(t.data) && "data");
            if (a || "jsonp" === t.dataTypes[0])
                return o = t.jsonpCallback = ae.isFunction(t.jsonpCallback) ? t.jsonpCallback() : t.jsonpCallback,
                a ? t[a] = t[a].replace(Rt, "$1" + o) : !1 !== t.jsonp && (t.url += (gt.test(t.url) ? "&" : "?") + t.jsonp + "=" + o),
                t.converters["script json"] = function() {
                    return s || ae.error(o + " was not called"),
                    s[0]
                }
                ,
                t.dataTypes[0] = "json",
                i = e[o],
                e[o] = function() {
                    s = arguments
                }
                ,
                r.always(function() {
                    void 0 === i ? ae(e).removeProp(o) : e[o] = i,
                    t[o] && (t.jsonpCallback = n.jsonpCallback,
                    Lt.push(o)),
                    s && ae.isFunction(i) && i(s[0]),
                    s = i = void 0
                }),
                "script"
        }),
        se.createHTMLDocument = function() {
            var e = Y.implementation.createHTMLDocument("").body;
            return e.innerHTML = "<form></form><form></form>",
            2 === e.childNodes.length
        }(),
        ae.parseHTML = function(e, t, n) {
            return "string" != typeof e ? [] : ("boolean" == typeof t && (n = t,
            t = !1),
            t || (se.createHTMLDocument ? ((r = (t = Y.implementation.createHTMLDocument("")).createElement("base")).href = Y.location.href,
            t.head.appendChild(r)) : t = Y),
            i = !n && [],
            (o = me.exec(e)) ? [t.createElement(o[1])] : (o = g([e], t, i),
            i && i.length && ae(i).remove(),
            ae.merge([], o.childNodes)));
            var r, o, i
        }
        ,
        ae.fn.load = function(e, t, n) {
            var r, o, i, s = this, a = e.indexOf(" ");
            return a > -1 && (r = U(e.slice(a)),
            e = e.slice(0, a)),
            ae.isFunction(t) ? (n = t,
            t = void 0) : t && "object" == typeof t && (o = "POST"),
            s.length > 0 && ae.ajax({
                url: e,
                type: o || "GET",
                dataType: "html",
                data: t
            }).done(function(e) {
                i = arguments,
                s.html(r ? ae("<div>").append(ae.parseHTML(e)).find(r) : e)
            }).always(n && function(e, t) {
                s.each(function() {
                    n.apply(this, i || [e.responseText, t, e])
                })
            }
            ),
            this
        }
        ,
        ae.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(e, t) {
            ae.fn[t] = function(e) {
                return this.on(t, e)
            }
        }),
        ae.expr.pseudos.animated = function(e) {
            return ae.grep(ae.timers, function(t) {
                return e === t.elem
            }).length
        }
        ,
        ae.offset = {
            setOffset: function(e, t, n) {
                var r, o, i, s, a, u, c = ae.css(e, "position"), l = ae(e), d = {};
                "static" === c && (e.style.position = "relative"),
                a = l.offset(),
                i = ae.css(e, "top"),
                u = ae.css(e, "left"),
                ("absolute" === c || "fixed" === c) && (i + u).indexOf("auto") > -1 ? (s = (r = l.position()).top,
                o = r.left) : (s = parseFloat(i) || 0,
                o = parseFloat(u) || 0),
                ae.isFunction(t) && (t = t.call(e, n, ae.extend({}, a))),
                null != t.top && (d.top = t.top - a.top + s),
                null != t.left && (d.left = t.left - a.left + o),
                "using"in t ? t.using.call(e, d) : l.css(d)
            }
        },
        ae.fn.extend({
            offset: function(e) {
                if (arguments.length)
                    return void 0 === e ? this : this.each(function(t) {
                        ae.offset.setOffset(this, e, t)
                    });
                var t, n, r, o, i = this[0];
                return i ? i.getClientRects().length ? (r = i.getBoundingClientRect(),
                n = (t = i.ownerDocument).documentElement,
                o = t.defaultView,
                {
                    top: r.top + o.pageYOffset - n.clientTop,
                    left: r.left + o.pageXOffset - n.clientLeft
                }) : {
                    top: 0,
                    left: 0
                } : void 0
            },
            position: function() {
                if (this[0]) {
                    var e, t, n = this[0], r = {
                        top: 0,
                        left: 0
                    };
                    return "fixed" === ae.css(n, "position") ? t = n.getBoundingClientRect() : (e = this.offsetParent(),
                    t = this.offset(),
                    o(e[0], "html") || (r = e.offset()),
                    r = {
                        top: r.top + ae.css(e[0], "borderTopWidth", !0),
                        left: r.left + ae.css(e[0], "borderLeftWidth", !0)
                    }),
                    {
                        top: t.top - r.top - ae.css(n, "marginTop", !0),
                        left: t.left - r.left - ae.css(n, "marginLeft", !0)
                    }
                }
            },
            offsetParent: function() {
                return this.map(function() {
                    for (var e = this.offsetParent; e && "static" === ae.css(e, "position"); )
                        e = e.offsetParent;
                    return e || Ue
                })
            }
        }),
        ae.each({
            scrollLeft: "pageXOffset",
            scrollTop: "pageYOffset"
        }, function(e, t) {
            var n = "pageYOffset" === t;
            ae.fn[e] = function(r) {
                return Ce(this, function(e, r, o) {
                    var i;
                    if (ae.isWindow(e) ? i = e : 9 === e.nodeType && (i = e.defaultView),
                    void 0 === o)
                        return i ? i[t] : e[r];
                    i ? i.scrollTo(n ? i.pageXOffset : o, n ? o : i.pageYOffset) : e[r] = o
                }, e, r, arguments.length)
            }
        }),
        ae.each(["top", "left"], function(e, t) {
            ae.cssHooks[t] = D(se.pixelPosition, function(e, n) {
                if (n)
                    return n = _(e, t),
                    Je.test(n) ? ae(e).position()[t] + "px" : n
            })
        }),
        ae.each({
            Height: "height",
            Width: "width"
        }, function(e, t) {
            ae.each({
                padding: "inner" + e,
                content: t,
                "": "outer" + e
            }, function(n, r) {
                ae.fn[r] = function(o, i) {
                    var s = arguments.length && (n || "boolean" != typeof o)
                      , a = n || (!0 === o || !0 === i ? "margin" : "border");
                    return Ce(this, function(t, n, o) {
                        var i;
                        return ae.isWindow(t) ? 0 === r.indexOf("outer") ? t["inner" + e] : t.document.documentElement["client" + e] : 9 === t.nodeType ? (i = t.documentElement,
                        Math.max(t.body["scroll" + e], i["scroll" + e], t.body["offset" + e], i["offset" + e], i["client" + e])) : void 0 === o ? ae.css(t, n, a) : ae.style(t, n, o, a)
                    }, t, s ? o : void 0, s)
                }
            })
        }),
        ae.fn.extend({
            bind: function(e, t, n) {
                return this.on(e, null, t, n)
            },
            unbind: function(e, t) {
                return this.off(e, null, t)
            },
            delegate: function(e, t, n, r) {
                return this.on(t, e, n, r)
            },
            undelegate: function(e, t, n) {
                return 1 === arguments.length ? this.off(e, "**") : this.off(t, e || "**", n)
            }
        }),
        ae.holdReady = function(e) {
            e ? ae.readyWait++ : ae.ready(!0)
        }
        ,
        ae.isArray = Array.isArray,
        ae.parseJSON = JSON.parse,
        ae.nodeName = o,
        "function" == typeof define && define.amd && define("jquery", [], function() {
            return ae
        }),
        e.pQuery,
        t || (e.pQuery = e.$_$ = ae),
        ae
    });
    var t = window.pQuery;
    function n(e) {
        this.dataSentToServer = e || {},
        this.option = {
            method: "POST",
            prensentationMode: n.OPEN_IN_POPUP,
            didPopupClosed: function(e, t, n) {},
            willGetToken: function() {},
            didGetToken: function(e, t) {},
            didReceiveNonSuccessResponse: function(e) {},
            didReceiveError: function(e) {},
            emptyFunction: function() {}
        }
    }
    t.fn.center = function() {
        return this.each(function() {
            var e = t(this)
              , n = e.height()
              , r = e.width()
              , o = {
                position: "absolute",
                left: (window.innerWidth - r) / 2 + "px",
                top: (window.innerHeight - n) / 2 + "px"
            };
            e.css(o)
        })
    }
    ,
    function(e) {
        var t = setTimeout;
        function n() {}
        function r(e) {
            if ("object" != typeof this)
                throw new TypeError("Promises must be constructed via new");
            if ("function" != typeof e)
                throw new TypeError("not a function");
            this._state = 0,
            this._handled = !1,
            this._value = void 0,
            this._deferreds = [],
            c(e, this)
        }
        function o(e, t) {
            for (; 3 === e._state; )
                e = e._value;
            0 !== e._state ? (e._handled = !0,
            r._immediateFn(function() {
                var n = 1 === e._state ? t.onFulfilled : t.onRejected;
                if (null !== n) {
                    var r;
                    try {
                        r = n(e._value)
                    } catch (e) {
                        return void s(t.promise, e)
                    }
                    i(t.promise, r)
                } else
                    (1 === e._state ? i : s)(t.promise, e._value)
            })) : e._deferreds.push(t)
        }
        function i(e, t) {
            try {
                if (t === e)
                    throw new TypeError("A promise cannot be resolved with itself.");
                if (t && ("object" == typeof t || "function" == typeof t)) {
                    var n = t.then;
                    if (t instanceof r)
                        return e._state = 3,
                        e._value = t,
                        void a(e);
                    if ("function" == typeof n)
                        return void c((o = n,
                        i = t,
                        function() {
                            o.apply(i, arguments)
                        }
                        ), e)
                }
                e._state = 1,
                e._value = t,
                a(e)
            } catch (t) {
                s(e, t)
            }
            var o, i
        }
        function s(e, t) {
            e._state = 2,
            e._value = t,
            a(e)
        }
        function a(e) {
            2 === e._state && 0 === e._deferreds.length && r._immediateFn(function() {
                e._handled || r._unhandledRejectionFn(e._value)
            });
            for (var t = 0, n = e._deferreds.length; t < n; t++)
                o(e, e._deferreds[t]);
            e._deferreds = null
        }
        function u(e, t, n) {
            this.onFulfilled = "function" == typeof e ? e : null,
            this.onRejected = "function" == typeof t ? t : null,
            this.promise = n
        }
        function c(e, t) {
            var n = !1;
            try {
                e(function(e) {
                    n || (n = !0,
                    i(t, e))
                }, function(e) {
                    n || (n = !0,
                    s(t, e))
                })
            } catch (e) {
                if (n)
                    return;
                n = !0,
                s(t, e)
            }
        }
        r.prototype.catch = function(e) {
            return this.then(null, e)
        }
        ,
        r.prototype.then = function(e, t) {
            var r = new this.constructor(n);
            return o(this, new u(e,t,r)),
            r
        }
        ,
        r.all = function(e) {
            var t = Array.prototype.slice.call(e);
            return new r(function(e, n) {
                if (0 === t.length)
                    return e([]);
                var r = t.length;
                function o(i, s) {
                    try {
                        if (s && ("object" == typeof s || "function" == typeof s)) {
                            var a = s.then;
                            if ("function" == typeof a)
                                return void a.call(s, function(e) {
                                    o(i, e)
                                }, n)
                        }
                        t[i] = s,
                        0 == --r && e(t)
                    } catch (e) {
                        n(e)
                    }
                }
                for (var i = 0; i < t.length; i++)
                    o(i, t[i])
            }
            )
        }
        ,
        r.resolve = function(e) {
            return e && "object" == typeof e && e.constructor === r ? e : new r(function(t) {
                t(e)
            }
            )
        }
        ,
        r.reject = function(e) {
            return new r(function(t, n) {
                n(e)
            }
            )
        }
        ,
        r.race = function(e) {
            return new r(function(t, n) {
                for (var r = 0, o = e.length; r < o; r++)
                    e[r].then(t, n)
            }
            )
        }
        ,
        r._immediateFn = "function" == typeof setImmediate && function(e) {
            setImmediate(e)
        }
        || function(e) {
            t(e, 0)
        }
        ,
        r._unhandledRejectionFn = function(e) {
            "undefined" != typeof console && console && console.warn("Possible Unhandled Promise Rejection:", e)
        }
        ,
        r._setImmediateFn = function(e) {
            r._immediateFn = e
        }
        ,
        r._setUnhandledRejectionFn = function(e) {
            r._unhandledRejectionFn = e
        }
        ,
        "undefined" != typeof module && module.exports ? module.exports = r : e.Promise || (e.Promise = r)
    }(e),
    function(e) {
        "use strict";
        if (!e.fetch) {
            var t = {
                searchParams: "URLSearchParams"in e,
                iterable: "Symbol"in e && "iterator"in Symbol,
                blob: "FileReader"in e && "Blob"in e && function() {
                    try {
                        return new Blob,
                        !0
                    } catch (e) {
                        return !1
                    }
                }(),
                formData: "FormData"in e,
                arrayBuffer: "ArrayBuffer"in e
            };
            if (t.arrayBuffer)
                var n = ["[object Int8Array]", "[object Uint8Array]", "[object Uint8ClampedArray]", "[object Int16Array]", "[object Uint16Array]", "[object Int32Array]", "[object Uint32Array]", "[object Float32Array]", "[object Float64Array]"]
                  , r = function(e) {
                    return e && DataView.prototype.isPrototypeOf(e)
                }
                  , o = ArrayBuffer.isView || function(e) {
                    return e && n.indexOf(Object.prototype.toString.call(e)) > -1
                }
                ;
            l.prototype.append = function(e, t) {
                e = a(e),
                t = u(t);
                var n = this.map[e];
                this.map[e] = n ? n + "," + t : t
            }
            ,
            l.prototype.delete = function(e) {
                delete this.map[a(e)]
            }
            ,
            l.prototype.get = function(e) {
                return e = a(e),
                this.has(e) ? this.map[e] : null
            }
            ,
            l.prototype.has = function(e) {
                return this.map.hasOwnProperty(a(e))
            }
            ,
            l.prototype.set = function(e, t) {
                this.map[a(e)] = u(t)
            }
            ,
            l.prototype.forEach = function(e, t) {
                for (var n in this.map)
                    this.map.hasOwnProperty(n) && e.call(t, this.map[n], n, this)
            }
            ,
            l.prototype.keys = function() {
                var e = [];
                return this.forEach(function(t, n) {
                    e.push(n)
                }),
                c(e)
            }
            ,
            l.prototype.values = function() {
                var e = [];
                return this.forEach(function(t) {
                    e.push(t)
                }),
                c(e)
            }
            ,
            l.prototype.entries = function() {
                var e = [];
                return this.forEach(function(t, n) {
                    e.push([n, t])
                }),
                c(e)
            }
            ,
            t.iterable && (l.prototype[Symbol.iterator] = l.prototype.entries);
            var i = ["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"];
            m.prototype.clone = function() {
                return new m(this,{
                    body: this._bodyInit
                })
            }
            ,
            v.call(m.prototype),
            v.call(g.prototype),
            g.prototype.clone = function() {
                return new g(this._bodyInit,{
                    status: this.status,
                    statusText: this.statusText,
                    headers: new l(this.headers),
                    url: this.url
                })
            }
            ,
            g.error = function() {
                var e = new g(null,{
                    status: 0,
                    statusText: ""
                });
                return e.type = "error",
                e
            }
            ;
            var s = [301, 302, 303, 307, 308];
            g.redirect = function(e, t) {
                if (-1 === s.indexOf(t))
                    throw new RangeError("Invalid status code");
                return new g(null,{
                    status: t,
                    headers: {
                        location: e
                    }
                })
            }
            ,
            e.Headers = l,
            e.Request = m,
            e.Response = g,
            e.fetch = function(e, n) {
                return new Promise(function(r, o) {
                    var i = new m(e,n)
                      , s = new XMLHttpRequest;
                    s.onload = function() {
                        var e, t, n = {
                            status: s.status,
                            statusText: s.statusText,
                            headers: (e = s.getAllResponseHeaders() || "",
                            t = new l,
                            e.replace(/\r?\n[\t ]+/g, " ").split(/\r?\n/).forEach(function(e) {
                                var n = e.split(":")
                                  , r = n.shift().trim();
                                if (r) {
                                    var o = n.join(":").trim();
                                    t.append(r, o)
                                }
                            }),
                            t)
                        };
                        n.url = "responseURL"in s ? s.responseURL : n.headers.get("X-Request-URL");
                        var o = "response"in s ? s.response : s.responseText;
                        r(new g(o,n))
                    }
                    ,
                    s.onerror = function() {
                        o(new TypeError("Network request failed"))
                    }
                    ,
                    s.ontimeout = function() {
                        o(new TypeError("Network request failed"))
                    }
                    ,
                    s.open(i.method, i.url, !0),
                    "include" === i.credentials ? s.withCredentials = !0 : "omit" === i.credentials && (s.withCredentials = !1),
                    "responseType"in s && t.blob && (s.responseType = "blob"),
                    i.headers.forEach(function(e, t) {
                        s.setRequestHeader(t, e)
                    }),
                    s.send(void 0 === i._bodyInit ? null : i._bodyInit)
                }
                )
            }
            ,
            e.fetch.polyfill = !0
        }
        function a(e) {
            if ("string" != typeof e && (e = String(e)),
            /[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(e))
                throw new TypeError("Invalid character in header field name");
            return e.toLowerCase()
        }
        function u(e) {
            return "string" != typeof e && (e = String(e)),
            e
        }
        function c(e) {
            var n = {
                next: function() {
                    var t = e.shift();
                    return {
                        done: void 0 === t,
                        value: t
                    }
                }
            };
            return t.iterable && (n[Symbol.iterator] = function() {
                return n
            }
            ),
            n
        }
        function l(e) {
            this.map = {},
            e instanceof l ? e.forEach(function(e, t) {
                this.append(t, e)
            }, this) : Array.isArray(e) ? e.forEach(function(e) {
                this.append(e[0], e[1])
            }, this) : e && Object.getOwnPropertyNames(e).forEach(function(t) {
                this.append(t, e[t])
            }, this)
        }
        function d(e) {
            if (e.bodyUsed)
                return Promise.reject(new TypeError("Already read"));
            e.bodyUsed = !0
        }
        function f(e) {
            return new Promise(function(t, n) {
                e.onload = function() {
                    t(e.result)
                }
                ,
                e.onerror = function() {
                    n(e.error)
                }
            }
            )
        }
        function p(e) {
            var t = new FileReader
              , n = f(t);
            return t.readAsArrayBuffer(e),
            n
        }
        function h(e) {
            if (e.slice)
                return e.slice(0);
            var t = new Uint8Array(e.byteLength);
            return t.set(new Uint8Array(e)),
            t.buffer
        }
        function v() {
            return this.bodyUsed = !1,
            this._initBody = function(e) {
                if (this._bodyInit = e,
                e)
                    if ("string" == typeof e)
                        this._bodyText = e;
                    else if (t.blob && Blob.prototype.isPrototypeOf(e))
                        this._bodyBlob = e;
                    else if (t.formData && FormData.prototype.isPrototypeOf(e))
                        this._bodyFormData = e;
                    else if (t.searchParams && URLSearchParams.prototype.isPrototypeOf(e))
                        this._bodyText = e.toString();
                    else if (t.arrayBuffer && t.blob && r(e))
                        this._bodyArrayBuffer = h(e.buffer),
                        this._bodyInit = new Blob([this._bodyArrayBuffer]);
                    else {
                        if (!t.arrayBuffer || !ArrayBuffer.prototype.isPrototypeOf(e) && !o(e))
                            throw new Error("unsupported BodyInit type");
                        this._bodyArrayBuffer = h(e)
                    }
                else
                    this._bodyText = "";
                this.headers.get("content-type") || ("string" == typeof e ? this.headers.set("content-type", "text/plain;charset=UTF-8") : this._bodyBlob && this._bodyBlob.type ? this.headers.set("content-type", this._bodyBlob.type) : t.searchParams && URLSearchParams.prototype.isPrototypeOf(e) && this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8"))
            }
            ,
            t.blob && (this.blob = function() {
                var e = d(this);
                if (e)
                    return e;
                if (this._bodyBlob)
                    return Promise.resolve(this._bodyBlob);
                if (this._bodyArrayBuffer)
                    return Promise.resolve(new Blob([this._bodyArrayBuffer]));
                if (this._bodyFormData)
                    throw new Error("could not read FormData body as blob");
                return Promise.resolve(new Blob([this._bodyText]))
            }
            ,
            this.arrayBuffer = function() {
                return this._bodyArrayBuffer ? d(this) || Promise.resolve(this._bodyArrayBuffer) : this.blob().then(p)
            }
            ),
            this.text = function() {
                var e, t, n, r = d(this);
                if (r)
                    return r;
                if (this._bodyBlob)
                    return e = this._bodyBlob,
                    t = new FileReader,
                    n = f(t),
                    t.readAsText(e),
                    n;
                if (this._bodyArrayBuffer)
                    return Promise.resolve(function(e) {
                        for (var t = new Uint8Array(e), n = new Array(t.length), r = 0; r < t.length; r++)
                            n[r] = String.fromCharCode(t[r]);
                        return n.join("")
                    }(this._bodyArrayBuffer));
                if (this._bodyFormData)
                    throw new Error("could not read FormData body as text");
                return Promise.resolve(this._bodyText)
            }
            ,
            t.formData && (this.formData = function() {
                return this.text().then(y)
            }
            ),
            this.json = function() {
                return this.text().then(JSON.parse)
            }
            ,
            this
        }
        function m(e, t) {
            var n, r, o = (t = t || {}).body;
            if (e instanceof m) {
                if (e.bodyUsed)
                    throw new TypeError("Already read");
                this.url = e.url,
                this.credentials = e.credentials,
                t.headers || (this.headers = new l(e.headers)),
                this.method = e.method,
                this.mode = e.mode,
                o || null == e._bodyInit || (o = e._bodyInit,
                e.bodyUsed = !0)
            } else
                this.url = String(e);
            if (this.credentials = t.credentials || this.credentials || "omit",
            !t.headers && this.headers || (this.headers = new l(t.headers)),
            this.method = (n = t.method || this.method || "GET",
            r = n.toUpperCase(),
            i.indexOf(r) > -1 ? r : n),
            this.mode = t.mode || this.mode || null,
            this.referrer = null,
            ("GET" === this.method || "HEAD" === this.method) && o)
                throw new TypeError("Body not allowed for GET or HEAD requests");
            this._initBody(o)
        }
        function y(e) {
            var t = new FormData;
            return e.trim().split("&").forEach(function(e) {
                if (e) {
                    var n = e.split("=")
                      , r = n.shift().replace(/\+/g, " ")
                      , o = n.join("=").replace(/\+/g, " ");
                    t.append(decodeURIComponent(r), decodeURIComponent(o))
                }
            }),
            t
        }
        function g(e, t) {
            t || (t = {}),
            this.type = "default",
            this.status = void 0 === t.status ? 200 : t.status,
            this.ok = this.status >= 200 && this.status < 300,
            this.statusText = "statusText"in t ? t.statusText : "OK",
            this.headers = new l(t.headers),
            this.url = t.url || "",
            this._initBody(e)
        }
    }(e),
    function(e) {
        "use strict";
        var t, n, r, o, i, s, a, u, c, l, d, f, p, h, v, m, y, g, b, x, w, T, k, E, C, N, S, A, j, _, D, P, O, q, L, R, F, H, I;
        e.fn.extend({
            venobox: function(B) {
                var M = this
                  , U = e.extend({
                    arrowsColor: "#B6B6B6",
                    autoplay: !1,
                    bgcolor: "#fff",
                    border: "0",
                    closeBackground: "#161617",
                    closeColor: "#d2d2d2",
                    framewidth: "",
                    frameheight: "",
                    infinigall: !1,
                    htmlClose: "&times;",
                    htmlNext: "<span>Next</span>",
                    htmlPrev: "<span>Prev</span>",
                    numeratio: !1,
                    numerationBackground: "#161617",
                    numerationColor: "#d2d2d2",
                    numerationPosition: "top",
                    overlayClose: !0,
                    overlayColor: "rgba(23,23,23,0.85)",
                    spinner: "double-bounce",
                    spinColor: "#d2d2d2",
                    titleattr: "title",
                    titleBackground: "#161617",
                    titleColor: "#d2d2d2",
                    titlePosition: "top",
                    cb_pre_open: function() {
                        return !0
                    },
                    cb_post_open: function() {},
                    cb_pre_close: function() {
                        return !0
                    },
                    cb_post_close: function() {},
                    cb_post_resize: function() {},
                    cb_after_nav: function() {},
                    cb_init: function() {}
                }, B);
                return U.cb_init(M),
                this.each(function() {
                    if ((S = e(this)).data("venobox"))
                        return !0;
                    function B() {
                        x = S.data("gall"),
                        m = S.data("numeratio"),
                        f = S.data("infinigall"),
                        p = e('.vbox-item[data-gall="' + x + '"]'),
                        w = p.eq(p.index(S) + 1),
                        T = p.eq(p.index(S) - 1),
                        w.length || !0 !== f || (w = p.eq(0)),
                        p.length > 1 ? (A = p.index(S) + 1,
                        r.html(A + " / " + p.length)) : A = 1,
                        !0 === m ? r.show() : r.hide(),
                        "" !== b ? o.show() : o.hide(),
                        w.length || !0 === f ? (e(".vbox-next").css("display", "block"),
                        k = !0) : (e(".vbox-next").css("display", "none"),
                        k = !1),
                        p.index(S) > 0 || !0 === f ? (e(".vbox-prev").css("display", "block"),
                        E = !0) : (e(".vbox-prev").css("display", "none"),
                        E = !1),
                        !0 !== E && !0 !== k || (a.on(Q.DOWN, X),
                        a.on(Q.MOVE, V),
                        a.on(Q.UP, Y))
                    }
                    function W(e) {
                        return !(e.length < 1) && (!h && (h = !0,
                        y = e.data("overlay") || e.data("overlaycolor"),
                        l = e.data("framewidth"),
                        d = e.data("frameheight"),
                        i = e.data("border"),
                        n = e.data("bgcolor"),
                        u = e.data("href") || e.attr("href"),
                        t = e.data("autoplay"),
                        b = e.attr(e.data("titleattr")) || "",
                        e === T && a.addClass("animated").addClass("swipe-right"),
                        e === w && a.addClass("animated").addClass("swipe-left"),
                        void a.animate({
                            opacity: 0
                        }, 500, function() {
                            g.css("background", y),
                            a.removeClass("animated").removeClass("swipe-left").removeClass("swipe-right").css({
                                "margin-left": 0,
                                "margin-right": 0
                            }),
                            "iframe" == e.data("vbtype") ? te() : "inline" == e.data("vbtype") ? re() : "ajax" == e.data("vbtype") ? ee() : "video" == e.data("vbtype") || "vimeo" == e.data("vbtype") || "youtube" == e.data("vbtype") ? ne(t) : (a.html('<img src="' + u + '">'),
                            oe()),
                            S = e,
                            B(),
                            h = !1,
                            U.cb_after_nav(S, A, w, T)
                        })))
                    }
                    function $(e) {
                        27 === e.keyCode && z(),
                        37 == e.keyCode && !0 === E && W(T),
                        39 == e.keyCode && !0 === k && W(w)
                    }
                    function z() {
                        if (!1 === U.cb_pre_close(S, A, w, T))
                            return !1;
                        e("body").off("keydown", $).removeClass("vbox-open"),
                        S.focus(),
                        g.animate({
                            opacity: 0
                        }, 500, function() {
                            g.remove(),
                            h = !1,
                            U.cb_post_close()
                        })
                    }
                    M.VBclose = function() {
                        z()
                    }
                    ,
                    S.addClass("vbox-item"),
                    S.data("framewidth", U.framewidth),
                    S.data("frameheight", U.frameheight),
                    S.data("border", U.border),
                    S.data("bgcolor", U.bgcolor),
                    S.data("numeratio", U.numeratio),
                    S.data("infinigall", U.infinigall),
                    S.data("overlaycolor", U.overlayColor),
                    S.data("titleattr", U.titleattr),
                    S.data("venobox", !0),
                    S.on("click", function(f) {
                        if (f.preventDefault(),
                        S = e(this),
                        !1 === U.cb_pre_open(S))
                            return !1;
                        switch (M.VBnext = function() {
                            W(w)
                        }
                        ,
                        M.VBprev = function() {
                            W(T)
                        }
                        ,
                        y = S.data("overlay") || S.data("overlaycolor"),
                        l = S.data("framewidth"),
                        d = S.data("frameheight"),
                        t = S.data("autoplay") || U.autoplay,
                        i = S.data("border"),
                        n = S.data("bgcolor"),
                        k = !1,
                        E = !1,
                        h = !1,
                        u = S.data("href") || S.attr("href"),
                        c = S.data("css") || "",
                        b = S.attr(S.data("titleattr")) || "",
                        C = '<div class="vbox-preloader">',
                        U.spinner) {
                        case "rotating-plane":
                            C += '<div class="sk-rotating-plane"></div>';
                            break;
                        case "double-bounce":
                            C += '<div class="sk-double-bounce"><div class="sk-child sk-double-bounce1"></div><div class="sk-child sk-double-bounce2"></div></div>';
                            break;
                        case "wave":
                            C += '<div class="sk-wave"><div class="sk-rect sk-rect1"></div><div class="sk-rect sk-rect2"></div><div class="sk-rect sk-rect3"></div><div class="sk-rect sk-rect4"></div><div class="sk-rect sk-rect5"></div></div>';
                            break;
                        case "wandering-cubes":
                            C += '<div class="sk-wandering-cubes"><div class="sk-cube sk-cube1"></div><div class="sk-cube sk-cube2"></div></div>';
                            break;
                        case "spinner-pulse":
                            C += '<div class="sk-spinner sk-spinner-pulse"></div>';
                            break;
                        case "three-bounce":
                            C += '<div class="sk-three-bounce"><div class="sk-child sk-bounce1"></div><div class="sk-child sk-bounce2"></div><div class="sk-child sk-bounce3"></div></div>';
                            break;
                        case "cube-grid":
                            C += '<div class="sk-cube-grid"><div class="sk-cube sk-cube1"></div><div class="sk-cube sk-cube2"></div><div class="sk-cube sk-cube3"></div><div class="sk-cube sk-cube4"></div><div class="sk-cube sk-cube5"></div><div class="sk-cube sk-cube6"></div><div class="sk-cube sk-cube7"></div><div class="sk-cube sk-cube8"></div><div class="sk-cube sk-cube9"></div></div>'
                        }
                        return C += "</div>",
                        N = '<a class="vbox-next">' + U.htmlNext + '</a><a class="vbox-prev">' + U.htmlPrev + "</a>",
                        _ = '<div class="vbox-title"></div><div class="vbox-num">0/0</div><div class="vbox-close">' + U.htmlClose + "</div>",
                        s = '<div class="vbox-overlay ' + c + '" style="background:' + y + '">' + C + '<div class="vbox-container"><div class="vbox-content"></div></div>' + _ + N + "</div>",
                        e("body").append(s).addClass("vbox-open"),
                        e(".vbox-preloader .sk-child, .vbox-preloader .sk-rotating-plane, .vbox-preloader .sk-rect, .vbox-preloader .sk-cube, .vbox-preloader .sk-spinner-pulse").css("background-color", U.spinColor),
                        g = e(".vbox-overlay"),
                        e(".vbox-container"),
                        a = e(".vbox-content"),
                        r = e(".vbox-num"),
                        (o = e(".vbox-title")).css(U.titlePosition, "-1px"),
                        o.css({
                            color: U.titleColor,
                            "background-color": U.titleBackground
                        }),
                        e(".vbox-close").css({
                            color: U.closeColor,
                            "background-color": U.closeBackground
                        }),
                        e(".vbox-num").css(U.numerationPosition, "-1px"),
                        e(".vbox-num").css({
                            color: U.numerationColor,
                            "background-color": U.numerationBackground
                        }),
                        e(".vbox-next span, .vbox-prev span").css({
                            "border-top-color": U.arrowsColor,
                            "border-right-color": U.arrowsColor
                        }),
                        a.html(""),
                        a.css("opacity", "0"),
                        g.css("opacity", "0"),
                        B(),
                        g.animate({
                            opacity: 1
                        }, 250, function() {
                            "iframe" == S.data("vbtype") ? te() : "inline" == S.data("vbtype") ? re() : "ajax" == S.data("vbtype") ? ee() : "video" == S.data("vbtype") || "vimeo" == S.data("vbtype") || "youtube" == S.data("vbtype") ? ne(t) : (a.html('<img src="' + u + '">'),
                            oe()),
                            U.cb_post_open(S, A, w, T)
                        }),
                        e("body").keydown($),
                        e(".vbox-prev").on("click", function() {
                            W(T)
                        }),
                        e(".vbox-next").on("click", function() {
                            W(w)
                        }),
                        !1
                    });
                    var G = ".vbox-overlay";
                    function X(e) {
                        a.addClass("animated"),
                        P = q = e.pageY,
                        O = L = e.pageX,
                        j = !0
                    }
                    function V(e) {
                        if (!0 === j) {
                            L = e.pageX,
                            q = e.pageY,
                            F = L - O,
                            H = q - P;
                            var t = Math.abs(F);
                            t > Math.abs(H) && t <= 100 && (e.preventDefault(),
                            a.css("margin-left", F))
                        }
                    }
                    function Y(e) {
                        if (!0 === j) {
                            j = !1;
                            var t = S
                              , n = !1;
                            (R = L - O) < 0 && !0 === k && (t = w,
                            n = !0),
                            R > 0 && !0 === E && (t = T,
                            n = !0),
                            Math.abs(R) >= I && !0 === n ? W(t) : a.css({
                                "margin-left": 0,
                                "margin-right": 0
                            })
                        }
                    }
                    U.overlayClose || (G = ".vbox-close"),
                    e(document).on("click", G, function(t) {
                        (e(t.target).is(".vbox-overlay") || e(t.target).is(".vbox-content") || e(t.target).is(".vbox-close") || e(t.target).is(".vbox-preloader")) && z()
                    }),
                    O = 0,
                    L = 0,
                    R = 0,
                    I = 50,
                    j = !1;
                    var Q = {
                        DOWN: "touchmousedown",
                        UP: "touchmouseup",
                        MOVE: "touchmousemove"
                    }
                      , K = function(t) {
                        var n;
                        switch (t.type) {
                        case "mousedown":
                            n = Q.DOWN;
                            break;
                        case "mouseup":
                        case "mouseout":
                            n = Q.UP;
                            break;
                        case "mousemove":
                            n = Q.MOVE;
                            break;
                        default:
                            return
                        }
                        var r = Z(n, t, t.pageX, t.pageY);
                        e(t.target).trigger(r)
                    }
                      , J = function(t) {
                        var n;
                        switch (t.type) {
                        case "touchstart":
                            n = Q.DOWN;
                            break;
                        case "touchend":
                            n = Q.UP;
                            break;
                        case "touchmove":
                            n = Q.MOVE;
                            break;
                        default:
                            return
                        }
                        var r, o = t.originalEvent.touches[0];
                        r = n == Q.UP ? Z(n, t, null, null) : Z(n, t, o.pageX, o.pageY),
                        e(t.target).trigger(r)
                    }
                      , Z = function(t, n, r, o) {
                        return e.Event(t, {
                            pageX: r,
                            pageY: o,
                            originalEvent: n
                        })
                    };
                    function ee() {
                        e.ajax({
                            url: u,
                            cache: !1
                        }).done(function(e) {
                            a.html('<div class="vbox-inline">' + e + "</div>"),
                            oe()
                        }).fail(function() {
                            a.html('<div class="vbox-inline"><p>Error retrieving contents, please retry</div>'),
                            ie()
                        })
                    }
                    function te() {
                        a.html('<iframe class="venoframe" src="' + u + '"></iframe>'),
                        ie()
                    }
                    function ne(e) {
                        var t, n = function(e) {
                            if (e.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/),
                            RegExp.$3.indexOf("youtu") > -1)
                                var t = "youtube";
                            else if (RegExp.$3.indexOf("vimeo") > -1)
                                var t = "vimeo";
                            return {
                                type: t,
                                id: RegExp.$6
                            }
                        }(u), r = (e ? "?rel=0&autoplay=1" : "?rel=0") + function(e) {
                            var t = ""
                              , n = decodeURIComponent(e).split("?");
                            if (void 0 !== n[1]) {
                                var r, o, i = n[1].split("&");
                                for (o = 0; o < i.length; o++)
                                    r = i[o].split("="),
                                    t = t + "&" + r[0] + "=" + r[1]
                            }
                            return encodeURI(t)
                        }(u);
                        "vimeo" == n.type ? t = "https://player.vimeo.com/video/" : "youtube" == n.type && (t = "https://www.youtube.com/embed/"),
                        a.html('<iframe class="venoframe vbvid" webkitallowfullscreen mozallowfullscreen allowfullscreen frameborder="0" src="' + t + n.id + r + '"></iframe>'),
                        ie()
                    }
                    function re() {
                        a.html('<div class="vbox-inline">' + e(u).html() + "</div>"),
                        ie()
                    }
                    function oe() {
                        (D = a.find("img")).length ? D.each(function() {
                            e(this).one("load", function() {
                                ie()
                            })
                        }) : ie()
                    }
                    function ie() {
                        o.html(b),
                        a.find(">:first-child").addClass("figlio").css({
                            width: l,
                            height: d,
                            padding: i,
                            background: n
                        }),
                        e("img.figlio").on("dragstart", function(e) {
                            e.preventDefault()
                        }),
                        se(),
                        a.animate({
                            opacity: "1"
                        }, "slow", function() {})
                    }
                    function se() {
                        var t = a.outerHeight()
                          , n = e(window).height();
                        v = t + 60 < n ? (n - t) / 2 : "30px",
                        a.css("margin-top", v),
                        a.css("margin-bottom", v),
                        U.cb_post_resize()
                    }
                    "ontouchstart"in window ? (e(document).on("touchstart", J),
                    e(document).on("touchmove", J),
                    e(document).on("touchend", J)) : (e(document).on("mousedown", K),
                    e(document).on("mouseup", K),
                    e(document).on("mouseout", K),
                    e(document).on("mousemove", K)),
                    e(window).resize(function() {
                        e(".vbox-content").length && setTimeout(se(), 800)
                    })
                })
            }
        })
    }(t),
    n.prototype.closeIframeEvent = function() {
        var e = "attachEvent" == (window.addEventListener ? "addEventListener" : "attachEvent") ? "onmessage" : "message";
        (window.addEventListener ? window.removeEventListener : window.detachEvent)(e, function() {}, !1)
    }
    ,
    n.prototype.handleIframeEvent = function() {
        var e = this
          , n = window.addEventListener ? "addEventListener" : "attachEvent";
        (0,
        window[n])("attachEvent" == n ? "onmessage" : "message", function(n) {
            var r = n.message ? "message" : "data"
              , o = JSON.parse(n[r]);
            "close_iframe" === o.type ? (t("body > *").not("script").not(".vbox-overlay").css("filter", "none"),
            t(".vbox-close").click(),
            e.closeIframeEvent(),
            o.is_completed && o.success_url && (window.JAndroid && window.JAndroid.setUrl,
            window.location.href = o.success_url),
            console.log("calling didPopupClosed"),
            e.toFunction(e.option.didPopupClosed).apply(e, [o.is_completed, o.success_url, o.cancel_url]),
            t("#venobox-iframe-paytech").attr("href", "")) : "popup_ready" === o.type && t(".vbox-preloader").css("z-index", "0")
        }, !1)
    }
    ,
    "function" != typeof Object.assign && Object.defineProperty(Object, "assign", {
        value: function(e, t) {
            "use strict";
            if (null == e)
                throw new TypeError("Cannot convert undefined or null to object");
            for (var n = Object(e), r = 1; r < arguments.length; r++) {
                var o = arguments[r];
                if (null != o)
                    for (var i in o)
                        Object.prototype.hasOwnProperty.call(o, i) && (n[i] = o[i])
            }
            return n
        },
        writable: !0,
        configurable: !0
    }),
    n.prototype.withOption = function(e) {
        return this.option = {
            requestTokenUrl: e.requestTokenUrl || null,
            tokenUrl: e.tokenUrl || null,
            method: e.method || this.option.method,
            headers: e.headers || {},
            prensentationMode: e.prensentationMode || this.option.prensentationMode,
            didPopupClosed: e.didPopupClosed || this.option.didPopupClosed,
            willGetToken: e.willGetToken || this.option.willGetToken,
            didGetToken: e.didGetToken || this.option.didGetToken,
            didReceiveNonSuccessResponse: e.didReceiveNonSuccessResponse || this.option.didReceiveNonSuccessResponse,
            didReceiveError: e.didReceiveError || this.option.didReceiveError
        },
        this
    }
    ,
    n.prototype.toFunction = function(e) {
        return "function" == typeof e ? e : this.option.emptyFunction
    }
    ,
    n.prototype.error = function(e, t) {
        console.warn("une erreur c'est produit avec le message : ", t || '""'),
        console.log(e),
        n.REQUESTING_TOKEN = !1,
        this.toFunction(this.option.didReceiveError).apply(this, [e])
    }
    ,
    n.prototype.present = function(e, r) {
        if (this.option.prensentationMode === n.DO_NOTHING)
            console.warn("done !!!");
        else if (this.option.prensentationMode === n.OPEN_IN_NEW_TAB)
            window.open(e);
        else if (this.option.prensentationMode === n.OPEN_IN_SAME_TAB)
            window.location.href = e;
        else {
            var o = null;
            t('[name="theme-color"]').length && (o = t('[name="theme-color"]').attr("content")),
            t('[name="theme-color"]').remove(),
            t("head").prepend('<meta name="theme-color" content="#117b81" />'),
            n.POPUP_OPENED = !0;
            var i = this;
            if (0 === t("#venobox-iframe-paytech").length) {
                t("body").append('<a id="venobox-iframe-paytech" style="display: none !important;visibility: hidden !important;" class="venobox_custom" data-vbtype="iframe" href=""></a>')
            }
            function s() {
                console.log("do sum");
                var e = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                  , n = window.innerWidth > 450 ? 360 : window.innerWidth
                  , r = e ? window.innerHeight : 610;
                console.log(n),
                t(".venoframe").css({
                    width: n,
                    height: r,
                    "min-height": r,
                    border: "0"
                }).css("margin-top", "0px !important"),
                t(".vbox-content").css("height", "100%").css("margin-top", "0").css("margin-bottom", "0"),
                t(".vbox-container").css("overflow", "hidden"),
                t(".venoframe").center()
            }
            t("#venobox-iframe-paytech").attr("href", e).venobox({
                cb_pre_close: function(e, r, i, s) {
                    return n.POPUP_OPENED = !1,
                    t('[name="theme-color"]').remove(),
                    o && t("head").prepend('<meta name="theme-color" content="' + o + '" />'),
                    !0
                },
                overlayClose: !1
            }).trigger("click"),
            t(".vbox-overlay").css("background", "transparent"),
            t("body > *").not("script").not(".vbox-overlay").css("filter", "blur(5px)"),
            t(".vbox-preloader").css("z-index", "99"),
            t(window).resize(function() {
                s()
            }),
            setTimeout(function() {
                s(),
                i.handleIframeEvent()
            }, 500);
            var a, u, c = 15, l = setInterval(function() {
                c > 0 ? (s(),
                c--) : clearInterval(l)
            }, 250);
            void 0 !== document.hidden ? (a = "hidden",
            u = "visibilitychange") : void 0 !== document.msHidden ? (a = "msHidden",
            u = "msvisibilitychange") : void 0 !== document.webkitHidden && (a = "webkitHidden",
            u = "webkitvisibilitychange"),
            document.addEventListener(u, function() {
                document.hidden || document[a] || s()
            }, !1)
        }
    }
    ,
    n.prototype.serialize = function(e) {
        var t = [];
        for (var n in e)
            e.hasOwnProperty(n) && t.push(encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
        return t.join("&")
    }
    ,
    n.prototype.send = function(t) {
        if (!n.REQUESTING_TOKEN) {
            if (n.REQUESTING_TOKEN = !0,
            this.toFunction(this.option.willGetToken).apply(this, []),
            this.option.tokenUrl) {
                var r = String(this.option.tokenUrl)
                  , o = r.split("/").pop();
                return this.present(r, o),
                this.toFunction(this.option.didGetToken).apply(this, [o, r]),
                void (n.REQUESTING_TOKEN = !1)
            }
            var i = this.option.requestTokenUrl
              , s = {
                method: this.option.method.toUpperCase(),
                credentials: "same-origin"
            };
            "GET" === String(this.option.method).toUpperCase() || "HEAD" === String(this.option.method).toUpperCase() ? i += "?" + this.serialize(this.dataSentToServer) : (s.body = this.serialize(this.dataSentToServer),
            s.headers = Object.assign({
                "Content-Type": "application/x-www-form-urlencoded"
            }, this.option.headers));
            var a = this;
            return e.fetch(i, s).then(function(e) {
                return e.json()
            }, function(e) {
                a.error(e)
            }).then(function(e) {
                1 === e.success || !0 === e.success || "1" === e.success || "true" === e.success ? (a.present(e.redirect_url, e.token),
                a.toFunction(a.option.didGetToken).apply(a, [e.token, e.redirect_url]),
                n.REQUESTING_TOKEN = !1) : (n.REQUESTING_TOKEN = !1,
                a.toFunction(a.option.didReceiveNonSuccessResponse).apply(a, [e]))
            }, function(e) {
                a.error(e)
            }),
            this
        }
    }
    ,
    n.OPEN_IN_POPUP = 1,
    n.OPEN_IN_NEW_TAB = 2,
    n.OPEN_IN_SAME_TAB = 3,
    n.DO_NOTHING = 4,
    n.POPUP_OPENED = !1,
    n.REQUESTING_TOKEN = !1,
    e.PayTech = n,
    t('meta[name="viewport"]').replaceWith('<meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, target-densitydpi=device-dpi">')
}(this);
