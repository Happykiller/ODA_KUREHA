/* global er */
//# sourceURL=OdaApp.js
// Library of tools for the exemple
/**
 * @author FRO
 * @date 15/05/08
 */

(function() {
    'use strict';

    var
        /* version */
        VERSION = '0.1'
    ;
    
    ////////////////////////// PRIVATE METHODS ////////////////////////
    /**
     * @name _init
     * @desc Initialize
     */
    function _init() {
        $.Oda.Event.addListener({name : "oda-fully-loaded", callback : function(e){
            var listDepends = [
                {name: "depends" , ordered: false, "list" : [
                    { elt: $.Oda.Context.host + "/templates/templates.html", type: "html", target: function(data){
                        $("body").append(data);
                    }}
                ]}
            ];
            $.Oda.Loader.load({ depends: listDepends, functionFeedback: function(data){
                $.Oda.Log.debug("depends loading success.");
                $.Oda.App.startApp();
            }});
        }});
    }

    ////////////////////////// PUBLIC METHODS /////////////////////////
    $.Oda.App = {
        /* Version number */
        version: VERSION,
        Websocket:null,
        WebsocketMessageType:{
            NEW_CONNECTION: "NEW_CONNECTION",
            CLOSE_CONNECTION: "CLOSE_CONNECTION",
            NEW_MESSAGE: "NEW_MESSAGE",
            WEBRTC_OFFER: "WEBRTC_OFFER",
            WEBRTC_ANSWER: "WEBRTC_ANSWER",
            PING_CALL: "PING_CALL",
            PING_ANSWER: "PING_ANSWER"
        },
        avatarId:0,
        
        /**
         * @returns {$.Oda.App}
         */
        startApp: function() {
            try {
                $.Oda.Display.Polyfill.createHtmlElement({
                    name: "kureha-chat-notificaiton",
                    createdCallback: function(){
                        var $elt = $(this);
                        var message = $elt.attr("message");
                        var userCode = $elt.attr("userCode");
                        var urlAvatar = $.Oda.Context.rest+'vendor/happykiller/oda/resources/api/avatar/'+userCode+'?mili'+$.Oda.Tooling.getMilise();
                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template: "kureha-chat-notif",
                            scope: {
                                message: message,
                                userCode: userCode,
                                urlAvatar: urlAvatar,
                                time: $.Oda.Date.dateFormat(new Date(), "yyyy-mm-dd hh:mi:ss")
                            }
                        });
                        $elt.html(strHtml);
                    }
                });

                $.Oda.Display.Polyfill.createHtmlElement({
                    name: "kureha-chat-sent",
                    createdCallback: function(){
                        var $elt = $(this);
                        var message = $elt.attr("message");
                        var userCode = $elt.attr("userCode");
                        var urlAvatar = $.Oda.Context.rest+'vendor/happykiller/oda/resources/api/avatar/'+userCode+'?mili'+$.Oda.Tooling.getMilise();
                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template: "kureha-chat-sent",
                            scope: {
                                message: message,
                                userCode: userCode,
                                urlAvatar: urlAvatar,
                                time: $.Oda.Date.dateFormat(new Date(), "yyyy-mm-dd hh:mi:ss")
                            }
                        });
                        $elt.html(strHtml);
                    }
                });

                $.Oda.Display.Polyfill.createHtmlElement({
                    name: "kureha-chat-receive",
                    createdCallback: function(){
                        var $elt = $(this);
                        var message = $elt.attr("message");
                        var userCode = $elt.attr("userCode");
                        var urlAvatar = $.Oda.Context.rest+'vendor/happykiller/oda/resources/api/avatar/'+userCode+'?mili'+$.Oda.Tooling.getMilise();
                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template: "kureha-chat-receive",
                            scope: {
                                message: message,
                                userCode: userCode,
                                urlAvatar: urlAvatar,
                                time: $.Oda.Date.dateFormat(new Date(), "yyyy-mm-dd hh:mi:ss")
                            }
                        });
                        $elt.html(strHtml);
                    }
                });

                $.Oda.Router.addRoute("home", {
                    path: "partials/home.html",
                    title: "home.title",
                    urls: ["","home"],
                    middleWares:["support","auth"]
                });

                $.Oda.Router.startRooter();

                return this;
            } catch (er) {
                $.Oda.Log.error("$.Oda.App.startApp: " + er.message);
                return null;
            }
        },

        Controller: {
            Home: {
                peerInitiator: null,
                peerReceiver: null,
                receiverId: 0,
                presents:[],
                stream: null,
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                start: function() {
                    try {
                        navigator.getUserMedia = ( navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia)
                        ;

                        $.Oda.App.Websocket = $.Oda.Websocket.connect($.Oda.Context.Websocket);

                        $.Oda.App.Websocket.onConnect = function(e) { 
                            $.Oda.App.Websocket.send({
                                messageType: $.Oda.App.WebsocketMessageType.NEW_CONNECTION,
                                userCode: $.Oda.Session.code_user,
                                userId: $.Oda.Session.id
                            });
                            $.Oda.App.Controller.Home.pingAll();
                        };

                        $.Oda.App.Websocket.onMessage = function(e) { 
                            $.Oda.Log.debug("New message => type:" + e.data.messageType + ", from:" + e.data.userCode);
                            switch(e.data.messageType) {
                                case $.Oda.App.WebsocketMessageType.NEW_CONNECTION:
                                    $.Oda.App.Controller.Home.addPresent({userCode: e.data.userCode});
                                    break;
                                case $.Oda.App.WebsocketMessageType.CLOSE_CONNECTION:
                                    $.Oda.App.Controller.Home.presentRemove({userCode: e.data.userCode});
                                    break;
                                case $.Oda.App.WebsocketMessageType.NEW_MESSAGE:
                                    $("#chat").append('<kureha-chat-receive message="'+e.data.message+'" userCode="'+e.data.userCode+'"></kureha-chat-receive>');
                                    break;
                                case $.Oda.App.WebsocketMessageType.PING_CALL:
                                    $.Oda.App.Websocket.send({
                                        messageType: $.Oda.App.WebsocketMessageType.PING_ANSWER,
                                        userCode: $.Oda.Session.code_user,
                                        userId: $.Oda.Session.id,
                                        userFromCode: e.data.userCode,
                                        userFromId: e.data.userId
                                    });
                                    break;
                                case $.Oda.App.WebsocketMessageType.PING_ANSWER:
                                    if(e.data.userFromCode === $.Oda.Session.code_user){
                                        $.Oda.App.Controller.Home.addPresent({userCode: e.data.userCode});
                                    }
                                    break;
                                case $.Oda.App.WebsocketMessageType.WEBRTC_OFFER:
                                    $.Oda.App.Controller.Home.peerReceiver.signal(e.data.offer);
                                    $('#dialBt-'+e.data.userCode).html('');
                                    $.Oda.App.Controller.Home.receiverId++;
                                    var strHtmlReceiver = $.Oda.Display.TemplateHtml.create({
                                        template: "tpl-receiver",
                                        scope: {
                                            id: $.Oda.App.Controller.Home.receiverId,
                                            userCode: e.data.userCode
                                        }
                                    });
                                    $('#receivers').append(strHtmlReceiver);
                                    break;
                                case $.Oda.App.WebsocketMessageType.WEBRTC_ANSWER:
                                    $.Oda.App.Controller.Home.peerInitiator.signal(e.data.answer);
                                    break;
                                default:
                                    ;
                            }
                            $("#chat").scrollTop($("#chat")[0].scrollHeight);
                        };

                        $.Oda.Scope.Gardian.add({
                            id : "gardianMessage",
                            listElt : ["message"],
                            function : function(e){
                                if( ($("#message").data("isOk")) ){
                                    $("#submit").btEnable();
                                }else{
                                    $("#submit").btDisable();
                                }
                            }
                        });

                        $.Oda.App.Controller.Home.startPeerReceiver();

                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.start: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                sent: function() {
                    try {
                        var message = $("#message").val();
                        $("#chat").append('<kureha-chat-sent message="'+message+'" userCode="'+$.Oda.Session.code_user+'"></kureha-chat-sent>');
                        $("#chat").scrollTop($("#chat")[0].scrollHeight);
                        $.Oda.App.Websocket.send({
                            messageType: $.Oda.App.WebsocketMessageType.NEW_MESSAGE,
                            userCode: $.Oda.Session.code_user,
                            userId: $.Oda.Session.id,
                            message: message
                        });
                        $("#message").val("");
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.sent: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                addPresent: function(p) {
                    try {
                        $.Oda.App.Controller.Home.presents.push(p.userCode)
                        var urlAvatar = $.Oda.Context.rest+'vendor/happykiller/oda/resources/api/avatar/'+p.userCode+'?mili'+$.Oda.Tooling.getMilise();
                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template: "tpl-present",
                            scope: {
                                userCode: p.userCode,
                                urlAvatar: urlAvatar
                            }
                        });
                        $('#presents').append(strHtml);
                        $("#chat").append('<kureha-chat-notificaiton message="New user: '+p.userCode+'" userCode="'+p.userCode+'"></kureha-chat-notificaiton>');
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.addPresent: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                presentRemove: function(p) {
                    try {
                        for(var index in $.Oda.App.Controller.Home.presents){
                            var elt = $.Oda.App.Controller.Home.presents[index];
                            if(elt === p.userCode){
                                $.Oda.App.Controller.Home.presents.splice(index, 1);
                            }
                        }
                        $('#present-'+p.userCode).remove();
                        $('#receiver-'+p.userCode).remove();
                        $("#chat").append('<kureha-chat-notificaiton message="User left: '+p.userCode+'" userCode="'+p.userCode+'"></kureha-chat-notificaiton>');
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.presentRemove: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                startPeerReceiver: function() {
                    try {
                        navigator.getUserMedia({
                            video: true,
                            audio: { facingMode: "user" }
                        }, function(stream){
                            $.Oda.App.Controller.Home.stream = stream;
                            var video = document.querySelector('#emitter-video');
                            video.srcObject = $.Oda.App.Controller.Home.stream;
                            video.volume = 0;
                            video.play();
                            
                            $.Oda.App.Controller.Home.peerReceiver = new SimplePeer({
                                initiator: false,
                                stream: $.Oda.App.Controller.Home.stream,
                                trickle: true
                            })
                            $.Oda.App.Controller.Home.bindEvents($.Oda.App.Controller.Home.peerReceiver);
                            $.Oda.App.Controller.Home.peerReceiver.on('signal', function(data){
                                if(data.type === "answer"){
                                    $.Oda.App.Websocket.send({
                                        messageType: $.Oda.App.WebsocketMessageType.WEBRTC_ANSWER,
                                        userCode: $.Oda.Session.code_user,
                                        userId: $.Oda.Session.id,
                                        answer: data
                                    });
                                }
                            });
                        }, function(){});
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.startPeerReceiver: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                call: function(p) {
                    try {
                        $.Oda.App.Controller.Home.peerInitiator = new SimplePeer({
                            initiator: true,
                            stream: $.Oda.App.Controller.Home.stream,
                            trickle: false
                        })
                        $.Oda.App.Controller.Home.bindEvents($.Oda.App.Controller.Home.peerInitiator);
                        $('#dialBt-'+p.userCode).html('');
                        $.Oda.App.Controller.Home.receiverId++;
                        var strHtmlReceiver = $.Oda.Display.TemplateHtml.create({
                            template: "tpl-receiver",
                            scope: {
                                id: $.Oda.App.Controller.Home.receiverId,
                                userCode: p.userCode
                            }
                        });
                        $('#receivers').append(strHtmlReceiver);
                        $.Oda.App.Controller.Home.peerInitiator.on('signal', function(data){
                            if(data.type === "offer"){
                                $.Oda.App.Websocket.send({
                                    messageType: $.Oda.App.WebsocketMessageType.WEBRTC_OFFER,
                                    userCode: $.Oda.Session.code_user,
                                    userId: $.Oda.Session.id,
                                    userTargetCode: p.userCode,
                                    offer: data
                                });
                            }
                        });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.call: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                pingAll: function() {
                    try {
                        $.Oda.App.Websocket.send({
                            messageType: $.Oda.App.WebsocketMessageType.PING_CALL,
                            userCode: $.Oda.Session.code_user,
                            userId: $.Oda.Session.id
                        });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.pingAll: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                bindEvents: function (p) {
                    try {
                        p.on('error', function(data){
                            console.log('error peer', data);
                        });
                        
                        p.on('stream', function(stream){
                            var strHtmlReceiver = $.Oda.Display.TemplateHtml.create({
                                template: "tpl-receiver-video",
                                scope: {
                                    id: $.Oda.App.Controller.Home.receiverId
                                }
                            });
                             $("#div-receiver-video-"+$.Oda.App.Controller.Home.receiverId).html(strHtmlReceiver);
                            var video = document.querySelector('#receiver-video-'+$.Oda.App.Controller.Home.receiverId);
                            video.srcObject = stream;
                            video.volume = 0;
                            video.play();
                        });

                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.bindEvents: " + er.message);
                        return null;
                    }
                }
            }
        }
    };

    // Initialize
    _init();

})();
