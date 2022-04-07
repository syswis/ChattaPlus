/*///////////////////////////////////////////////////
///    Licensed under the BSD 3-Clause license   ///
///////////////////////////////////////////////////
///            (c) 2022 schiatta.it            ///
/////////////////////////////////////////////////
///              Chatta+ by WiS              ///
/////////////////////////////////////////////*/

'use strict';

import { mungeSDPPlay, mungeSDPPublish } from './lib/WowzaMungeSDP.js';
import WowzaPeerConnectionPublish from './lib/WowzaPeerConnectionPublish.js';
import WowzaPeerConnectionPlay from './lib/WowzaPeerConnectionPlay.js';

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

window.ChattaPlus = {
    _appPrefix: 'sch',
    _v: '0.2.6',
    Settings: {
        data: {
            capsFilter: false,
            mediaMaxWidth: 320,
            bigYoutubePlayerWidth: 480,
            bigYoutubePlayer: false,
            fixedPublisherWindow: false,
            maxVocalRecordTime: 60,
            stereoAudio: false,
            stream: {
                videoDeviceId: null,
                audioDeviceId: null
            },
            vocal: {
                audioDeviceId: null
            }
        },
        UI: {
            settingsWindowWrapper: null,
            settingsTabs: null,
            settingsPanels: null,
            selectedPanel: "devices",
            streamWebcamSelector: null,
            streamMicrophoneSelector: null,
            vocalMicrophoneSelector: null,
            Init: () => {
                var newSetting = (dataLabel, infoText, checkboxId, checked, disabled, callback) => {
                    var optionWrapper = $("<div/>")
                        .addClass('sch_optionWrapper')
                        .attr('data-label', dataLabel);
                    var info = $("<span/>").addClass("sch_info").attr("data-text", infoText);
                    var checkbox = $("<input>").addClass("toggle-switch")
                        .attr("id", checkboxId)
                        .attr("type", "checkbox");
                    
                    checkbox.attr("checked", checked);
                    checkbox.attr("disabled", disabled);

                    var toggle = $("<label/>").addClass("toggle-switch").attr("for", checkboxId);
                    optionWrapper.append(info);
                    optionWrapper.append(checkbox);
                    optionWrapper.append(toggle);
                    checkbox.on('change', function(){
                        var state = $(this).is(':checked') ? true : false;
                        console.log("state: "+ state);
                        if (typeof callback === 'function') {
                            callback(state);
                        }
                    });
                    return optionWrapper;
                }

                if($(".chat-settings").children().length < 1){
                    setTimeout(ChattaPlus.Settings.UI.Init, 250);
                    return;
                }

                ChattaPlus.Settings.UI.settingsWindowWrapper = $("<div/>").addClass("sch_settingsWindowWrapper");

                // Settings Window
                var sch_settingsWindow = $("<div/>").addClass("sch_settingsWindow").appendTo(ChattaPlus.Settings.UI.settingsWindowWrapper);
                $("<div/>").addClass("sch_logoSmall").appendTo(sch_settingsWindow).attr("data-version", "v"+ChattaPlus._v);
                var selectPanel = (tab_panel) => {
                ChattaPlus.Settings.UI.settingsTabs.each((index, el) => {
                    var tab = $(el);
                    if (tab_panel == tab.attr("data-panel")) {
                    tab.addClass("_selected");
                    } else {
                    tab.removeClass("_selected");
                    }
                });
        
                ChattaPlus.Settings.UI.settingsPanels.children('div.sch_panel').each((index, el) => {
                    var panel_element = $(el);
                    panel_element.removeClass("_selected");
                    if (tab_panel === panel_element.attr("data-panel")) {
                    panel_element.addClass("_selected");
                    }
                });
                }

                // Close button
                var closeSettingsWindowButton = $("<div/>")
                .addClass('sch_closeSettingsWindowButton')
                .on('click', () => {
                    ChattaPlus.Settings.UI.HideSettings();
                });

                closeSettingsWindowButton.appendTo(sch_settingsWindow);

                // Settings Tabs
                ChattaPlus.Settings.UI.settingsTabs = $("<div/>").addClass("sch_tabs")
                .append($("<span/>").addClass("sch_tab").attr("data-tab", "dispositivi").attr("data-panel", "devices"))
                .append($("<span/>").addClass("sch_tab").attr("data-tab", "altre impostazioni").attr("data-panel", "other"))
                .append($("<span/>").addClass("sch_tab").attr("data-tab", "about").attr("data-panel", "about"))
                .appendTo(sch_settingsWindow)
                .children('span').each((index, el) => {
                    var tab = $(el);
                    var tab_panel = tab.attr("data-panel");
                    tab.on('click', () => {
                    selectPanel(tab_panel);
                    });
                });

                // Panels
                ChattaPlus.Settings.UI.settingsPanels = $("<div/>").addClass("sch_panels");
                ChattaPlus.Settings.UI.devices = $("<div/>").addClass("sch_panel _selected").attr("data-panel", "devices");
                ChattaPlus.Settings.UI.other = $("<div/>").addClass("sch_panel").attr("data-panel", "other");
                ChattaPlus.Settings.UI.about = $("<div/>").addClass("sch_panel").attr("data-panel", "about");
        
                // Devices panel
                var streamSettings = $("<div/>").addClass("settingsContainer streamSettings").attr("data-title", "Streaming");
                var vocalSettings = $("<div/>").addClass("settingsContainer vocalSettings").attr("data-title", "Messaggi Vocali");
        
                var streamWebcamOptionWrapper = $("<div/>")
                .addClass('sch_optionWrapper')
                .attr('data-label', 'Webcam:');
        
                var streamMicrophoneOptionWrapper = $("<div/>")
                .addClass('sch_optionWrapper')
                .attr('data-label', 'Microfono:');
        
                var vocalMicrophoneOptionWrapper = $("<div/>")
                .addClass('sch_optionWrapper')
                .attr('data-label', 'Microfono:');
        
                ChattaPlus.Settings.UI.streamWebcamSelector = $('<select/>')
                .append($('<option/>').text('Seleziona webcam..'))
                .on('change', (evt) => {
                    ChattaPlus.WebRTC.Publisher.setDevice('videoinput', evt.target.value, ChattaPlus.Settings.SaveSettings);
                });
        
                ChattaPlus.Settings.UI.streamMicrophoneSelector = $('<select/>')
                .append($('<option/>').text('Seleziona microfono..'))
                .on('change', (evt) => {
                    ChattaPlus.WebRTC.Publisher.setDevice('audioinput', evt.target.value, ChattaPlus.Settings.SaveSettings);
                });
        
                ChattaPlus.Settings.UI.vocalMicrophoneSelector = $('<select/>')
                .append($('<option/>').text('Seleziona microfono..'))
                .on('change', (evt) => {
                    ChattaPlus.WebRTC.Vocal.setDevice(evt.target.value, ChattaPlus.Settings.SaveSettings);
                });
        
                streamWebcamOptionWrapper.append(ChattaPlus.Settings.UI.streamWebcamSelector);
                streamMicrophoneOptionWrapper.append(ChattaPlus.Settings.UI.streamMicrophoneSelector);
                vocalMicrophoneOptionWrapper.append(ChattaPlus.Settings.UI.vocalMicrophoneSelector);
        
                streamSettings.append(streamWebcamOptionWrapper);
                streamSettings.append(streamMicrophoneOptionWrapper);
                vocalSettings.append(vocalMicrophoneOptionWrapper);
        
                ChattaPlus.Settings.UI.devices.append(streamSettings);
                ChattaPlus.Settings.UI.devices.append(vocalSettings);

                // Other panel
                var otherSettings = $("<div/>").addClass("settingsContainer otherSettings");
        
                newSetting("filtro caps:", "I messaggi contenenti molte lettere maiuscole, saranno trasformati in minuscolo", "sch_anticaps", ChattaPlus.Settings.data.capsFilter, false,
                (state) => {
                    ChattaPlus.Settings.data.capsFilter = state;
                    ChattaPlus.Settings.SaveSettings();
                }).appendTo(otherSettings);
                newSetting("Player youtube grande", "Aumenta le dimensioni dei video YouTube", "sch_bigyoutubeplayer", ChattaPlus.Settings.data.bigYoutubePlayer, false,
                (state) => {
                    ChattaPlus.Settings.data.bigYoutubePlayer = state;
                    ChattaPlus.Settings.SaveSettings();
                }).appendTo(otherSettings);

                newSetting("cancellazione echo: ", "Abilita la cancellazione dell'echo (può ridurre la qualità di registrazione)", "sch_echoCancellation", ChattaPlus.Settings.data.echoCancellation, false,
                (state) => {
                    ChattaPlus.Settings.data.echoCancellation = state;
                    ChattaPlus.WebRTC.Vocal.setDevice(null, ChattaPlus.Settings.SaveSettings);
                    $("#sch_stereoAudio").attr("disabled", state);
                }).appendTo(otherSettings);
                newSetting("audio stereo: ", "Registra audio stereo (quando disponibile)", "sch_stereoAudio", ChattaPlus.Settings.data.stereoAudio, ChattaPlus.Settings.data.echoCancellation,
                (state) => {
                    ChattaPlus.Settings.data.stereoAudio = state;
                    ChattaPlus.WebRTC.Vocal.setDevice(null, ChattaPlus.Settings.SaveSettings);
                }).appendTo(otherSettings);

                ChattaPlus.Settings.UI.other.append(otherSettings);
        
                // About panel

                var showBTCAddress = () => {
                ChattaPlus.Settings.BTCAddress.toggle();
                }
        
                ChattaPlus.Settings.UI.about.append(
                $("<div/>").append(
                    $("<p>")
                    .text("Questa estensione è stata sviluppata da ")
                    .append(
                    $("<a/>").addClass("link")
                    .attr("href", "https://www.chatta.it/community/ashortfallofgravitas/default.aspx")
                    .attr("target", "_blank")
                    .attr("rel", "noopener noreferrer")
                    .text("@AShortfallofGravitas")
                    )
                )
                );
                ChattaPlus.Settings.UI.about.append(
                $("<div/>").append(
                    $("<p>").append(
                    $("<span/>").text("Apprezzi il mio lavoro?"),
                    $("<span/>").text("Offrimi una birra!")
                    )
                )
                );
                ChattaPlus.Settings.UI.about.append(
                $("<div/>").append(
                    $("<p>").append(
                    $("<a/>").addClass("sch_donate paypal")
                    .attr("href", "https://www.paypal.com/donate/?hosted_button_id=A7PUH7X6WNVGL")
                    .attr("target", "_blank")
                    .attr("rel", "noopener noreferrer"),
                    $("<span/>").addClass("sch_donate btc")
                    .on('click', showBTCAddress),
                    ChattaPlus.Settings.BTCAddress = $("<div/>").addClass("btc_address").append($("<span/>").text("1MBjRHQKn2iEQmGcMMznbm3DToteE9Sbpt").attr("data-text", "BTC Address:"))
                    )
                )
                );
                ChattaPlus.Settings.UI.about.append(
                $("<div/>").append(
                    $("<p>").text("Questa estensione è gratuita e sempre lo sarà!"),
                    $("<p>").text("Tutte le donazioni saranno utilizzate per il mantenimento e l'upgrade del server")
                )
                );
        
                ChattaPlus.Settings.UI.settingsPanels
                .append(ChattaPlus.Settings.UI.devices)
                .append(ChattaPlus.Settings.UI.other)
                .append(ChattaPlus.Settings.UI.about);
        
                ChattaPlus.Settings.UI.settingsPanels.appendTo(sch_settingsWindow);
                sch_settingsWindow.appendTo(ChattaPlus.Settings.UI.settingsWindowWrapper);
                ChattaPlus.Settings.UI.settingsWindowWrapper.hide().appendTo($("body"));

                $("<div>").addClass("chat-settings-item sch_settingsButtonContainer")
                .html('<label class="text" for="chat-settings-ChattaPlus">Impostazioni Chatta+</label>')
                .append($("<span/>").addClass("sch_settingsButton").attr("data-text", "Apri impostazioni"))
                .on("click", ChattaPlus.Settings.UI.ShowSettings)
                .appendTo($('.chat-settings'));

                selectPanel(ChattaPlus.Settings.UI.selectedPanel);
            },
            ShowSettings: () => {
                ChattaPlus.Settings.UI.settingsWindowWrapper.stop(true,true).fadeIn(250);
                ChattaPlus.Settings.startWebRTC();
            },
            HideSettings: () => {
                ChattaPlus.Settings.UI.settingsWindowWrapper.stop(true,true).fadeOut(250);
            }
        },
        LoadSettings: () => {
            var key = ChattaPlus._appPrefix + '_settings';
            ChattaPlus.Settings.data = ChattaPlus.Utils.LocalStorage.Read(key) || ChattaPlus.Settings.data;
    
            if(ChattaPlus.Settings.data.stream.videoDeviceId != null){
                ChattaPlus.WebRTC.Publisher.constraints.video.deviceId = ChattaPlus.Settings.data.stream.videoDeviceId;
            }
    
            if(ChattaPlus.Settings.data.stream.audioDeviceId != null){
                ChattaPlus.WebRTC.Publisher.constraints.audio.deviceId = ChattaPlus.Settings.data.stream.audioDeviceId;
            }
    
            if(ChattaPlus.Settings.data.vocal.audioDeviceId != null){
                ChattaPlus.WebRTC.Vocal.constraints.audio.deviceId = ChattaPlus.Settings.data.vocal.audioDeviceId;
            }
        },
        SaveSettings: () => {
            var key = ChattaPlus._appPrefix + '_settings';
            ChattaPlus.Utils.LocalStorage.Save(key, ChattaPlus.Settings.data);
        },
        startWebRTC: () => {
            if(navigator.mediaDevices.getUserMedia)
            {
                navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(ChattaPlus.Settings.onGetUserMediaSuccess).catch(ChattaPlus.Settings.onGetMediaError);
                ChattaPlus.WebRTC.Publisher.newAPI = true;
            }
            else if (navigator.getUserMedia)
            {
                navigator.getUserMedia({video:true,audio:true}, ChattaPlus.Settings.onGetUserMediaSuccess, ChattaPlus.Settings.onGetMediaError);
            }
            else
            {
                alert('Il tuo browser non supporta WebRTC, oppure è disabilitato.');
            }
        },
        onGetUserMediaSuccess: (stream) => {
            ChattaPlus.Settings.getMediaDevices()
            .then(ChattaPlus.Settings.onGetMediaDevices);
        },
        onGetMediaError: (e) => {
            console.log('ChattaPlus: getMediaError');
            console.log(e);
        },
        getMediaDevices: () => {
            return navigator.mediaDevices.enumerateDevices();
        },
        onGetMediaDevices: (mediaDevices) => {
            let count = 1;
            ChattaPlus.Settings.UI.streamWebcamSelector.find('option').remove();
            ChattaPlus.Settings.UI.streamMicrophoneSelector.find('option').remove();

            ChattaPlus.Settings.UI.vocalMicrophoneSelector.find('option').remove();
            mediaDevices.forEach(mediaDevice => {
                var label = mediaDevice.label || `Camera ${count++}`;
                var option = $("<option>")
                .val(mediaDevice.deviceId)
                .text(label);

                if (mediaDevice.kind === 'videoinput') {
                    //Stream Webcam
                    if(mediaDevice.deviceId == ChattaPlus.Settings.data.stream.videoDeviceId){
                        option.attr('selected','selected'); 
                    }
                    ChattaPlus.Settings.UI.streamWebcamSelector.append(option);
                }else if(mediaDevice.kind === 'audioinput'){
                    //Stream microphone
                    if(mediaDevice.deviceId == ChattaPlus.Settings.data.stream.audioDeviceId){
                        option.attr('selected','selected'); 
                    }
                    ChattaPlus.Settings.UI.streamMicrophoneSelector.append(option);
                }
            });
            mediaDevices.forEach(mediaDevice => {
                var label = mediaDevice.label || `Microfono ${count++}`;
                var option = $("<option>")
                .val(mediaDevice.deviceId)
                .text(label);

                if(mediaDevice.kind === 'audioinput'){
                    //Vocal Microphone
                    if(mediaDevice.deviceId == ChattaPlus.Settings.data.vocal.audioDeviceId){
                        option.attr('selected','selected'); 
                    }
                    ChattaPlus.Settings.UI.vocalMicrophoneSelector.append(option);
                }
            });
        },
        stopMediaAccess: () => {

        }
    },
    Init: () => {
        if (typeof Chat == 'undefined') {
            setTimeout(ChattaPlus.Init, 50);
            return;
        } else {
            ChattaPlus.overrideChatMethods();
            ChattaPlus.Settings.LoadSettings();

            ChattaPlus.WebRTC.Vocal.UI.Init();

            if(ChattaPlus.Settings.data.fixedPublisherWindow) {
                ChattaPlus.WebRTC.Publisher.UI.Init();
            }

            ChattaPlus.Settings.UI.Init();
            console.log('Chatta+: Ready!');
        }
    },
    overrideChatMethods: () => {
        Chat.mediaMaxWidth = ChattaPlus.Settings.data.mediaMaxWidth;
        Chat.changeChatRoom = function (roomId){
            if (roomId === Chat.currentChatRoom.id)
            {
                swal({ title: "Sei già in questa chat", type: "info" });
                return false;
            }
            if(Chat.isCurrentUserStreamActive){
                ChattaPlus.WebRTC.Publisher.stopPublisher();
                ChattaPlus.WebRTC.Publisher.stopWebRTC();
            }
            ChattaPlus.WebRTC.Vocal.Stop();
            ChattaPlus.WebRTC.Vocal.Reset();
            ChattaPlus.WebRTC.Vocal.stopWebRTC();
            $(".chat-composer").empty();
            $(".chat-settings").empty();
            ChattaPlus.Settings.UI.settingsWindowWrapper.remove();
            Chat.leaveChatRoom();
            Chat.joinChatRoom(roomId);
            ChattaPlus.WebRTC.Vocal.UI.Init();
            ChattaPlus.Settings.UI.Init();
        };

        Chat.textToHtml = function (text){
            if (!text || $.trim(text).length == 0){
                return "";
            }
            var html = $.trim(text);

            if(ChattaPlus.Settings.data.capsFilter){
                html = ChattaPlus.Utils.CapsFilter(html);
            }
            
            //
            // NOTE: links and email addresses will not be rendered as <a>
            //

            // video - YouTube

            var videoWidth = ChattaPlus.Settings.data.bigYoutubePlayer ? ChattaPlus.Settings.data.bigYoutubePlayerWidth : Chat.mediaMaxWidth;
            var videoHeight = parseInt(videoWidth*9/16, 10);
            
            html = html.replace(/(http(s?):\/\/(www\.)?youtube.([a-zA-Z\.]{2,})\/watch\??(.*)v=([a-zA-Z0-9\-\_]*)(\S*))/im, "[video=$6]");
            html = html.replace(/(http(s?):\/\/(www\.)?youtu.be\/([a-zA-Z0-9\-\_]*)(\S*))/im, "[video=$4]");

            // New Youtube Regex, shorts support
            var yt_shorts = false;
            var matches = html.match(/((http(s?):\/\/)(www\.)?(youtu\.be|youtube\.com)\/(watch\?v=|embed|v|shorts|[^user])(\/)?(.*?((?=[&#?])|$))([\w\?#&=;]*)?)/im);
            if(matches && matches.length > 1){
                if(matches[6] == "shorts"){
                    yt_shorts = true;
                }
                html = html.replace(matches.input, "[video=" + matches[8] +"]");
            }

            if(yt_shorts){
                videoWidth = ChattaPlus.Settings.data.bigYoutubePlayer ? ChattaPlus.Settings.data.bigYoutubePlayerWidth : Chat.mediaMaxWidth;
                videoHeight = parseInt(videoWidth*16/9, 10);
            }

            html= html.replace(/(\[video\=([a-zA-Z0-9\-\_]*)\])/im, '<div class="youtubeplayer"><iframe title="Video (YouTube)" src="//www.youtube.com/embed/$2?rel=0" frameborder="0" width="' + videoWidth + '" height="' + videoHeight + '" allowfullscreen></iframe></div>');
         
            var doNotParseEmoji = false;

            // Vocals
            var matches = html.match(/(\[vocal\:([a-zA-Z0-9\-]*)\])/im);
            if(matches) {
                if(matches.length > 0){
                    if(matches[2].length > 0){
                        var id = matches[2];
                        if(ChattaPlus.WebRTC.Vocal.ids.includes(id)){
                            return;
                        }
                        ChattaPlus.WebRTC.Vocal.ids.push(id);
                        doNotParseEmoji = true;
                        html = html.replace(/(\[vocal\:([a-zA-Z0-9\-]*)\])/im, '<span class="sch_'+id+'">[vocal:'+id+']<br/></span><div class="sch_vocalPlayerContainer _hidden" id="sch_ws_$2"><div class="sch_vocalPlayer sch_player_'+id+'"></div/><div class="sch_vocalPlayerTogglePlay"></div><div class="sch_vocalPlayerTime" data-time="00:00"></div><div class="clear-fix"></div></div>'
                            +'<script>ChattaPlus.Utils.audioFileExists("'+id+'", (exist) => { if(exist){ $("span.sch_'+id+'").remove(); var ws = WaveSurfer.create({container: ".sch_player_'+id+'",waveColor: "#48cae4",progressColor: "#0096c7",height:30, barWidth:3});ws.load("https://vocal.schiatta.it/'+id+'"); ws.on("ready", () => { $("#sch_ws_'+id+' .sch_vocalPlayerTogglePlay").on("click",() =>{if(ws.isPlaying()){ws.pause(); $("#sch_ws_'+id+' .sch_vocalPlayerTogglePlay").removeClass("_playing");}else{ws.play(); $("#sch_ws_'+id+' .sch_vocalPlayerTogglePlay").addClass("_playing");} $("#sch_ws_'+id+' .sch_vocalPlayerTime").attr("data-time", ChattaPlus.Utils.timeFormatter(ws.getCurrentTime())); ws.on("audioprocess", () => {$("#sch_ws_'+id+' .sch_vocalPlayerTime").attr("data-time", ChattaPlus.Utils.timeFormatter(ws.getCurrentTime()));});}); ws.on("finish", () => {$(); $("#sch_ws_'+id+' .sch_vocalPlayerTogglePlay").removeClass("_playing"); $("#sch_ws_'+id+' .sch_vocalPlayerTime").attr("data-time", ChattaPlus.Utils.timeFormatter(ws.getCurrentTime()));}); });}else{$("#sch_ws_'+id+'").parent().remove()}});</script>');
                    }
                }
            }


            // TikTok
            var tiktok_matches = ChattaPlus.Utils.TikTok.matches(html);;
            if(tiktok_matches){
                var tiktok_html = ChattaPlus.Utils.TikTok.buildPreview(tiktok_matches);
                if(tiktok_html){
                    doNotParseEmoji = true;
                    html = html.replace(tiktok_matches.input, tiktok_html);
                }
            }


            // emoji
            if(!doNotParseEmoji){
                html = Emoji.replaceUnicodeCharacterWithShortcut(html);
                html = Emoji.replaceShortcutWithIcons(html);
            }

            // Caps Filter

            // user profile ("@nickname")
            html = html.replace(/(^|\s)+(?:@)([a-zA-Z0-9\.]{3,20})($|\s)+/gim, ' <a href="' + BaseLibrary.getUserProfileUrl("$2") + '" target="_blank">$2</a> ');
            
            // new line
            html =  html.replace(/\n/g, " "); // no <br>
            
            return html;
        };
        Chat.getCurrentUserStreamSettings = function (){
            return (!Chat.isCurrentUserStreamActive)
            ? {}
            : { isVideoEnabled: ChattaPlus.WebRTC.Publisher.videoEnabled, isAudioEnabled: ChattaPlus.WebRTC.Publisher.audioEnabled };
        };

        Chat.openCurrentUserStream = () => {
            Chat.$toggleCurrentUserStreamButton.addClass("active");
            var openStream = function (enableVideoRequestsModeration)
            {
                Chat.invokeApi("open-stream.ashx", { "id": Chat.currentChatRoom.id, "enableVideoRequestsModeration": (enableVideoRequestsModeration) ? "1" : "" }, 
                    function (data) 
                    {
                        var streamId = data;
                        ChattaPlus.WebRTC.Publisher.ToggleStream(streamId);                            
                    }, 
                    function (message)
                    {
                        Chat.closeCurrentUserStream();
                        swal({ title: message, type: "error" });
                    }, null);
            };
    
            // start
            swal({
                title: "Richiedi il consenso per visualizzare la tua webcam?",
                text: "Scegliendo 'sì' ti verrà mostrato un messaggio ogni volta che un altro utente richiederà l'accesso alla tua webcam.",
                type: "info",
                showCancelButton: true,
                cancelButtonText: "No, tutti possono vedermi",
                confirmButtonText: "Sì, richiedi consenso",
                closeOnConfirm: true
            },
            function (isConfirm) 
            {
                openStream(isConfirm);
            });        
        };

        Chat.closeCurrentUserStream = function (){
            Chat.closeAllCurrentUserStreamAccessRequestDialogs();
            Chat.$toggleCurrentUserStreamButton.removeClass("active");
            Chat.$usersPanel.find(".user").removeClass("viewer"); // reset viewers
            ChattaPlus.WebRTC.Publisher.ToggleStream();
            Chat.invokeApi("close-stream.ashx", { "id": Chat.currentChatRoom.id }, null, null, null); // no response                   
        };

        Chat.toggleUserStream = function (userId)
        {
            for (var i = 0; i < Chat.openedUserStreams.length; i++)
            {
                if (Chat.openedUserStreams[i] === userId)
                {
                    Chat.closeUserStream(userId);
                    return;
                }
            }
            Chat.openUserStream(userId);
        };

        Chat.openUserStream = function (userId)
        {
            Chat.closeUserStream(userId);
            Chat.openedUserStreams.push(userId);
            var $user = Chat.$usersPanel.find(".user[data-user-id='" + userId + "']");
            var nickname = $user.attr("data-nickname");
            $user.find("div.open-user-stream-button").addClass("active");
            var $userStreamWindow = $("<div>").addClass("chat-overlay-window chat-stream-viewer-window").attr("data-user-id", userId).appendTo($("body"));
            $("<div>").addClass("title").html(nickname).appendTo($userStreamWindow);
            $("<div>").addClass("window-control-button close").appendTo($userStreamWindow).attr("title", "Chiudi").tooltipster({ position: "top" }).on("click", function () { Chat.closeUserStream(userId); });
            $("<div>").addClass("window-control-button minimize").appendTo($userStreamWindow).attr("title", "Visualizzazione piccola").tooltipster({ position: "top" }).on("click", function () { $userStreamWindow.addClass("minimized"); });
            $("<div>").addClass("window-control-button maximize").appendTo($userStreamWindow).attr("title", "Visualizzazione grande").tooltipster({ position: "top" }).on("click", function () { $userStreamWindow.removeClass("minimized"); });
            var $playerContainer = $("<div>").addClass("player-container").appendTo($userStreamWindow).html("Caricamento in corso...");
            var top = 70 + (50 * (Chat.openedUserStreams.length - 1));
            var right = 20 + (50 * (Chat.openedUserStreams.length - 1));
            $userStreamWindow.css({ top: top + "px", right: right + "px" });
            $userStreamWindow.drags({ handle: "div.title" });
            var streamId;
            Chat.invokeApi("get-stream.ashx", { id: Chat.currentChatRoom.id, publisherId: userId, onlineUserStatus: Chatta.CurrentUser.OnlineUserStatus },
                function (data) 
                {
                    if (!data.id)
                    {
                        $playerContainer.empty().html("In attesa del consenso...");
                        return;
                    }
                    streamId = data.id;
                    Chat._createUserStreamPlayer($userStreamWindow, streamId);          
                }, 
                function (message)
                {
                    swal({ title: message, type: "error" });
                    $playerContainer.empty().html("Video non disponibile");
                }, null);
        };

        Chat._createUserStreamPlayer = function ($userStreamWindow, streamId){
            if (!streamId)
                return;
            if ($userStreamWindow.hasClass("preclip-active"))
            {
                Chat._createUserStreamPlayer($userStreamWindow, streamId);
                return;
            }
            var $playerContainer = $userStreamWindow.find(".player-container");
            $playerContainer.empty();

            var $player = $("<video autoplay controls playsinline width='100%' height='100%'></video>")
            .addClass("player")
            .attr('id', "video_" + streamId)
            .appendTo($playerContainer);

            const onPlayPeerConnected = () => {
                //state.playing = true;
                //hideErrorPanel();
                //$("#play-toggle").html("Stop");
                //$("#play-settings-form :input").prop("disabled", true);
                //$("#play-settings-form :button").prop("disabled", false);
                //$('#player-video').show();
               //$("#play-video-container").css("background-color","rgba(102, 102, 102, 0)")
            }
              
            const onPlayPeerConnectionStopped = () => {
                //state.playing = false;
                //$("#play-toggle").html("Play");
                //$("#play-settings-form :input").prop("disabled", false);
                //$('#player-video').hide();
                //$("#play-video-container").css("background-color","rgba(102, 102, 102, 1)")
            }
              
            // error Handler
            const errorHandler = (error) => {
                let message;
                if ( error.message ) {
                  message = error.message;
                }
                else {
                  message = error
                }
                console.log(message);
            };

            ChattaPlus.WebRTC.Player.OpenStream(streamId, errorHandler, onPlayPeerConnected, onPlayPeerConnectionStopped);
        };

        Chat.closeUserStream = function (userId){
            var $stream = $("body").find("div.chat-stream-viewer-window[data-user-id='" + userId + "']");
            if ($stream.hasClass("preclip-active")) // wait until video adv ends
                return false;
            var index = -1;
            for (var i = 0; i < Chat.openedUserStreams.length; i++)
            {
                if (Chat.openedUserStreams[i] === userId)
                {
                    index = i;
                    break;
                }
            }
            if (index < 0)
                return;
            Chat.openedUserStreams.splice(index, 1);
            Chat.$usersPanel.find(".user[data-user-id='" + userId + "'] div.open-user-stream-button").removeClass("active");
            $stream.remove();
            Chat.invokeApi("release-stream.ashx", { id: Chat.currentChatRoom.id, publisherId: userId }, null, null, null); // no feedback on success or error
        };
    },
    WebRTC: {
        sdpURL: 'wss://rtmp.schiatta.it/webrtc-session.json',
        applicationName: 'live',
        Publisher : {
            localVideo: null,
            localStream: null,
            autoStart: true,
            constraints: {
                video: {
                    width: { min: "640", ideal: "1280", max: "1920" },
                    height: { min: "360", ideal: "720", max: "1080" }
                },
                audio: {
                    channelCount: {
                        ideal: 1,
                        min: 1
                    },                
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            },
            media: {
                videoBitrate: 500,
                audioBitrate: 96,
                videoFrameRate: 15,
                videoCodec: '42e01f',
                audioCodec: 'opus'
            },
            connectionState: 'stopped',
            isScreenSharing:false,
            streamInfo: {
                applicationName: null,
                streamName: null,
                sessionId: '[empty]'
            },
            userData: {}, // ?
            audioEnabled: true,
            videoEnabled: true,
            useSoundMeter: false,
            UI: {
                liveIndicator: null,
                Init: () => {
                    var videoElement, videoOverlay, pictureInPictureButton, closeStreamButton = null;
                    var muted = true;           

                    // Publisher window
                    ChattaPlus.WebRTC.Publisher.UI.videoContainer = $('<div/>')
                    .addClass('sch_videoContainer sch_video-pub')
                    .attr('id', 'sch_videoContainer')
                    .on('mouseenter', () => {
                        videoOverlay.stop(true,true).fadeIn(100);
                    })
                    .on('mouseleave', () => {
                        videoOverlay.stop(true,true).fadeOut(250);
                    })
                    .hide();
        
                    ChattaPlus.WebRTC.Publisher.UI.liveIndicator = $('<div/>')
                    .addClass('sch_liveIndicator')
                    .hide();
    
                    ChattaPlus.WebRTC.Publisher.UI.toggleVideoButton = $('<div/>')
                    .addClass('sch_toggleVideoButton')
                    .on('click', (evt) => {
                        ChattaPlus.WebRTC.Publisher.videoEnabled = !ChattaPlus.WebRTC.Publisher.videoEnabled;
                        ChattaPlus.WebRTC.Publisher.setVideoState(ChattaPlus.WebRTC.Publisher.videoEnabled);
                        $(evt.target).toggleClass('_disabled');
                    });
    
                    ChattaPlus.WebRTC.Publisher.UI.toggleAudioButton = $('<div/>')
                    .addClass('sch_toggleAudioButton')
                    .on('click', (evt) => {
                        ChattaPlus.WebRTC.Publisher.audioEnabled = !ChattaPlus.WebRTC.Publisher.audioEnabled;
                        ChattaPlus.WebRTC.Publisher.setAudioState(ChattaPlus.WebRTC.Publisher.audioEnabled)
                        $(evt.target).toggleClass('_disabled');
                    });                    
    
                    pictureInPictureButton = $("<div/>")
                    .addClass('sch_pictureInPictureButton')
                    .on('click', () => {
                        if(ChattaPlus.WebRTC.Publisher.localVideo){
                            ChattaPlus.WebRTC.Publisher.localVideo.requestPictureInPicture();
                        }
                    });
    
                    videoOverlay = $("<div/>")
                    .addClass('sch_videoOverlay')
                    .append(ChattaPlus.WebRTC.Publisher.UI.toggleVideoButton)
                    .append(ChattaPlus.WebRTC.Publisher.UI.toggleAudioButton)
                    .append(pictureInPictureButton)
                    .hide();
    
                    videoElement = $("<video/>")
                    .addClass('sch_videoElement')
                    .attr('muted', muted ? '' : null)
                    .attr('autoplay', muted ? '' : null)
                    .attr('controls', false)
                    .attr('id', "vpe_" + Chatta.CurrentUser.Nickname);
                    
                    ChattaPlus.WebRTC.Publisher.UI.videoContainer.append(videoElement);
                    ChattaPlus.WebRTC.Publisher.UI.videoContainer.append(ChattaPlus.WebRTC.Publisher.UI.liveIndicator);
                    ChattaPlus.WebRTC.Publisher.UI.videoContainer.append(videoOverlay);

                    if(ChattaPlus.Settings.data.fixedPublisherWindow) {
                        closeStreamButton = $('<div/>')
                        .addClass('sch_closeStreamButton')
                        .on('click', () => {
                            ChattaPlus.WebRTC.Publisher.stopPublisher();
                            ChattaPlus.WebRTC.Publisher.stopWebRTC();
                        });

                        ChattaPlus.WebRTC.Publisher.UI.webcamTitle = $("<div/>")
                        .addClass('sch_webcamTitle')
                        .attr('data-title', 'La mia Webcam');

                        videoOverlay.append(ChattaPlus.WebRTC.Publisher.UI.webcamTitle);
                        videoOverlay.append(closeStreamButton);
                        ChattaPlus.WebRTC.Publisher.UI.videoContainer.addClass("fixedWindow");
                        $('.navbar').append(ChattaPlus.WebRTC.Publisher.UI.videoContainer);
                    }else{
                        ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow = $("<div/>").addClass("chat-overlay-window chat-stream-viewer-window owner");
                        $("<div>").addClass("title").html("La mia webcam").appendTo(ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow);
                        $("<div>").addClass("window-control-button close").appendTo(ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow).attr("title", "Disattiva la tua webcam").tooltipster({ position: "top" }).on("click", Chat.closeCurrentUserStream);
                        ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow.drags({ handle: "div.title" });
                        ChattaPlus.WebRTC.Publisher.UI.videoContainer.appendTo(ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow);
                        ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow.appendTo($("body")).hide();
                    }
                }
            },
            startWebRTC: () => {
                if(!ChattaPlus.Settings.data.fixedPublisherWindow){
                    if(ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow){
                        ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow.remove();
                        ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow = null;
                    }
                    if(!ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow){
                        ChattaPlus.WebRTC.Publisher.UI.Init();
                    }
                }else{
                    $('.gpt-ad-container').hide();
                }
    
                ChattaPlus.WebRTC.Publisher.localVideo = document.getElementById('vpe_' + Chatta.CurrentUser.Nickname);
                
                if(ChattaPlus.Settings.data.fixedPublisherWindow){
                    ChattaPlus.WebRTC.Publisher.UI.videoContainer.show();
                }else{
                    ChattaPlus.WebRTC.Publisher.UI.videoContainer.show();
                    ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow.show();
                }

                if(ChattaPlus.Settings.data.stereoAudio){
                    ChattaPlus.WebRTC.Publisher.constraints.audio.channelCount = {
                        ideal: 2,
                        min: 1
                    }
                }else{
                    ChattaPlus.WebRTC.Publisher.constraints.audio.channelCount = {
                        ideal: 1,
                        min: 1
                    }
                    ChattaPlus.WebRTC.Publisher.constraints.audio.channelCount = 1;
                }
                ChattaPlus.WebRTC.Publisher.constraints.audio.echoCancellation = ChattaPlus.Settings.data.echoCancellation;
                ChattaPlus.WebRTC.Publisher.constraints.audio.noiseSuppression = ChattaPlus.Settings.data.stereoAudio ? false : true;
    
                if(navigator.mediaDevices.getUserMedia)
                {
                    navigator.mediaDevices.getUserMedia(ChattaPlus.WebRTC.Publisher.constraints).then(ChattaPlus.WebRTC.Publisher.onGetUserMediaSuccess).catch(ChattaPlus.WebRTC.Publisher.onGetMediaError);
                    ChattaPlus.WebRTC.Publisher.newAPI = true;
                }
                else if (navigator.getUserMedia)
                {
                    navigator.getUserMedia(ChattaPlus.WebRTC.Publisher.constraints, ChattaPlus.WebRTC.Publisher.onGetUserMediaSuccess, ChattaPlus.WebRTC.Publisher.onGetMediaError);
                }
                else
                {
                    alert('Il tuo browser non supporta WebRTC, oppure è disabilitato.');
                }
                console.log('ChattaPlus.InitWebRTC: Complete' + (ChattaPlus.WebRTC.Publisher.newAPI ? ' (NewAPI)':''));
            },
            stopWebRTC: () => {
                if(ChattaPlus.WebRTC.Publisher.connectionState != 'stopped'){
                    console.log('ChattaPlus.stopWebRTC: Failed - Connection busy');
                    return;
                }
                ChattaPlus.WebRTC.Publisher.stopMediaAccess();
                Chat.$toggleCurrentUserStreamButton.removeClass("active");
                ChattaPlus.WebRTC.Publisher.UI.videoContainer.hide();
                if(!ChattaPlus.Settings.data.fixedPublisherWindow){
                    ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow.remove();
                    ChattaPlus.WebRTC.Publisher.UI.draggablePublisherWindow = null;
                }else{
                    $('.gpt-ad-container').show();
                }
            },
            errorHandler: (e) => {
                console.log(e);
            },
            onGetUserMediaSuccess: (stream) => {
                ChattaPlus.WebRTC.Publisher.localStream = stream;
                Chat.$toggleCurrentUserStreamButton.addClass("active");
                try{
                    ChattaPlus.WebRTC.Publisher.localVideo.srcObject = stream;
                    ChattaPlus.WebRTC.Publisher.localVideo.muted = true;
                } catch (error){
                    ChattaPlus.WebRTC.Publisher.localVideo.src = window.URL.createObjectURL(stream);
                    ChattaPlus.WebRTC.Publisher.localVideo.muted = true;
                }

                ChattaPlus.WebRTC.Publisher.setAudioState(ChattaPlus.WebRTC.Publisher.audioEnabled);
                ChattaPlus.WebRTC.Publisher.setVideoState(ChattaPlus.WebRTC.Publisher.videoEnabled);
                if(ChattaPlus.WebRTC.Publisher.pendingPublish){
                    ChattaPlus.WebRTC.Publisher.startPublisher();
                    ChattaPlus.WebRTC.Publisher.pendingPublish = false;
                }
            },
            stopMediaAccess: () => {
                ChattaPlus.WebRTC.Publisher.localVideo.srcObject = null;
                if(ChattaPlus.WebRTC.Publisher.localStream != null){
                    try {
                        ChattaPlus.WebRTC.Publisher.localStream.getAudioTracks().forEach(function(track) {
                            track.stop();
                        });
                    } catch(e) {
                        console.log(e);
                    }
                    try {
                        ChattaPlus.WebRTC.Publisher.localStream.getVideoTracks().forEach(function(track) {
                            track.stop();
                        });
                    } catch(e) {
                        console.log(e);
                    }
                    ChattaPlus.WebRTC.Publisher.localStream = null;
                }
            },
            onConnectionStateChange: (evt) => {
                if (evt.target != null && evt.target.connectionState != null)
                {
                    console.log('ChattaPlus.WebRTC: ' + evt.target.connectionState);
                    ChattaPlus.WebRTC.Publisher.connectionState = evt.target.connectionState;
                    if(ChattaPlus.WebRTC.Publisher.connectionState == 'connected'){
                        Chat.isCurrentUserStreamActive = true;
                        ChattaPlus.WebRTC.Publisher.UI.liveIndicator.show();
                        if(ChattaPlus.Settings.data.fixedPublisherWindow){
                            ChattaPlus.WebRTC.Publisher.UI.webcamTitle.addClass('_live');
                        }
                    }else{
                        Chat.isCurrentUserStreamActive = false;
                        ChattaPlus.WebRTC.Publisher.UI.liveIndicator.hide();
                        if(ChattaPlus.Settings.data.fixedPublisherWindow){
                            ChattaPlus.WebRTC.Publisher.UI.webcamTitle.removeClass('_live');
                        }
                    }
                }
            },
            onStop: () => {
                console.log('ChattaPlus.WebRTC: stopped');
                ChattaPlus.WebRTC.Publisher.connectionState = 'stopped';
                Chat.isCurrentUserStreamActive = false;

                if(ChattaPlus.Settings.data.fixedPublisherWindow){
                    $('.gpt-ad-container').show();
                    ChattaPlus.WebRTC.Publisher.UI.liveIndicator.hide();
                    ChattaPlus.WebRTC.Publisher.UI.webcamTitle.removeClass('_live');
                }else{
                    ChattaPlus.WebRTC.Publisher.UI.liveIndicator.hide();
                }
            },
            onStats: (stats) => {
                //console.log(stats);
            },
            startPublisher: () => {
                ChattaPlus.WebRTC.Publisher.userData = {
                    _appPrefix: ChattaPlus._appPrefix,
                    _appVersion: ChattaPlus._v,
                    _u: Chatta.CurrentUser.Nickname,
                    _s: ChattaPlus.WebRTC.Publisher.streamInfo.streamName
                }
                console.log('ChattaPlus.WebRTC: Start Publishing');
                WowzaPeerConnectionPublish.start({
                    wsURL:ChattaPlus.WebRTC.sdpURL,
                    localStream:ChattaPlus.WebRTC.Publisher.localStream,
                    streamInfo:ChattaPlus.WebRTC.Publisher.streamInfo,
                    mediaInfo:ChattaPlus.WebRTC.Publisher.mediaSettings,
                    userData:ChattaPlus.WebRTC.Publisher.userData,
                    mungeSDP:mungeSDPPublish,
                    onconnectionstatechange: ChattaPlus.WebRTC.Publisher.onConnectionStateChange,
                    onstop:ChattaPlus.WebRTC.Publisher.onStop,
                    onstats:ChattaPlus.WebRTC.Publisher.onStats || undefined,
                    onerror:ChattaPlus.WebRTC.Publisher.errorHandler
                  });
            },
            stopPublisher: () => {
                console.log('ChattaPlus.WebRTC: Stop Publishing');
                WowzaPeerConnectionPublish.stop();
            },
            ToggleStream: (streamId) => {
                if(Chat.isCurrentUserStreamActive){
                    ChattaPlus.WebRTC.Publisher.stopPublisher();
                    ChattaPlus.WebRTC.Publisher.stopWebRTC();
                }else{
                    if(streamId){
                        ChattaPlus.WebRTC.Publisher.streamInfo.applicationName = ChattaPlus.WebRTC.applicationName;
                        ChattaPlus.WebRTC.Publisher.streamInfo.streamName = streamId;
                        ChattaPlus.WebRTC.Publisher.startWebRTC();
                        if(ChattaPlus.WebRTC.Publisher.autoStart){
                            ChattaPlus.WebRTC.Publisher.pendingPublish = true;
                        }
                    }else{
                        console.log('ChattaPlus.ToggleStream: Failed - No streamId');
                    }
                }
            },
            setTrackState: (trackKind, state) => {
                if (ChattaPlus.WebRTC.Publisher.localStream != null && ChattaPlus.WebRTC.Publisher.localStream.getTracks != null) {
                    ChattaPlus.WebRTC.Publisher.localStream.getTracks().map((track) => {
                        if (track.kind === trackKind) {
                            track.enabled = state;
                        }
                    });
                }
            },
            setAudioState: (state) => {
                console.log('ChattaPlus.setAudioState:' + state);
                ChattaPlus.WebRTC.Publisher.setTrackState("audio", state);
            },
            setVideoState: (state) => {
                console.log('ChattaPlus.setVideoState:' + state);
                ChattaPlus.WebRTC.Publisher.setTrackState("video", state);
            },
            setDevice: (kind, deviceId, callback) => {
                if (ChattaPlus.WebRTC.Publisher.localStream != null && ChattaPlus.WebRTC.Publisher.localStream != null) {
                    ChattaPlus.WebRTC.Publisher.localStream.getTracks().forEach(function(track) {
                        track.stop();
                        ChattaPlus.WebRTC.Publisher.localStream.removeTrack(track);
                    });
                }

                if(kind == 'videoinput'){
                    if(deviceId){
                        ChattaPlus.Settings.data.stream.videoDeviceId = deviceId;
                        ChattaPlus.WebRTC.Publisher.constraints.video.deviceId = deviceId;
                    }
                }

                if(kind == 'audioinput'){
                    if(deviceId){
                        ChattaPlus.Settings.data.stream.audioDeviceId = deviceId;
                        ChattaPlus.WebRTC.Publisher.constraints.audio.deviceId = deviceId;
                    }
                }

                navigator.mediaDevices.getUserMedia(ChattaPlus.WebRTC.Publisher.constraints).then(function(stream) {
                    ChattaPlus.WebRTC.Publisher.replaceTracks(stream);
                    if(typeof callback === 'function'){
                        callback();
                    }
                }).catch(function(error) {
                    console.log(error);
                });
            },
            replaceTracks: (newStream) => {
                if(ChattaPlus.WebRTC.Publisher.localVideo != null && ChattaPlus.WebRTC.Publisher.localStream){
                    ChattaPlus.WebRTC.Publisher.localVideo.pause();
                    if (typeof ChattaPlus.WebRTC.Publisher.localVideo.srcObject === 'object') {
                        ChattaPlus.WebRTC.Publisher.localVideo.srcObject = null;
                    } else {
                        ChattaPlus.WebRTC.Publisher.localVideo.src = '';
                    }
                    ChattaPlus.WebRTC.Publisher.localVideo.src = null;
                
                    newStream.getTracks().forEach(function(track) {
                        ChattaPlus.WebRTC.Publisher.localStream.addTrack(track);
                        if(track.kind == 'video'){
                            if(!ChattaPlus.WebRTC.Publisher.videoEnabled){
                                track.enabled = false;
                            }
                            WowzaPeerConnectionPublish.replaceVideoTrack(track);
                        }
                        if(track.kind == 'audio'){
                            if(!ChattaPlus.WebRTC.Publisher.audioEnabled){
                                track.enabled = false;
                            }
                            WowzaPeerConnectionPublish.replaceAudioTrack(track);
                        }
                    });

                    if (typeof ChattaPlus.WebRTC.Publisher.localVideo.srcObject === 'object') {
                        ChattaPlus.WebRTC.Publisher.localVideo.srcObject = newStream;
                    } else {
                        ChattaPlus.WebRTC.Publisher.localVideo.src = window.URL.createObjectURL(newStream);
                    }
                    
                    ChattaPlus.WebRTC.Publisher.localVideo.onloadedmetadata = function(e) {
                        ChattaPlus.WebRTC.Publisher.localVideo.play();
                    };
                } else {
                    //console.log("localVideo or localStream undefined");
                }
            }
        },
        Player: {
            streams: [],
            play: (stream) => {
                console.log(stream);
                stream.WebRTCPlay = new WowzaPeerConnectionPlay({
                  sdpURL:ChattaPlus.WebRTC.sdpURL,
                  videoElement:stream.playerVideoElement,
                  streamInfo:stream.streamInfo,
                  userData:stream.userData,
                  mungeSDP:mungeSDPPlay,
                  onconnectionstatechange: stream.onConnectionStateChange,
                  onstop: stream.onStop,
                  onerror: ChattaPlus.WebRTC.Player.errorHandler
                });
                stream.WebRTCPlay.start();
            },
            stop: (stream) => {
                stream.WebRTCPlay.stop();
                stream.WebRTCPlay = undefined;
                ChattaPlus.WebRTC.Player.streams = ChattaPlus.WebRTC.Player.streams.filter(function(item) {
                    return item !== stream
                });
                console.log(ChattaPlus.WebRTC.Player.streams);
            },
            errorHandler: (error) =>  {
                console.log('WowzaWebRTCPlay ERROR:');
                console.log(error);
                if (error.message == null)
                {
                  if (error.target != null)
                  {
                    console.log('typeof error.target: ' + typeof error.target);
                  }
                }
            },
            OpenStream : (streamId) => {
                var stream = {
                    connectionState: 'stopped',
                    playerVideoElement: document.getElementById("video_" + streamId),
                    streamInfo: {
                        applicationName: ChattaPlus.WebRTC.applicationName,
                        streamName: streamId,
                        sessionId: "[empty]"
                    },
                    userData: {},
                    WebRTCPlay: null
                }

                stream.onConnectionStateChange = (evt) => {
                    if (evt.target != null && evt.target.connectionState != null)
                    {
                      stream.connectionState = evt.target.connectionState;
                    }
                }
                stream.onStop = () => {
                    self.connectionState = 'stopped';
                }

                ChattaPlus.WebRTC.Player.play(stream);  
                ChattaPlus.WebRTC.Player.streams.push(stream);                
                console.log(ChattaPlus.WebRTC.Player.streams);
            }
        },
        Vocal: {
            localStream: null,
            isRecording: false,
            recordInterval: null,
            recordTime: 0,
            localStream: null,
            hasRecording: false,
            recordingBlob: null,
            localAudioPreview: null,
            ids: [],
            constraints: {
                video: false,
                audio: {
                    channelCount: {
                        ideal: 1,
                        min: 1
                    },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            },
            UI: {
                Init: () => {
                    if($(".chat-composer").children().length < 1){
                        setTimeout(ChattaPlus.WebRTC.Vocal.UI.Init, 250);
                        return;
                    }

                    ChattaPlus.WebRTC.Vocal.UI.vocalContainer = $("<div/>")
                    .addClass('sch_vocalContainer').hide();

                    ChattaPlus.WebRTC.Vocal.UI.vocalTimer = $("<div/>")
                    .addClass('sch_vocalTimer')
                    .attr('data-time', '00:00');

                    ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton = $("<div/>")
                    .addClass('sch_vocalPreviewButton _disabled')
                    .attr("title", "Anteprima");

                    ChattaPlus.WebRTC.Vocal.UI.audioPreview = new window.Audio();

                    ChattaPlus.WebRTC.Vocal.UI.vocalSendButton = $("<div/>")
                    .addClass('sch_vocalSendButton _disabled')
                    .attr("title", "Invia");

                    ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton = $("<div/>")
                    .addClass("sch_toggleRecordButton _disabled")
                    .attr("title", "Registra")
                    .on('click', (evt)=> {
                        if(ChattaPlus.WebRTC.Vocal.isRecording){
                            ChattaPlus.WebRTC.Vocal.Stop();
                        }else{
                            if(ChattaPlus.WebRTC.Vocal.hasRecording){
                                ChattaPlus.WebRTC.Vocal.Reset();
                            }else {
                                ChattaPlus.WebRTC.Vocal.Record();
                            }
                        }
                    });

                    ChattaPlus.WebRTC.Vocal.UI.toggleVocalRecorderButton = $("<div/>")
                    .addClass("sch_toggleVocalRecorderButton")
                    .attr("title", "Registra messaggio vocale")
                    .on('click', (evt) => {
                        if(!ChattaPlus.WebRTC.Vocal.isRecording){
                            ChattaPlus.WebRTC.Vocal.UI.ToggleRecorder();
                        }
                    });

                    ChattaPlus.WebRTC.Vocal.UI.vocalContainer.append(ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton);
                    ChattaPlus.WebRTC.Vocal.UI.vocalContainer.append(ChattaPlus.WebRTC.Vocal.UI.vocalTimer);
                    ChattaPlus.WebRTC.Vocal.UI.vocalContainer.append(ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton);
                    ChattaPlus.WebRTC.Vocal.UI.vocalContainer.append(ChattaPlus.WebRTC.Vocal.UI.vocalSendButton);

                    $(".chat-composer").append(ChattaPlus.WebRTC.Vocal.UI.toggleVocalRecorderButton);
                    $(".chat-composer").append(ChattaPlus.WebRTC.Vocal.UI.vocalContainer);
                    console.log("Vocal Ui initialized");
                },
                ToggleRecorder: () => {
                    if(ChattaPlus.WebRTC.Vocal.localStream != null){
                        ChattaPlus.WebRTC.Vocal.UI.vocalContainer.slideToggle(250);
                        ChattaPlus.WebRTC.Vocal.stopWebRTC();
                    }else{
                        ChattaPlus.WebRTC.Vocal.UI.vocalContainer.slideToggle(250);
                        ChattaPlus.WebRTC.Vocal.startWebRTC();
                    }
                }
            },
            recordedChunks: [],
            onGetUserMediaSuccess: (stream) => {
                var options;
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    options = {
                        mimeType: 'audio/webm; codecs=opus',
                        audioBitsPerSecond: 96000
                    };
                } else {
                    console.log("Cannot find a valid supported codec.");
                }
                ChattaPlus.WebRTC.Vocal.localStream = stream;
                ChattaPlus.WebRTC.Vocal.mediaRecorder = new MediaRecorder(stream, options);
                ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.removeClass('_disabled');
            },
            onGetUserMediaError: () => {
                console.log("ChattaPlus.WebRTC.Vocal.onGetUserMediaError");
            },
            startWebRTC: () => {
                if(ChattaPlus.Settings.data.stereoAudio){
                    ChattaPlus.WebRTC.Vocal.constraints.audio.channelCount = {
                        ideal: 2,
                        min: 1
                    }
                }else{
                    ChattaPlus.WebRTC.Vocal.constraints.audio.channelCount = {
                        ideal: 1,
                        min: 1
                    }
                }
                ChattaPlus.WebRTC.Vocal.constraints.audio.echoCancellation = ChattaPlus.Settings.data.echoCancellation;
                ChattaPlus.WebRTC.Vocal.constraints.audio.noiseSuppression = ChattaPlus.Settings.data.stereoAudio ? false : true;

                if(navigator.mediaDevices.getUserMedia)
                {
                    navigator.mediaDevices.getUserMedia(ChattaPlus.WebRTC.Vocal.constraints).then(ChattaPlus.WebRTC.Vocal.onGetUserMediaSuccess).catch(ChattaPlus.WebRTC.Vocal.onGetMediaError);
                    ChattaPlus.WebRTC.Vocal.newAPI = true;
                }
                else if (navigator.getUserMedia)
                {
                    navigator.getUserMedia(ChattaPlus.WebRTC.Vocal.constraints, ChattaPlus.WebRTC.Vocal.onGetUserMediaSuccess, ChattaPlus.WebRTC.Vocal.onGetMediaError);
                }
                else
                {
                    alert('Il tuo browser non supporta WebRTC, oppure è disabilitato.');
                }
            },
            stopWebRTC: () => {
                ChattaPlus.WebRTC.Vocal.stopMediaAccess();
            },
            stopMediaAccess: () => {
                if(ChattaPlus.WebRTC.Vocal.localStream != null){
                    try {
                        ChattaPlus.WebRTC.Vocal.localStream.getAudioTracks().forEach(function(track) {
                            track.stop();
                        });
                    } catch(e) {
                        console.log(e);
                    }
                    try {
                        ChattaPlus.WebRTC.Vocal.localStream.getVideoTracks().forEach(function(track) {
                            track.stop();
                        });
                    } catch(e) {
                        console.log(e);
                    }
                    ChattaPlus.WebRTC.Vocal.localStream = null;
                }
            },
            handleDataAvailable: (event) => {
                if (event.data.size > 0) {
                    ChattaPlus.WebRTC.Vocal.recordedChunks.push(event.data);
                    //console.log("handleDataAvailable");
                } else {
                    //console.log("size is 0");
                }
            },
            Reset: () => {
                clearInterval(ChattaPlus.WebRTC.Vocal.localAudioPreviewInterval);
                ChattaPlus.WebRTC.Vocal.blob = null;
                ChattaPlus.WebRTC.Vocal.recordedChunks = [];
                ChattaPlus.WebRTC.Vocal.recordTime = 0;
                ChattaPlus.WebRTC.Vocal.hasRecording = false;
                ChattaPlus.WebRTC.Vocal.isRecording = false;
                ChattaPlus.WebRTC.Vocal.UI.vocalTimer.removeClass("_recording");
                ChattaPlus.WebRTC.Vocal.UI.vocalTimer.attr("data-time", "00:00");
                ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.removeClass("_recording");
                ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.removeClass('_reset');
                ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.attr('title', 'Registra');
                ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.removeClass('_playing');
                ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.addClass('_disabled');
                ChattaPlus.WebRTC.Vocal.UI.vocalSendButton.addClass('_disabled');
                ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.off('click');
                ChattaPlus.WebRTC.Vocal.UI.vocalSendButton.off('click');
                if(ChattaPlus.WebRTC.Vocal.localAudioPreview != null){
                    ChattaPlus.WebRTC.Vocal.localAudioPreview.src = null;
                    ChattaPlus.WebRTC.Vocal.localAudioPreview = null;
                }
            },
            Record: () => {
                if(ChattaPlus.WebRTC.Vocal.mediaRecorder && !ChattaPlus.WebRTC.Vocal.isRecording){
                    ChattaPlus.WebRTC.Vocal.UI.vocalTimer.addClass("_recording");
                    ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.addClass("_recording");
                    ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.attr('title', 'Stop');
                    setTimeout(() => {
                        ChattaPlus.WebRTC.Vocal.mediaRecorder.ondataavailable = ChattaPlus.WebRTC.Vocal.handleDataAvailable;
                        ChattaPlus.WebRTC.Vocal.mediaRecorder.start(100);
                        ChattaPlus.WebRTC.Vocal.isRecording = true;
                        ChattaPlus.WebRTC.Vocal.recordInterval = setInterval(() => {
                            ChattaPlus.WebRTC.Vocal.recordTime++;
                            ChattaPlus.WebRTC.Vocal.UI.vocalTimer.attr('data-time', "00:" + (ChattaPlus.WebRTC.Vocal.recordTime>9?""+ChattaPlus.WebRTC.Vocal.recordTime:"0"+ChattaPlus.WebRTC.Vocal.recordTime));
                            if(ChattaPlus.WebRTC.Vocal.recordTime >= ChattaPlus.Settings.data.maxVocalRecordTime){
                                console.log("Max record time reached, stopping");
                                ChattaPlus.WebRTC.Vocal.Stop();
                            }
                        },1000);
                        console.log("Started recording");
                    }, 250);
                }
            },
            Stop: () => {     
                if(ChattaPlus.WebRTC.Vocal.isRecording){
                    ChattaPlus.WebRTC.Vocal.UI.vocalTimer.removeClass("_recording");
                    ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.removeClass("_recording");
                    ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.addClass('_reset');
                    ChattaPlus.WebRTC.Vocal.UI.toggleRecordButton.attr('title', 'Cancella');
                    ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.removeClass('_disabled');
                    ChattaPlus.WebRTC.Vocal.UI.vocalSendButton.removeClass('_disabled');
                    clearInterval(ChattaPlus.WebRTC.Vocal.recordInterval);
                    ChattaPlus.WebRTC.Vocal.recordInterval = null;
                    setTimeout(() => {
                        ChattaPlus.WebRTC.Vocal.mediaRecorder.stop();
                        ChattaPlus.WebRTC.Vocal.isRecording = false;
                        ChattaPlus.WebRTC.Vocal.hasRecording = true;
                        var blob = new Blob(ChattaPlus.WebRTC.Vocal.recordedChunks, {
                            type: 'audio/webm'
                        });
                        ChattaPlus.WebRTC.Vocal.blob = blob;
                        ChattaPlus.WebRTC.Vocal.createLocalPreviewPlayer(ChattaPlus.WebRTC.Vocal.blob);
                    }, 500);
                }
            },
            createLocalPreviewPlayer: (blob) => {
                ChattaPlus.WebRTC.Vocal.localAudioPreview = new window.Audio();
                var blobURL = URL.createObjectURL(blob);
                ChattaPlus.WebRTC.Vocal.localAudioPreview.src = blobURL;
                ChattaPlus.WebRTC.Vocal.localAudioPreview.addEventListener('play', () => {
                    ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.addClass('_playing');
                });
                ChattaPlus.WebRTC.Vocal.localAudioPreview.addEventListener('pause', () => {
                    ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.removeClass('_playing');
                    ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.addClass('_paused');
                    clearInterval(ChattaPlus.WebRTC.Vocal.localAudioPreviewInterval);
                });
                ChattaPlus.WebRTC.Vocal.localAudioPreview.addEventListener('ended', () => {
                    ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.removeClass('_paused');
                    ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.removeClass('_playing');
                    clearInterval(ChattaPlus.WebRTC.Vocal.localAudioPreviewInterval);
                });
                ChattaPlus.WebRTC.Vocal.UI.vocalPreviewButton.removeClass('_disabled')
                .on('click', () => {
                    if(ChattaPlus.WebRTC.Vocal.localAudioPreview != null){
                        if(ChattaPlus.WebRTC.Vocal.localAudioPreview.paused || ChattaPlus.WebRTC.Vocal.localAudioPreview.ended){
                            ChattaPlus.WebRTC.Vocal.localAudioPreviewInterval = setInterval(() => {
                                ChattaPlus.WebRTC.Vocal.UI.vocalTimer.attr('data-time', ChattaPlus.Utils.timeFormatter(ChattaPlus.WebRTC.Vocal.localAudioPreview.currentTime));
                            },100);
                            ChattaPlus.WebRTC.Vocal.localAudioPreview.play();
                        } else {
                            clearInterval(ChattaPlus.WebRTC.Vocal.localAudioPreviewInterval);
                            ChattaPlus.WebRTC.Vocal.localAudioPreview.pause();
                        }
                    }
                });

                ChattaPlus.WebRTC.Vocal.UI.vocalSendButton.removeClass('_disabled')
                .on('click', () => {
                    ChattaPlus.WebRTC.Vocal.uploadVocal();
                });
            },
            uploadVocal: () => {
                var formData = new FormData();
                formData.append('blobAudio', ChattaPlus.WebRTC.Vocal.blob, "sch_audio");
                $.ajax({
                    type: "POST",
                    url: "https://vocal.schiatta.it/upload.php",
                    data: formData,
                    cache: false,
                    processData: false,
                    contentType: false
                })
                .done((data) => {
                    var json = JSON.parse(data);
                    if(json.success){
                        ChattaPlus.WebRTC.Vocal.sendVocalMessageInChat(json.id);
                        ChattaPlus.WebRTC.Vocal.Reset();
                    }
                });
            },
            setDevice: (deviceId, callback) => {
                if(deviceId){
                    ChattaPlus.Settings.data.vocal.audioDeviceId = deviceId;
                    ChattaPlus.WebRTC.Vocal.constraints.audio.deviceId = deviceId;
                }

                if(ChattaPlus.WebRTC.Vocal.localStream != null){
                    ChattaPlus.WebRTC.Vocal.stopMediaAccess();
                    ChattaPlus.WebRTC.Vocal.startWebRTC();
                }
                if(typeof callback === 'function'){
                    callback();
                }
            },
            renderizeVocalMessage:(id, recipient) => {
                var sent = new Date();
                var currentUserInRoom = Chat.getUserInRoom(Chatta.CurrentUser.UserId);
                var currentUserType = (currentUserInRoom) ? Chat.getUserType( currentUserInRoom ) : Chat.UserType.Member;
                var message = {
                    from: { id: Chatta.CurrentUser.UserId, nickname: Chatta.CurrentUser.Nickname, avatarId: Chat.userAvatarId, gender: Chatta.CurrentUser.Gender, userType: currentUserType },
                    sent: "oggi " + sent.getHours() + ":" + sent.getMinutes(),
                    timestamp: null,
                    to: recipient,
                    text: "[vocal:"+id+"]",
                    type: Chat.MessageType.Text
                };
                if (Chat.userTextColor){
                    message["textColor"] = Chat.userTextColor;
                }
                Chat.queueRenderMessage(message, false, true);
            },
            sendVocalMessageInChat: (id) => {
                var data = {
                    "id": Chat.currentChatRoom.id,
                    "text": "[vocal:"+id+"]"
                };

                if (Chat.userTextColor){
                    data["textColor"] = Chat.userTextColor;
                }

                var directMessageRecipient = ChattaPlus.Utils.getDirectMessageRecipient(true);

                if (directMessageRecipient != null)
                {
                    data["toUserId"] = directMessageRecipient.id;
                    $(".chat-composer textarea").val("@" + directMessageRecipient.nickname + " ");
                }

                if (Chat.enableWebSocket && Chat.webSocket && Chat.webSocketIsOpen)
                {
                    data.type = "SendMessage";
                    Chat.webSocket.send(JSON.stringify(data));
                }
                else
                    Chat.invokeApi("send-message.ashx", data, null, null, null);

                ChattaPlus.WebRTC.Vocal.renderizeVocalMessage(id, directMessageRecipient);
            }
        }
    },
    Utils: {
        timeFormatter: (t) => {
            const time = new Date(null);
            time.setSeconds(t);
            return ("0" + time.getMinutes() + ":" + (time.getSeconds()>9?time.getSeconds():"0"+time.getSeconds()));
        },
        getDirectMessageRecipient: (removeFromTextbox) => {
            var $textbox = $(".chat-composer textarea");
            var text = $.trim($textbox.val());
            var re = /^@([a-zA-Z0-9\.]{3,20})($|\s)+/gim;
            var matches = re.exec(text);
            var user = null;
            if (matches != null)
            {
                var nickname = matches[1];
                user = Chat.getUserInRoomByNickname(matches[1]);
                if (removeFromTextbox && user != null)
                    $textbox.val(text.replace(re, ""));
            }
            return user;		 
        },
        audioFileExists: (id, callback) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => {
                if (xhr.status == 200) {
                    callback(true);
                } else {
                    callback(false);
                }
            };
            xhr.open('HEAD', 'https://vocal.schiatta.it/'+id);
            xhr.send();
        },
        TikTok: {
            index: 0,
            pattern: /(?=(\s*))\1(?:<a [^>]*?>)??(?=(\s*))\2(?:https?:)??(?:\/\/)??(?:w{3}\.)??(?:tiktok\.com)\/(@[\w\.]+?)\/video\/(\d{19})(?:[^\s<>]*?)??(?=(\s*))\5(?:<\/a>)??(?=(\s*))\6/im,
            matches: (str) => {
                var matches = str.match(ChattaPlus.Utils.TikTok.pattern);
                if(matches){
                    if(matches.length > 3){
                        var media = {
                            input: matches.input,
                            user: matches[3],
                            id: matches[4]
                        }
                        return media;
                    }
                }
                return false;
            },
            buildPreview: (media) => {
                if(!media){
                    return false;
                }
                var embed = ChattaPlus.Utils.TikTok.buildEmbed(media);
                var hideTikTokLabel = "nascondi TikTok";
                var showTikTokLabel = "visualizza TikTok";
                var label = hideTikTokLabel;
                if (!Chat.showMediaContents)
                {
                    $(embed).hide();
                    label = showTikTokLabel;
                }
                var preview = `<span class="button-show-media tiktok" onclick="(()=>{var self=$(this); var embed=self.parent().find('blockquote'); self.html((embed.is(':visible')?'visualizza TikTok':'nascondi TikTok'));embed.slideToggle();})();"> ` + label + `</span>`;
                var out = embed + preview;
                out += '<script async defer src="https://www.tiktok.com/embed.js"></script>';
                ChattaPlus.Utils.TikTok.index++;
                return out;
            },
            buildEmbed: (media) => {
                if(!media){
                    return false;
                }
                var out = '<blockquote';
                out += ` class="sch_tiktokEmbed tiktok-embed"`;
                out += ` cite="https://www.tiktok.com/${media.user}/video/${media.id}"`;
                out += ` data-video-id="${media.id}"`;
                out += ` style="width: `+ Chat.mediaMaxWidth +`px;`
                if (!Chat.showMediaContents)
                {
                    out += ` display: none;`
                }                
                out += `">`;
                out += '<section></section>';
                out += '</blockquote>';
                return out;
            }
        },
        CapsFilter: (s) => {
            var rs = s.replace(/[^a-zA-Z]/g,'');
            var sl = rs.length;
            var nu = sl - rs.replace(/[A-Z]/g,'').length;
            var nl = sl - rs.replace(/[a-z]/g,'').length;
            if (sl>10&&nu>nl) {
              s = s.toLowerCase();
            }
            return s;
        },
        LocalStorage: {
            isAvailable: () => {
                return ((window.localStorage)?1:0);               
            },
            Save: (key, value) => {
                if(ChattaPlus.Utils.LocalStorage.isAvailable()){
                    window.localStorage.setItem(key, JSON.stringify(value));
                }else{
                    // Cookies fallback
                }
            },
            Read: (key) => {
                if(ChattaPlus.Utils.LocalStorage.isAvailable()){
                    return JSON.parse(window.localStorage.getItem(key));
                }else{
                    // Cookies fallback
                }
            }
        }
    }
}

ChattaPlus.Init();