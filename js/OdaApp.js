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
                    { elt: $.Oda.Context.host + "templates/templates.html", type: "html", target: function(data){
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
        Websocket: null,
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
                navigator.getUserMedia = ( navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia)
                ;

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
                presents:{},
                stream: null,
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                start: function() {
                    try {
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
                                //NEW_CONNECTION
                                case $.Oda.App.WebsocketMessageType.NEW_CONNECTION:
                                    $.Oda.App.Controller.Home.addPresent({userCode: e.data.userCode});
                                    break;
                                //CLOSE_CONNECTION
                                case $.Oda.App.WebsocketMessageType.CLOSE_CONNECTION:
                                    $.Oda.App.Controller.Home.presentRemove({userCode: e.data.userCode});
                                    break;
                                //NEW_MESSAGE
                                case $.Oda.App.WebsocketMessageType.NEW_MESSAGE:
                                    $("#chat").append('<kureha-chat-receive message="'+e.data.message+'" userCode="'+e.data.userCode+'"></kureha-chat-receive>');
                                    $("#chat").scrollTop($("#chat")[0].scrollHeight);
                                    break;
                                //PING_CALL
                                case $.Oda.App.WebsocketMessageType.PING_CALL:
                                    $.Oda.App.Websocket.send({
                                        messageType: $.Oda.App.WebsocketMessageType.PING_ANSWER,
                                        userCode: $.Oda.Session.code_user,
                                        userId: $.Oda.Session.id,
                                        userFromCode: e.data.userCode,
                                        userFromId: e.data.userId
                                    });
                                    break;
                                //PING_ANSWER
                                case $.Oda.App.WebsocketMessageType.PING_ANSWER:
                                    if(e.data.userFromCode === $.Oda.Session.code_user){
                                        $.Oda.App.Controller.Home.addPresent({userCode: e.data.userCode});
                                    }
                                    break;
                                //WEBRTC_OFFER
                                case $.Oda.App.WebsocketMessageType.WEBRTC_OFFER:
                                    if(e.data.userTargetCode === $.Oda.Session.code_user){
                                        $.Oda.App.Controller.Home.createPeer({
                                            initiator: false,
                                            userCode: e.data.userCode
                                        });
                                        $.Oda.App.Controller.Home.presents[e.data.userCode].peer.signal(e.data.offer);
                                    }
                                    break;
                                //WEBRTC_ANSWER
                                case $.Oda.App.WebsocketMessageType.WEBRTC_ANSWER:
                                    if(e.data.userTargetCode === $.Oda.Session.code_user){
                                        $.Oda.App.Controller.Home.presents[e.data.userCode].peer.signal(e.data.answer);
                                    }
                                    break;
                            }
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

                        $.Oda.App.Controller.Home.startVideo();

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
                addPresent: function(p) {
                    try {
                        if(!$.Oda.App.Controller.Home.presentCheck({userCode: p.userCode})){
                            $.Oda.App.Controller.Home.presents[p.userCode] = {
                                userCode: p.userCode,
                                peer: null
                            }
                        }
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
                        $("#chat").scrollTop($("#chat")[0].scrollHeight);
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
                        $.Oda.App.Controller.Home.endCall({userCode : p.userCode});
                        delete $.Oda.App.Controller.Home.presents[p.userCode];
                        $('#present-'+p.userCode).remove();
                        $("#chat").append('<kureha-chat-notificaiton message="User left: '+p.userCode+'" userCode="'+p.userCode+'"></kureha-chat-notificaiton>');
                        $("#chat").scrollTop($("#chat")[0].scrollHeight);
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.presentRemove: " + er.message);
                        return null;
                    }
                },
                /**
                 * 
                 * @returns {$.Oda.App.Controller.Home}
                 */
                presentCheck: function(p) {
                    try {
                        for(var key in $.Oda.App.Controller.Home.presents){
                            if(p.userCode === key){
                                return true;
                            }
                        }
                        return false;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.presentCheck: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                startVideo: function() {
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
                        $.Oda.App.Controller.Home.createPeer({
                            initiator: true,
                            userCode: p.userCode
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
                endCall: function(p) {
                    try {
                        if($.Oda.App.Controller.Home.presents[p.userCode].peer && ($.Oda.App.Controller.Home.presents[p.userCode].peer.destroy()));
                        $('#receiver-'+p.userCode).remove();
                        $('#dialBt-' + p.userCode).html('<oda-btn oda-btn-name="start-' + p.userCode + '" oda-btn-style="primary" oda-btn-icon-before="earphone" oda-btn-click="$.Oda.App.Controller.Home.call({userCode:\'' + p.userCode + '\'});">Appeler</oda-btn>');
                        return null;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.endCall: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                createPeer: function(p) {
                    try {
                        $('#dialBt-' + p.userCode).html('<oda-btn oda-btn-name="end-' + p.userCode + '" oda-btn-style="primary" oda-btn-icon-before="earphone" oda-btn-click="$.Oda.App.Controller.Home.endCall({userCode:\'' + p.userCode + '\'});">Racrocher</oda-btn>');
                        var strHtmlReceiver = $.Oda.Display.TemplateHtml.create({
                            template: "tpl-receiver",
                            scope: {
                                userCode: p.userCode
                            }
                        });
                        $('#receivers').append(strHtmlReceiver);
                        $.Oda.App.Controller.Home.presents[p.userCode].peer = new SimplePeer({
                            initiator: p.initiator,
                            stream: $.Oda.App.Controller.Home.stream,
                            config: $.Oda.Context.PeerConfig,
                            trickle: false
                        });
                        $.Oda.App.Controller.Home.bindEvents($.Oda.App.Controller.Home.presents[p.userCode].peer);
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.createPeer: " + er.message);
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

                        p.on('signal', function(data){
                            var user = $.Oda.App.Controller.Home.searchPresentByChannelName({channelName: p.channelName});
                            if(data.type === "answer"){
                                $.Oda.App.Websocket.send({
                                    messageType: $.Oda.App.WebsocketMessageType.WEBRTC_ANSWER,
                                    userCode: $.Oda.Session.code_user,
                                    userId: $.Oda.Session.id,
                                    userTargetCode: user.userCode,
                                    answer: data
                                });
                            }else if(data.type === "offer"){
                                $.Oda.App.Websocket.send({
                                    messageType: $.Oda.App.WebsocketMessageType.WEBRTC_OFFER,
                                    userCode: $.Oda.Session.code_user,
                                    userId: $.Oda.Session.id,
                                    userTargetCode: user.userCode,
                                    offer: data
                                });
                            }
                        });

                        p.on('close', function(){
                            var user = $.Oda.App.Controller.Home.searchPresentByChannelName({channelName: p.channelName});
                            $.Oda.App.Controller.Home.endCall({userCode: user.userCode});
                        });
                        
                        p.on('stream', function(stream){
                            var user = $.Oda.App.Controller.Home.searchPresentByChannelName({channelName: p.channelName});
                            var strHtmlReceiver = $.Oda.Display.TemplateHtml.create({
                                template: "tpl-receiver-video",
                                scope: {
                                    userCode: user.userCode
                                }
                            });
                             $("#div-receiver-video-" + user.userCode).html(strHtmlReceiver);
                            var video = document.querySelector('#receiver-video-' + user.userCode);
                            video.srcObject = stream;
                            video.volume = 0;
                            video.play();
                        });

                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.bindEvents: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                searchPresentByChannelName: function(p) {
                    try {
                        for(var key in $.Oda.App.Controller.Home.presents){
                            var present = $.Oda.App.Controller.Home.presents[key];
                            if(present.peer && (present.peer.channelName === p.channelName)){
                                return present;
                            }
                        }
                        return null;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.searchPresentByChannelName: " + er.message);
                        return null;
                    }
                }
            }
        }
    };

    // Initialize
    _init();

})();
