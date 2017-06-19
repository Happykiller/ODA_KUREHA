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
                $.Oda.Log.trace("depends loading success.");
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
            NEW_MESSAGE: "NEW_MESSAGE"
        },
        avatarId:0,
        
        /**
         * @returns {$.Oda.App}
         */
        startApp: function () {
            try {
                $.Oda.Display.Polyfill.createHtmlElement({
                    name: "kureha-chat-notificaiton",
                    createdCallback: function(){
                        var $elt = $(this);
                        var message = $elt.attr("message");
                        var userCode = $elt.attr("userCode");
                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template: "kureha-chat-notif",
                            scope: {
                                message: message,
                                userCode: userCode
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
                                urlAvatar: urlAvatar
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
                                urlAvatar: urlAvatar
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

                $.Oda.App.Websocket = $.Oda.Websocket.connect($.Oda.Context.Websocket);

                $.Oda.App.Websocket.onConnect = function(e) { 
                    $.Oda.App.Websocket.send({
                        messageType: $.Oda.App.WebsocketMessageType.NEW_CONNECTION,
                        userCode: $.Oda.Session.code_user,
                        userId: $.Oda.Session.id
                    });
                };

                $.Oda.App.Websocket.onMessage = function(e) { 
                    $.Oda.Log.debug("New message => type:" + e.data.messageType + ", from:" + e.data.userCode);
                    switch(e.data.messageType) {
                        case $.Oda.App.WebsocketMessageType.NEW_CONNECTION:
                            $("#chat").append('<kureha-chat-notificaiton message="New user: '+e.data.userCode+'" userCode="'+e.data.userCode+'"></kureha-chat-notificaiton>');
                            break;
                        case $.Oda.App.WebsocketMessageType.CLOSE_CONNECTION:
                            $("#chat").append('<kureha-chat-notificaiton message="User left: '+e.data.userCode+'" userCode="'+e.data.userCode+'"></kureha-chat-notificaiton>');
                            break;
                        case $.Oda.App.WebsocketMessageType.NEW_MESSAGE:
                            $("#chat").append('<kureha-chat-receive message="'+e.data.message+'" userCode="'+e.data.userCode+'"></kureha-chat-receive>');
                            break;
                        default:
                            ;
                    }
                    $("#chat").scrollTop($("#chat")[0].scrollHeight);
                };

                return this;
            } catch (er) {
                $.Oda.Log.error("$.Oda.App.startApp: " + er.message);
                return null;
            }
        },

        Controller: {
            Home: {
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                start: function () {
                    try {
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
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.start: " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                sent: function () {
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
                }
            }
        }
    };

    // Initialize
    _init();

})();
